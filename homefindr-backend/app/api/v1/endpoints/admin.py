"""
Admin-only endpoints for platform analytics and listing moderation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import (
    Conversation, Message, Offer, Payment, PaymentStatus,
    Property, PropertyStatus, User, UserRole, Viewing,
)
from app.schemas.schemas import MessageResponse, PropertyOut
from app.api.v1.deps import AdminOnly

router = APIRouter()


@router.get("/stats")
async def platform_stats(
    _: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return key platform metrics for the admin dashboard."""

    async def count(model, *filters):
        result = await db.execute(
            select(func.count()).select_from(model).where(*filters)
        )
        return result.scalar_one()

    async def sum_col(col, *filters):
        stmt = select(func.coalesce(func.sum(col), 0)).where(*filters)
        result = await db.execute(stmt)
        return result.scalar_one()

    total_users = await count(User)
    total_buyers = await count(User, User.role == UserRole.buyer)
    total_agents = await count(User, User.role == UserRole.agent)
    active_listings = await count(Property, Property.status == PropertyStatus.active)
    pending_listings = await count(Property, Property.status == PropertyStatus.draft)
    total_offers = await count(Offer)
    total_viewings = await count(Viewing)
    revenue_naira = await sum_col(Payment.amount, Payment.status == PaymentStatus.succeeded)

    return {
        "users": {
            "total": total_users,
            "buyers": total_buyers,
            "agents": total_agents,
        },
        "listings": {
            "active": active_listings,
            "pending_review": pending_listings,
        },
        "activity": {
            "total_offers": total_offers,
            "total_viewings": total_viewings,
        },
        "revenue_naira": revenue_naira,
    }


@router.get("/listings/pending", response_model=list[PropertyOut])
async def pending_listings(
    _: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return all draft/pending listings awaiting review."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Property)
        .where(Property.status == PropertyStatus.draft)
        .options(selectinload(Property.agent))
        .order_by(Property.created_at)
    )
    return result.scalars().all()


@router.post("/listings/{property_id}/approve", response_model=MessageResponse)
async def approve_listing(
    property_id: str,
    _: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Approve a draft listing — makes it publicly visible."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop: Property | None = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.status = PropertyStatus.active
    return MessageResponse(message="Listing approved and is now live")


@router.post("/listings/{property_id}/reject", response_model=MessageResponse)
async def reject_listing(
    property_id: str,
    _: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Reject / take down a listing."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop: Property | None = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.status = PropertyStatus.rejected
    return MessageResponse(message="Listing rejected")


@router.post("/listings/{property_id}/feature", response_model=MessageResponse)
async def toggle_featured(
    property_id: str,
    _: AdminOnly,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Toggle featured status for a listing."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop: Property | None = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.is_featured = not prop.is_featured
    label = "featured" if prop.is_featured else "unfeatured"
    return MessageResponse(message=f"Listing is now {label}")