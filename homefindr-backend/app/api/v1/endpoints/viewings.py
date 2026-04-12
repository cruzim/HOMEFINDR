"""
Viewing (property tour) scheduling endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import Property, User, UserRole, Viewing, ViewingStatus
from app.schemas.schemas import MessageResponse, ViewingCreate, ViewingOut, ViewingUpdate
from app.api.v1.deps import CurrentUser

router = APIRouter(prefix="/viewings", tags=["viewings"])


@router.post("", response_model=ViewingOut, status_code=status.HTTP_201_CREATED)
async def schedule_viewing(
    body: ViewingCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Viewing:
    """Book a viewing for a property."""
    prop_result = await db.execute(
        select(Property).where(Property.id == body.property_id)
    )
    if not prop_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Property not found")

    viewing = Viewing(
        property_id=body.property_id,
        buyer_id=current_user.id,
        scheduled_at=body.scheduled_at,
        notes=body.notes,
        contact_name=body.contact_name or current_user.full_name,
        contact_email=body.contact_email or current_user.email,
        contact_phone=body.contact_phone or current_user.phone,
        status=ViewingStatus.scheduled,
    )
    db.add(viewing)
    await db.flush()
    return viewing


@router.get("/me", response_model=List[ViewingOut])
async def my_viewings(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """List all viewings scheduled by the current buyer."""
    result = await db.execute(
        select(Viewing)
        .where(Viewing.buyer_id == current_user.id)
        .order_by(desc(Viewing.scheduled_at))
    )
    return result.scalars().all()


@router.get("/agent/upcoming", response_model=List[ViewingOut])
async def agent_upcoming_viewings(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Agent sees viewings scheduled for their listings."""
    if current_user.role not in (UserRole.agent, UserRole.admin):
        raise HTTPException(status_code=403, detail="Agents only")

    result = await db.execute(
        select(Viewing)
        .join(Property, Property.id == Viewing.property_id)
        .where(Property.agent_id == current_user.id)
        .where(Viewing.status == ViewingStatus.scheduled)
        .order_by(Viewing.scheduled_at)
    )
    return result.scalars().all()


@router.patch("/{viewing_id}", response_model=ViewingOut)
async def update_viewing(
    viewing_id: str,
    body: ViewingUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Viewing:
    """Reschedule or update viewing status."""
    result = await db.execute(select(Viewing).where(Viewing.id == viewing_id))
    viewing: Viewing | None = result.scalar_one_or_none()
    if not viewing:
        raise HTTPException(status_code=404, detail="Viewing not found")

    # Only the buyer or the listing agent can update
    if viewing.buyer_id != current_user.id and current_user.role not in (UserRole.agent, UserRole.admin):
        raise HTTPException(status_code=403, detail="Access denied")

    for key, value in body.model_dump(exclude_none=True).items():
        setattr(viewing, key, value)

    return viewing


@router.delete("/{viewing_id}", response_model=MessageResponse)
async def cancel_viewing(
    viewing_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Cancel a scheduled viewing."""
    result = await db.execute(select(Viewing).where(Viewing.id == viewing_id))
    viewing: Viewing | None = result.scalar_one_or_none()
    if not viewing:
        raise HTTPException(status_code=404, detail="Viewing not found")
    if viewing.buyer_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")

    viewing.status = ViewingStatus.cancelled
    return MessageResponse(message="Viewing cancelled")
