"""
Shared helper for creating in-app notifications.
Import and call create_notification() from any endpoint before flush.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    type_: str,
    reference_id: str | None = None,
) -> None:
    """Add a Notification row. Must be called before db.flush()/commit()."""
    db.add(Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=type_,
        reference_id=reference_id,
    ))