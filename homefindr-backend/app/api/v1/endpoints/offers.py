"""
Offer endpoints — submit, view, update status (agent/seller), counter.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import Offer, OfferStatus, Property, User, UserRole
from app.schemas.schemas import MessageResponse, OfferCreate, OfferOut, OfferUpdate
from app.api.v1.deps import CurrentUser

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    body: OfferCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Offer:
    """Submit an offer on a property (buyers only)."""
    if current_user.role not in (UserRole.buyer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only buyers can submit offers")

    # Validate property exists and is active
    prop_result = await db.execute(
        select(Property).where(Property.id == body.property_id)
    )
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.status not in ("active", "pending"):
        raise HTTPException(status_code=400, detail="Property is not available for offers")

    # Prevent duplicate active offer from same buyer
    existing = await db.execute(
        select(Offer).where(
            Offer.property_id == body.property_id,
            Offer.buyer_id == current_user.id,
            Offer.status.notin_([OfferStatus.rejected, OfferStatus.withdrawn]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You already have an active offer on this property")

    offer = Offer(
        property_id=body.property_id,
        buyer_id=current_user.id,
        offer_price=body.offer_price,
        down_payment_pct=body.down_payment_pct,
        preferred_closing_date=body.preferred_closing_date,
        contingencies=body.contingencies,
        notes=body.notes,
        status=OfferStatus.sent,
    )
    db.add(offer)
    await db.flush()
    return offer


@router.get("/me", response_model=List[OfferOut])
async def my_offers(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """List all offers submitted by the current buyer."""
    result = await db.execute(
        select(Offer)
        .where(Offer.buyer_id == current_user.id)
        .order_by(desc(Offer.created_at))
    )
    return result.scalars().all()


@router.get("/property/{property_id}", response_model=List[OfferOut])
async def offers_for_property(
    property_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """
    List all offers on a property (agent who owns it or admin).
    Buyers see only their own offers.
    """
    prop_result = await db.execute(select(Property).where(Property.id == property_id))
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    stmt = select(Offer).where(Offer.property_id == property_id)

    if current_user.role == UserRole.buyer:
        stmt = stmt.where(Offer.buyer_id == current_user.id)
    elif current_user.role == UserRole.agent and prop.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    result = await db.execute(stmt.order_by(desc(Offer.created_at)))
    return result.scalars().all()


@router.get("/{offer_id}", response_model=OfferOut)
async def get_offer(
    offer_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Offer:
    """Get a single offer. Buyer sees own; agent sees offers on their listings."""
    offer = await _get_offer_or_404(offer_id, db)
    _assert_offer_access(offer, current_user, db)
    return offer


@router.patch("/{offer_id}", response_model=OfferOut)
async def update_offer(
    offer_id: str,
    body: OfferUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Offer:
    """
    Update offer status or add a counter-price.
    - Agents can mark reviewed, countered, accepted, rejected.
    - Buyers can withdraw their own offers.
    """
    offer = await _get_offer_or_404(offer_id, db)

    if current_user.role == UserRole.buyer:
        if offer.buyer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your offer")
        if body.status and body.status != OfferStatus.withdrawn:
            raise HTTPException(status_code=403, detail="Buyers can only withdraw offers")
    elif current_user.role == UserRole.agent:
        prop_result = await db.execute(select(Property).where(Property.id == offer.property_id))
        prop = prop_result.scalar_one_or_none()
        if not prop or prop.agent_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your listing")

    for key, value in body.model_dump(exclude_none=True).items():
        setattr(offer, key, value)

    # If accepted — mark property as pending
    if body.status == OfferStatus.accepted:
        prop_result2 = await db.execute(select(Property).where(Property.id == offer.property_id))
        if p := prop_result2.scalar_one_or_none():
            from app.models.models import PropertyStatus
            p.status = PropertyStatus.pending

    return offer


@router.delete("/{offer_id}", response_model=MessageResponse)
async def withdraw_offer(
    offer_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Buyer withdraws their own offer."""
    offer = await _get_offer_or_404(offer_id, db)
    if offer.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your offer")
    offer.status = OfferStatus.withdrawn
    return MessageResponse(message="Offer withdrawn")


# ── Helpers ───────────────────────────────────────────────────────────

async def _get_offer_or_404(offer_id: str, db: AsyncSession) -> Offer:
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


def _assert_offer_access(offer: Offer, user: User, db) -> None:
    if user.role == UserRole.admin:
        return
    if user.role == UserRole.buyer and offer.buyer_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
