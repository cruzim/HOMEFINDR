"""
Socket.IO server for real-time messaging between buyers and agents.
Mounted alongside the FastAPI app via ASGI composition.

Events emitted by server:
  - message:new     — new chat message (persisted)
  - typing:start    — user started typing
  - typing:stop     — user stopped typing
  - notification    — push notification to a specific user

Events received from client:
  - join_conversation   — subscribe to a conversation room
  - leave_conversation  — unsubscribe
  - send_message        — new message (persisted + broadcast)
  - typing_start        — typing indicator
  - typing_stop         — stop typing indicator
"""
import uuid
from datetime import datetime, timezone

import socketio
from jose import JWTError

from app.core.config import settings
from app.core.security import verify_access_token

# ── Allowed origins (kept in sync with CORSMiddleware in main.py) ─────
_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://homefindr.vercel.app",
    "https://homefindr-frontend.vercel.app",
]

# ── Configure Socket.IO ───────────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=_ALLOWED_ORIGINS,
    logger=False,
    engineio_logger=False,
)
socket_app = socketio.ASGIApp(sio)

# sid → user_id mapping (in-memory; use Redis adapter for multi-process)
connected_users: dict[str, str] = {}
# sid → access_token mapping (needed for authenticated DB writes)
connected_tokens: dict[str, str] = {}


# ── Connection management ─────────────────────────────────────────────

@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
    """
    Authenticate the Socket.IO connection using the Bearer token
    passed in the auth object: { token: "..." }
    """
    token = (auth or {}).get("token", "")
    if not token:
        return False

    try:
        user_id = verify_access_token(token)
    except JWTError:
        return False

    connected_users[sid] = user_id
    connected_tokens[sid] = token
    await sio.enter_room(sid, f"user:{user_id}")
    return True


@sio.event
async def disconnect(sid: str) -> None:
    connected_users.pop(sid, None)
    connected_tokens.pop(sid, None)


# ── Conversation rooms ────────────────────────────────────────────────

@sio.event
async def join_conversation(sid: str, data: dict) -> None:
    """Client joins the room for a specific conversation."""
    conv_id = data.get("conversation_id")
    if conv_id:
        await sio.enter_room(sid, f"conv:{conv_id}")


@sio.event
async def leave_conversation(sid: str, data: dict) -> None:
    conv_id = data.get("conversation_id")
    if conv_id:
        await sio.leave_room(sid, f"conv:{conv_id}")


# ── Messaging ─────────────────────────────────────────────────────────

@sio.event
async def send_message(sid: str, data: dict) -> None:
    """
    Persist message to DB then broadcast to the conversation room.
    Expected data: { conversation_id, content, attachments? }
    """
    user_id = connected_users.get(sid)
    if not user_id:
        return

    conv_id = data.get("conversation_id")
    content = (data.get("content") or "").strip()
    if not conv_id or not content:
        return

    # Persist to DB directly (avoids the HTTP round-trip placeholder)
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.models import Conversation, Message
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            # Verify conversation exists and user is a participant
            result = await db.execute(
                select(Conversation).where(Conversation.id == conv_id)
            )
            conv = result.scalar_one_or_none()
            if not conv:
                return
            if conv.buyer_id != user_id and conv.agent_id != user_id:
                return

            msg = Message(
                conversation_id=conv_id,
                sender_id=user_id,
                content=content,
                attachments=data.get("attachments", []),
            )
            db.add(msg)
            conv.last_message_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(msg)

            message_payload = {
                "id": msg.id,
                "conversation_id": conv_id,
                "sender_id": user_id,
                "content": content,
                "attachments": data.get("attachments", []),
                "is_read": False,
                "created_at": msg.created_at.isoformat(),
            }
    except Exception:
        # Fallback: broadcast an ephemeral payload so UI isn't blocked
        message_payload = {
            "id": f"rt-{uuid.uuid4().hex[:8]}",
            "conversation_id": conv_id,
            "sender_id": user_id,
            "content": content,
            "attachments": data.get("attachments", []),
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # Broadcast to room (skip sender) then echo back to sender
    await sio.emit("message:new", message_payload, room=f"conv:{conv_id}", skip_sid=sid)
    await sio.emit("message:new", message_payload, to=sid)


# ── Typing indicators ─────────────────────────────────────────────────

@sio.event
async def typing_start(sid: str, data: dict) -> None:
    user_id = connected_users.get(sid)
    conv_id = data.get("conversation_id")
    if user_id and conv_id:
        await sio.emit(
            "typing:start",
            {"conversation_id": conv_id, "user_id": user_id},
            room=f"conv:{conv_id}",
            skip_sid=sid,
        )


@sio.event
async def typing_stop(sid: str, data: dict) -> None:
    user_id = connected_users.get(sid)
    conv_id = data.get("conversation_id")
    if user_id and conv_id:
        await sio.emit(
            "typing:stop",
            {"conversation_id": conv_id, "user_id": user_id},
            room=f"conv:{conv_id}",
            skip_sid=sid,
        )


# ── Server-push utility ───────────────────────────────────────────────

async def push_notification(
    user_id: str, title: str, body: str, ref_id: str | None = None
) -> None:
    """
    Call from any endpoint to push a real-time notification
    to a specific user's personal room.
    """
    await sio.emit(
        "notification",
        {"title": title, "body": body, "reference_id": ref_id},
        room=f"user:{user_id}",
    )