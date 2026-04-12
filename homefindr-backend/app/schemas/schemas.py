"""
Pydantic v2 schemas — request validation and response serialization.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from app.models.models import (
    OfferStatus, PaymentStatus, PropertyStatus, PropertyType,
    UserRole, ViewingStatus,
)


# ── Shared ────────────────────────────────────────────────────────────

class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


# ── User schemas ──────────────────────────────────────────────────────

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.buyer

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    notif_push: Optional[bool] = None
    notif_email: Optional[bool] = None
    notif_sms: Optional[bool] = None


class UserOut(OrmBase):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    photo_url: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime


class AgentOut(OrmBase):
    id: str
    full_name: str
    photo_url: Optional[str]
    phone: Optional[str]
    email: str
    is_verified: bool


# ── Auth schemas ──────────────────────────────────────────────────────

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class GoogleAuthCode(BaseModel):
    code: str
    redirect_uri: str


# ── Property schemas ──────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=300)
    description: Optional[str] = None
    address: str = Field(..., min_length=5)
    area: str
    city: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: int = Field(..., gt=0)
    property_type: PropertyType
    beds: int = Field(..., ge=0, le=50)
    baths: float = Field(..., ge=0, le=50)
    sqft: int = Field(..., gt=0)
    lot_size: Optional[float] = None
    year_built: Optional[int] = Field(None, ge=1900, le=2030)
    commission_pct: float = Field(5.0, ge=0, le=20)
    amenities: List[str] = []
    highlights: List[str] = []
    images: List[str] = []
    virtual_tour_url: Optional[str] = None
    video_url: Optional[str] = None
    open_houses: List[dict] = []


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = Field(None, gt=0)
    status: Optional[PropertyStatus] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    open_houses: Optional[List[dict]] = None
    virtual_tour_url: Optional[str] = None
    video_url: Optional[str] = None


class PropertyFilters(BaseModel):
    location: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    property_types: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    has_virtual_tour: Optional[bool] = None
    status: Optional[PropertyStatus] = PropertyStatus.active
    sort_by: str = "newest"   # newest | price_asc | price_desc | best_match
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PropertyOut(OrmBase):
    id: str
    title: str
    description: Optional[str]
    address: str
    area: str
    city: str
    state: str
    latitude: Optional[float]
    longitude: Optional[float]
    price: int
    original_price: Optional[int]
    property_type: str
    beds: int
    baths: float
    sqft: int
    lot_size: Optional[float]
    year_built: Optional[int]
    status: PropertyStatus
    is_featured: bool
    has_virtual_tour: bool
    virtual_tour_url: Optional[str]
    video_url: Optional[str]
    images: list
    amenities: list
    highlights: list
    price_history: list
    open_houses: list
    schools: list
    nearby_amenities: list
    view_count: int
    save_count: int
    days_on_market: int
    agent: AgentOut
    created_at: datetime


class PropertyListOut(BaseModel):
    items: List[PropertyOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Offer schemas ─────────────────────────────────────────────────────

class OfferCreate(BaseModel):
    property_id: str
    offer_price: int = Field(..., gt=0)
    down_payment_pct: float = Field(20.0, ge=0, le=100)
    preferred_closing_date: Optional[datetime] = None
    contingencies: List[str] = []
    notes: Optional[str] = None


class OfferUpdate(BaseModel):
    status: Optional[OfferStatus] = None
    counter_price: Optional[int] = None
    notes: Optional[str] = None


class OfferOut(OrmBase):
    id: str
    property_id: str
    buyer_id: str
    offer_price: int
    down_payment_pct: float
    preferred_closing_date: Optional[datetime]
    contingencies: list
    notes: Optional[str]
    status: OfferStatus
    counter_price: Optional[int]
    created_at: datetime
    updated_at: datetime


# ── Payment schemas ───────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    offer_id: str
    amount: int = Field(..., gt=0)
    description: str


class PaymentIntentOut(BaseModel):
    payment_id: str
    client_secret: str
    amount: int
    currency: str
    status: PaymentStatus


class PaymentOut(OrmBase):
    id: str
    offer_id: str
    amount: int
    currency: str
    status: PaymentStatus
    description: str
    created_at: datetime


# ── Viewing schemas ───────────────────────────────────────────────────

class ViewingCreate(BaseModel):
    property_id: str
    scheduled_at: datetime
    notes: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class ViewingUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[ViewingStatus] = None
    notes: Optional[str] = None


class ViewingOut(OrmBase):
    id: str
    property_id: str
    buyer_id: str
    scheduled_at: datetime
    status: ViewingStatus
    notes: Optional[str]
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    created_at: datetime


# ── Message / Conversation schemas ────────────────────────────────────

class ConversationCreate(BaseModel):
    agent_id: str
    property_id: Optional[str] = None
    first_message: str = Field(..., min_length=1)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    attachments: List[dict] = []


class MessageOut(OrmBase):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    attachments: list
    is_read: bool
    created_at: datetime


class ConversationOut(OrmBase):
    id: str
    property_id: Optional[str]
    buyer_id: str
    agent_id: str
    last_message_at: Optional[datetime]
    messages: List[MessageOut] = []
    created_at: datetime


# ── SavedSearch schemas ───────────────────────────────────────────────

class SavedSearchCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    filters: dict


class SavedSearchOut(OrmBase):
    id: str
    name: str
    filters: dict
    new_results: int
    total_results: int
    last_run_at: Optional[datetime]
    created_at: datetime


# ── Notification schemas ──────────────────────────────────────────────

class NotificationOut(OrmBase):
    id: str
    title: str
    body: str
    type: str
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime


# ── Generic responses ─────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class HealthCheck(BaseModel):
    status: str
    version: str
    environment: str
