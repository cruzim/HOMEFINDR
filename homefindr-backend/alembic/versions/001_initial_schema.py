"""Initial schema — create all tables.

Revision ID: 001
Revises:
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Enum types ────────────────────────────────────────────────────
    userrole = sa.Enum("buyer", "agent", "admin", name="userrole")
    propertystatus = sa.Enum(
        "active", "pending", "sold", "draft", "rejected", name="propertystatus"
    )
    propertytype = sa.Enum(
        "Detached Duplex",
        "Semi-Detached Duplex",
        "Terrace House",
        "Detached Bungalow",
        "Flat/Apartment",
        "Mini Flat",
        "Commercial",
        name="propertytype",
    )
    offerstatus = sa.Enum(
        "sent", "reviewed", "countered", "accepted", "rejected", "withdrawn",
        name="offerstatus",
    )
    paymentstatus = sa.Enum(
        "pending", "processing", "succeeded", "failed", "refunded",
        name="paymentstatus",
    )
    viewingstatus = sa.Enum(
        "scheduled", "confirmed", "completed", "cancelled", name="viewingstatus"
    )

    # ── users ─────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("role", userrole, nullable=False, index=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, default=False),
        sa.Column("google_id", sa.String(100), nullable=True, unique=True),
        sa.Column("notif_push", sa.Boolean(), default=True),
        sa.Column("notif_email", sa.Boolean(), default=True),
        sa.Column("notif_sms", sa.Boolean(), default=False),
    )

    # ── properties ────────────────────────────────────────────────────
    op.create_table(
        "properties",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("area", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False, index=True),
        sa.Column("state", sa.String(100), nullable=False, index=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False, index=True),
        sa.Column("original_price", sa.Integer(), nullable=True),
        sa.Column("commission_pct", sa.Numeric(5, 2), default=5.0),
        sa.Column("property_type", propertytype, nullable=False, index=True),
        sa.Column("beds", sa.Integer(), nullable=False, index=True),
        sa.Column("baths", sa.Numeric(4, 1), nullable=False),
        sa.Column("sqft", sa.Integer(), nullable=False),
        sa.Column("lot_size", sa.Numeric(10, 2), nullable=True),
        sa.Column("year_built", sa.Integer(), nullable=True),
        sa.Column("status", propertystatus, nullable=False, index=True),
        sa.Column("is_featured", sa.Boolean(), default=False),
        sa.Column("has_virtual_tour", sa.Boolean(), default=False),
        sa.Column("virtual_tour_url", sa.String(500), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("view_count", sa.Integer(), default=0),
        sa.Column("save_count", sa.Integer(), default=0),
        sa.Column("days_on_market", sa.Integer(), default=0),
        sa.Column("images", sa.JSON(), default=list),
        sa.Column("amenities", sa.JSON(), default=list),
        sa.Column("highlights", sa.JSON(), default=list),
        sa.Column("price_history", sa.JSON(), default=list),
        sa.Column("open_houses", sa.JSON(), default=list),
        sa.Column("schools", sa.JSON(), default=list),
        sa.Column("nearby_amenities", sa.JSON(), default=list),
        sa.Column(
            "agent_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
    )

    # ── saved_properties ──────────────────────────────────────────────
    op.create_table(
        "saved_properties",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "property_id",
            sa.String(),
            sa.ForeignKey("properties.id"),
            nullable=False,
            index=True,
        ),
    )

    # ── saved_searches ────────────────────────────────────────────────
    op.create_table(
        "saved_searches",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("filters", sa.JSON(), default=dict),
        sa.Column("new_results", sa.Integer(), default=0),
        sa.Column("total_results", sa.Integer(), default=0),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── offers ────────────────────────────────────────────────────────
    op.create_table(
        "offers",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            sa.String(),
            sa.ForeignKey("properties.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "buyer_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("offer_price", sa.Integer(), nullable=False),
        sa.Column("down_payment_pct", sa.Numeric(5, 2), default=20.0),
        sa.Column("preferred_closing_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("contingencies", sa.JSON(), default=list),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", offerstatus, nullable=False, index=True),
        sa.Column("counter_price", sa.Integer(), nullable=True),
    )

    # ── payments ──────────────────────────────────────────────────────
    op.create_table(
        "payments",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "offer_id",
            sa.String(),
            sa.ForeignKey("offers.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(10), default="ngn"),
        sa.Column("description", sa.String(300), nullable=False),
        sa.Column("status", paymentstatus, nullable=False),
        sa.Column("stripe_payment_intent_id", sa.String(200), nullable=True),
        sa.Column("stripe_client_secret", sa.String(500), nullable=True),
    )

    # ── viewings ──────────────────────────────────────────────────────
    op.create_table(
        "viewings",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            sa.String(),
            sa.ForeignKey("properties.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "buyer_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", viewingstatus, nullable=False),
        sa.Column("contact_name", sa.String(200), nullable=True),
        sa.Column("contact_email", sa.String(200), nullable=True),
        sa.Column("contact_phone", sa.String(50), nullable=True),
    )

    # ── conversations ─────────────────────────────────────────────────
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            sa.String(),
            sa.ForeignKey("properties.id"),
            nullable=True,
        ),
        sa.Column(
            "buyer_id", sa.String(), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column(
            "agent_id", sa.String(), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── messages ──────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            sa.String(),
            sa.ForeignKey("conversations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "sender_id", sa.String(), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("attachments", sa.JSON(), default=list),
        sa.Column("is_read", sa.Boolean(), default=False),
    )

    # ── notifications ─────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("reference_id", sa.String(100), nullable=True),
        sa.Column("is_read", sa.Boolean(), default=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("viewings")
    op.drop_table("payments")
    op.drop_table("offers")
    op.drop_table("saved_searches")
    op.drop_table("saved_properties")
    op.drop_table("properties")
    op.drop_table("users")

    for name in [
        "viewingstatus",
        "paymentstatus",
        "offerstatus",
        "propertytype",
        "propertystatus",
        "userrole",
    ]:
        sa.Enum(name=name).drop(op.get_bind(), checkfirst=True)
