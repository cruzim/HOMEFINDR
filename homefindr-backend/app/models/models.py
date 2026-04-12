"""
SQLAlchemy ORM models for HomeFindr.
All monetary values are stored in Naira kobo (integer) to avoid floating-point issues.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, Numeric,
    String, Text, JSON, Float, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.session import Base


# ── Enums ─────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    buyer = "buyer"
    agent = "agent"
    admin = "admin"


class PropertyStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    sold = "sold"
    draft = "draft"
    rejected = "rejected"


class PropertyType(str, enum.Enum):
    detached_duplex = "Detached Duplex"
    semi_detached = "Semi-Detached Duplex"
    terrace = "Terrace House"
    bungalow = "Detached Bungalow"
    flat = "Flat/Apartment"
    mini_flat = "Mini Flat"
    commercial = "Commercial"


class OfferStatus(str, enum.Enum):
    sent = "sent"
    reviewed = "reviewed"
    countered = "countered"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"


class ViewingStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


# ── User ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.buyer, nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)

    # Notification prefs
    notif_push: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_sms: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    properties: Mapped[List["Property"]] = relationship(
        back_populates="agent", foreign_keys="Property.agent_id"
    )
    offers_made: Mapped[List["Offer"]] = relationship(
        back_populates="buyer", foreign_keys="Offer.buyer_id"
    )
    saved_properties: Mapped[List["SavedProperty"]] = relationship(back_populates="user")
    saved_searches: Mapped[List["SavedSearch"]] = relationship(back_populates="user")
    viewings: Mapped[List["Viewing"]] = relationship(
        back_populates="buyer", foreign_keys="Viewing.buyer_id"
    )
    sent_messages: Mapped[List["Message"]] = relationship(
        back_populates="sender", foreign_keys="Message.sender_id"
    )


# ── Property ──────────────────────────────────────────────────────────

class Property(Base):
    __tablename__ = "properties"

    # Identity
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. Ikoyi
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Coordinates
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Pricing — stored as integer Naira (not kobo)
    price: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    original_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    commission_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=5.0)

    # Specs
    property_type: Mapped[PropertyType] = mapped_column(Enum(PropertyType), nullable=False, index=True)
    beds: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    baths: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False)
    sqft: Mapped[int] = mapped_column(Integer, nullable=False)
    lot_size: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    year_built: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Status & badges
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus), default=PropertyStatus.draft, nullable=False, index=True
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    has_virtual_tour: Mapped[bool] = mapped_column(Boolean, default=False)
    virtual_tour_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Analytics
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    save_count: Mapped[int] = mapped_column(Integer, default=0)
    days_on_market: Mapped[int] = mapped_column(Integer, default=0)

    # JSON columns for flexible data
    images: Mapped[list] = mapped_column(JSON, default=list)          # list[str] URLs
    amenities: Mapped[list] = mapped_column(JSON, default=list)        # list[str]
    highlights: Mapped[list] = mapped_column(JSON, default=list)       # list[str]
    price_history: Mapped[list] = mapped_column(JSON, default=list)    # list[{date, price, event}]
    open_houses: Mapped[list] = mapped_column(JSON, default=list)      # list[{date, start, end}]
    schools: Mapped[list] = mapped_column(JSON, default=list)
    nearby_amenities: Mapped[list] = mapped_column(JSON, default=list)

    # Agent FK
    agent_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    # Relationships
    agent: Mapped["User"] = relationship(back_populates="properties", foreign_keys=[agent_id])
    offers: Mapped[List["Offer"]] = relationship(back_populates="property")
    viewings: Mapped[List["Viewing"]] = relationship(back_populates="property")
    saved_by: Mapped[List["SavedProperty"]] = relationship(back_populates="property")


# ── SavedProperty ─────────────────────────────────────────────────────

class SavedProperty(Base):
    __tablename__ = "saved_properties"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)

    user: Mapped["User"] = relationship(back_populates="saved_properties")
    property: Mapped["Property"] = relationship(back_populates="saved_by")


# ── SavedSearch ───────────────────────────────────────────────────────

class SavedSearch(Base):
    __tablename__ = "saved_searches"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)
    new_results: Mapped[int] = mapped_column(Integer, default=0)
    total_results: Mapped[int] = mapped_column(Integer, default=0)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="saved_searches")


# ── Offer ─────────────────────────────────────────────────────────────

class Offer(Base):
    __tablename__ = "offers"

    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)
    buyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    offer_price: Mapped[int] = mapped_column(Integer, nullable=False)
    down_payment_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=20.0)
    preferred_closing_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contingencies: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[OfferStatus] = mapped_column(
        Enum(OfferStatus), default=OfferStatus.sent, nullable=False, index=True
    )
    counter_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    property: Mapped["Property"] = relationship(back_populates="offers")
    buyer: Mapped["User"] = relationship(back_populates="offers_made", foreign_keys=[buyer_id])
    payments: Mapped[List["Payment"]] = relationship(back_populates="offer")


# ── Payment ───────────────────────────────────────────────────────────

class Payment(Base):
    __tablename__ = "payments"

    offer_id: Mapped[str] = mapped_column(ForeignKey("offers.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    amount: Mapped[int] = mapped_column(Integer, nullable=False)    # Naira
    currency: Mapped[str] = mapped_column(String(10), default="ngn")
    description: Mapped[str] = mapped_column(String(300), nullable=False)

    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.pending, nullable=False
    )
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    stripe_client_secret: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    offer: Mapped["Offer"] = relationship(back_populates="payments")


# ── Viewing ───────────────────────────────────────────────────────────

class Viewing(Base):
    __tablename__ = "viewings"

    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)
    buyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ViewingStatus] = mapped_column(
        Enum(ViewingStatus), default=ViewingStatus.scheduled, nullable=False
    )

    # Buyer contact snapshot (in case not registered)
    contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    property: Mapped["Property"] = relationship(back_populates="viewings")
    buyer: Mapped["User"] = relationship(back_populates="viewings", foreign_keys=[buyer_id])


# ── Conversation & Message ────────────────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    property_id: Mapped[Optional[str]] = mapped_column(ForeignKey("properties.id"), nullable=True)
    buyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[List["Message"]] = relationship(
        back_populates="conversation", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id])


# ── Notification ──────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)   # offer, message, viewing, price
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
