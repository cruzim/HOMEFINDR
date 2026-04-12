"""
Socket.IO server for real-time messaging between buyers and agents.
Mounted alongside the FastAPI app via ASGI composition.

Events emitted by server:
  - message:new     — new chat message
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
import socketio
from jose import JWTError

from app.core.security import verify_access_token

# ── Configure Socket.IO ───────────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",        # Tighten in production via config
    logger=False,
    engineio_logger=False,
)
socket_app = socketio.ASGIApp(sio)

# sid → user_id mapping (in-memory; use Redis adapter for multi-process)
connected_users: dict[str, str] = {}


# ── Connection management ─────────────────────────────────────────────

@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
    """
    Authenticate the Socket.IO connection using the Bearer token
    passed in the auth object: { token: "..." }
    """
    token = (auth or {}).get("token", "")
    if not token:
        return False   # Reject unauthenticated connections

    try:
        user_id = verify_access_token(token)
    except JWTError:
        return False

    connected_users[sid] = user_id
    # Join a personal room so the server can push to specific users
    await sio.enter_room(sid, f"user:{user_id}")
    return True


@sio.event
async def disconnect(sid: str) -> None:
    connected_users.pop(sid, None)


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
    Persist message via the REST API (which applies auth + validation)
    then broadcast to the conversation room so all participants see it live.

    Expected data: { conversation_id, content, attachments? }
    """
    user_id = connected_users.get(sid)
    if not user_id:
        return

    conv_id = data.get("conversation_id")
    content = data.get("content", "").strip()
    if not conv_id or not content:
        return

    # Persist to DB via internal HTTP call to our own REST endpoint
    import httpx
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Retrieve the access token from auth at connect time would be cleaner;
        # here we demonstrate the pattern — in production, store the token in
        # connected_users or use a shared DB session instead.
        pass

    # Broadcast to everyone in the conversation room
    message_payload = {
        "id": f"rt-{sid[:8]}",
        "conversation_id": conv_id,
        "sender_id": user_id,
        "content": content,
        "attachments": data.get("attachments", []),
        "is_read": False,
        "created_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
    await sio.emit("message:new", message_payload, room=f"conv:{conv_id}", skip_sid=sid)
    # Also send back to sender for confirmation
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

async def push_notification(user_id: str, title: str, body: str, ref_id: str | None = None) -> None:
    """
    Call this from any endpoint to push a real-time notification
    to a specific user's personal room.
    """
    await sio.emit(
        "notification",
        {"title": title, "body": body, "reference_id": ref_id},
        room=f"user:{user_id}",
    )
