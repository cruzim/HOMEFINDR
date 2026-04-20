"""
User profile, saved searches, and notifications endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Notification, SavedSearch, User, UserRole
from app.schemas.schemas import (
    MessageResponse, NotificationOut, SavedSearchCreate,
    SavedSearchOut, UserOut, UserUpdate,
)
from app.api.v1.deps import AdminOnly, CurrentUser

router = APIRouter()


# ── Profile ───────────────────────────────────────────────────────────

@router.patch("/me", response_model=UserOut)
async def update_profile(
    body: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update the current user's profile."""
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, key, value)
    return current_user


# ── Saved Searches ────────────────────────────────────────────────────

@router.get("/me/saved-searches", response_model=List[SavedSearchOut])
async def get_saved_searches(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    result = await db.execute(
        select(SavedSearch)
        .where(SavedSearch.user_id == current_user.id)
        .order_by(desc(SavedSearch.created_at))
    )
    return result.scalars().all()


@router.post("/me/saved-searches", response_model=SavedSearchOut, status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    body: SavedSearchCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> SavedSearch:
    search = SavedSearch(
        user_id=current_user.id,
        name=body.name,
        filters=body.filters,
    )
    db.add(search)
    await db.flush()
    return search


@router.delete("/me/saved-searches/{search_id}", response_model=MessageResponse)
async def delete_saved_search(
    search_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.user_id == current_user.id,
        )
    )
    search = result.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    await db.delete(search)
    return MessageResponse(message="Saved search deleted")


# ── Notifications ─────────────────────────────────────────────────────

@router.get("/me/notifications", response_model=List[NotificationOut])
async def get_notifications(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    return result.scalars().all()


@router.post("/me/notifications/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    from sqlalchemy import update
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    return MessageResponse(message="All notifications marked as read")


# ── Admin user management ─────────────────────────────────────────────

@router.get("", response_model=List[UserOut])
async def list_users(
    _: AdminOnly,
    role: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Admin: list all users with optional role filter."""
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/{user_id}/toggle-active", response_model=UserOut)
async def toggle_user_active(
    user_id: str,
    admin: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Admin: activate or deactivate a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    return user

# ── Public user lookup (no admin required) ────────────────────────────

from app.schemas.schemas import AgentOut

@router.get("/{user_id}/public", response_model=AgentOut)
async def get_public_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Return a user's public profile (name, photo, role). Used by messages page."""
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user