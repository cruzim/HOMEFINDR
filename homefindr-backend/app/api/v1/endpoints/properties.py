"""
Property endpoints — browse, search, create, edit, delete, save/unsave.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    Property, PropertyStatus, SavedProperty, User, UserRole,
)
from app.schemas.schemas import (
    MessageResponse, PropertyCreate, PropertyListOut,
    PropertyOut, PropertyUpdate,
)
from app.api.v1.deps import AgentOrAdmin, CurrentUser

router = APIRouter()


def _property_query(stmt):
    """Always eager-load the agent relationship."""
    return stmt.options(selectinload(Property.agent))


@router.get("", response_model=PropertyListOut)
async def list_properties(
    city: Optional[str] = None,
    area: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    beds: Optional[int] = None,
    baths: Optional[float] = None,
    property_type: Optional[str] = None,
    status: Optional[PropertyStatus] = PropertyStatus.active,
    has_virtual_tour: Optional[bool] = None,
    sort_by: str = Query("newest", pattern="^(newest|price_asc|price_desc|best_match)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PropertyListOut:
    """
    Public search endpoint with full filtering and pagination.
    No auth required.
    """
    stmt = select(Property)

    # Filters
    if status:
        stmt = stmt.where(Property.status == status)
    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city}%"))
    if area:
        stmt = stmt.where(Property.area.ilike(f"%{area}%"))
    if min_price:
        stmt = stmt.where(Property.price >= min_price)
    if max_price:
        stmt = stmt.where(Property.price <= max_price)
    if beds:
        stmt = stmt.where(Property.beds >= beds)
    if baths:
        stmt = stmt.where(Property.baths >= baths)
    if property_type:
        stmt = stmt.where(Property.property_type == property_type)
    if has_virtual_tour is not None:
        stmt = stmt.where(Property.has_virtual_tour == has_virtual_tour)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Sorting
    if sort_by == "price_asc":
        stmt = stmt.order_by(asc(Property.price))
    elif sort_by == "price_desc":
        stmt = stmt.order_by(desc(Property.price))
    else:
        stmt = stmt.order_by(desc(Property.created_at))

    # Pagination
    offset = (page - 1) * page_size
    stmt = _property_query(stmt).offset(offset).limit(page_size)

    result = await db.execute(stmt)
    properties = result.scalars().all()

    return PropertyListOut(
        items=properties,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/search", response_model=PropertyListOut)
async def search_properties(
    q: str = Query(..., min_length=2),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PropertyListOut:
    """Full-text search across address, city, area, and description."""
    like = f"%{q}%"
    stmt = (
        select(Property)
        .where(Property.status == PropertyStatus.active)
        .where(
            or_(
                Property.address.ilike(like),
                Property.city.ilike(like),
                Property.area.ilike(like),
                Property.description.ilike(like),
                Property.title.ilike(like),
            )
        )
        .order_by(desc(Property.created_at))
    )

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(
        _property_query(stmt).offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()

    return PropertyListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/featured", response_model=List[PropertyOut])
async def featured_properties(
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return featured/promoted listings for the homepage."""
    result = await db.execute(
        _property_query(
            select(Property)
            .where(Property.status == PropertyStatus.active)
            .where(Property.is_featured == True)
            .order_by(desc(Property.created_at))
            .limit(limit)
        )
    )
    return result.scalars().all()


# ── IMPORTANT: all static sub-paths must come BEFORE /{property_id} ──

@router.get("/saved/me", response_model=List[PropertyOut])
async def my_saved_properties(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return all properties saved by the current user."""
    result = await db.execute(
        _property_query(
            select(Property)
            .join(SavedProperty, SavedProperty.property_id == Property.id)
            .where(SavedProperty.user_id == current_user.id)
            .order_by(desc(SavedProperty.created_at))
        )
    )
    return result.scalars().all()


@router.get("/my-listings", response_model=PropertyListOut)
async def my_listings(
    current_user: AgentOrAdmin,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PropertyListOut:
    """Return all listings created by the authenticated agent (or all for admin)."""
    if current_user.role == UserRole.admin:
        stmt = select(Property)
    else:
        stmt = select(Property).where(Property.agent_id == current_user.id)

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(
        _property_query(stmt)
        .order_by(desc(Property.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()

    return PropertyListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


# ── Dynamic path routes ───────────────────────────────────────────────

@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
) -> Property:
    """Get a single property by ID. Also increments the view counter."""
    result = await db.execute(
        _property_query(select(Property).where(Property.id == property_id))
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    prop.view_count += 1
    return prop


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    current_user: AgentOrAdmin,
    db: AsyncSession = Depends(get_db),
) -> Property:
    """Create a new listing (agent or admin only)."""
    prop = Property(
        **body.model_dump(exclude_none=True),
        agent_id=current_user.id,
        status=PropertyStatus.draft,
        has_virtual_tour=bool(body.virtual_tour_url),
        price_history=[{"date": "today", "price": body.price, "event": "Listed"}],
    )
    db.add(prop)
    await db.flush()
    await db.refresh(prop, ["agent"])
    return prop


@router.patch("/{property_id}", response_model=PropertyOut)
async def update_property(
    property_id: str,
    body: PropertyUpdate,
    current_user: AgentOrAdmin,
    db: AsyncSession = Depends(get_db),
) -> Property:
    """Update a listing. Agents may only edit their own; admins can edit any."""
    result = await db.execute(
        _property_query(select(Property).where(Property.id == property_id))
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if current_user.role == UserRole.agent and prop.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    data = body.model_dump(exclude_none=True)

    if "price" in data and data["price"] != prop.price:
        history = list(prop.price_history or [])
        history.append({"date": "today", "price": data["price"], "event": "Price Updated"})
        data["price_history"] = history
        data["original_price"] = prop.original_price or prop.price

    for key, value in data.items():
        setattr(prop, key, value)

    if "virtual_tour_url" in data:
        prop.has_virtual_tour = bool(data["virtual_tour_url"])

    return prop


@router.delete("/{property_id}", response_model=MessageResponse)
async def delete_property(
    property_id: str,
    current_user: AgentOrAdmin,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete a listing (agent own / admin any)."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if current_user.role == UserRole.agent and prop.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    await db.delete(prop)
    return MessageResponse(message="Listing deleted")


@router.post("/{property_id}/save", response_model=MessageResponse)
async def save_property(
    property_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Toggle save/unsave a property for the current buyer."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Property not found")

    existing = await db.execute(
        select(SavedProperty).where(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id,
        )
    )
    saved = existing.scalar_one_or_none()

    if saved:
        await db.delete(saved)
        prop_res = await db.execute(select(Property).where(Property.id == property_id))
        if p := prop_res.scalar_one_or_none():
            p.save_count = max(0, p.save_count - 1)
        return MessageResponse(message="Removed from saved")

    db.add(SavedProperty(user_id=current_user.id, property_id=property_id))
    prop_res2 = await db.execute(select(Property).where(Property.id == property_id))
    if p2 := prop_res2.scalar_one_or_none():
        p2.save_count += 1
    return MessageResponse(message="Saved successfully")