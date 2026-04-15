"""
Messaging endpoints — conversations and messages between buyers and agents.
Real-time delivery is handled by Socket.IO (see socketio_app.py).
These REST endpoints handle persistence and history.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import Conversation, Message, User, UserRole
from app.schemas.schemas import (
    ConversationCreate, ConversationOut, MessageCreate, MessageOut,
)
from app.api.v1.deps import CurrentUser

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return all conversations for the current user (buyer or agent)."""
    stmt = (
        select(Conversation)
        .where(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.agent_id == current_user.id,
            )
        )
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    body: ConversationCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Conversation:
    """
    Start a new conversation thread between buyer and agent.
    Idempotent — returns existing conversation if one already exists
    for the same buyer/agent/property triple.
    """
    if current_user.role not in (UserRole.buyer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only buyers can start conversations")

    # Check existing
    stmt = select(Conversation).where(
        Conversation.buyer_id == current_user.id,
        Conversation.agent_id == body.agent_id,
    )
    if body.property_id:
        stmt = stmt.where(Conversation.property_id == body.property_id)

    existing = await db.execute(stmt.options(selectinload(Conversation.messages)))
    conv: Conversation | None = existing.scalar_one_or_none()

    if conv:
        msg = Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=body.first_message,
        )
        db.add(msg)
        conv.last_message_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(conv, ["messages"])
        return conv

    conv = Conversation(
        buyer_id=current_user.id,
        agent_id=body.agent_id,
        property_id=body.property_id,
    )
    db.add(conv)
    await db.flush()

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=body.first_message,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(conv, ["messages"])
    return conv


# ── IMPORTANT: /conversations/{conv_id}/messages must come before
#    /conversations/{conv_id} so FastAPI doesn't treat "messages" as
#    a conv_id value on GET requests.

@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
async def get_messages(
    conv_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Get the full message history for a conversation."""
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv: Conversation | None = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _assert_conv_access(conv, current_user)

    msgs = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
    )
    return msgs.scalars().all()


@router.post("/conversations/{conv_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    conv_id: str,
    body: MessageCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Message:
    """Send a message in an existing conversation."""
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv: Conversation | None = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _assert_conv_access(conv, current_user)

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=body.content,
        attachments=body.attachments,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.flush()
    return msg


@router.get("/conversations/{conv_id}", response_model=ConversationOut)
async def get_conversation(
    conv_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Conversation:
    """Get a single conversation with all messages."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.messages))
    )
    conv: Conversation | None = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _assert_conv_access(conv, current_user)
    return conv


@router.post("/conversations/{conv_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    conv_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Mark all unread messages in a conversation as read."""
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv: Conversation | None = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _assert_conv_access(conv, current_user)

    await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.sender_id != current_user.id,
            Message.is_read == False,
        )
        .values(is_read=True)
    )


@router.get("/unread-count")
async def unread_count(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return total unread message count for the current user."""
    result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.agent_id == current_user.id,
            )
        )
        .where(Message.sender_id != current_user.id)
        .where(Message.is_read == False)
    )
    count = result.scalar_one()
    return {"unread": count}


# ── Helper ────────────────────────────────────────────────────────────

def _assert_conv_access(conv: Conversation, user: User) -> None:
    if user.role == UserRole.admin:
        return
    if conv.buyer_id != user.id and conv.agent_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")