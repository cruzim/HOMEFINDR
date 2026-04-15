"""
Async SQLAlchemy engine, session factory, and base model.
Uses asyncpg driver for PostgreSQL.
"""
from typing import AsyncGenerator
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func

from app.core.config import settings

# --- CRITICAL FIX: IMPORT MODELS ---
# Importing the models here ensures that when Base.metadata.create_all is called,
# the 'users' table (and any others) are actually found and created.
import app.models.models  # noqa: F401
# -----------------------------------

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,          # detect stale connections
    echo=settings.DEBUG,         # log SQL in dev only
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """All models inherit from this base — provides id, created_at, updated_at."""

    id: Mapped[str] = mapped_column(
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables on startup (dev/test only; use Alembic in prod)."""
    async with engine.begin() as conn:
        # Now that models are imported above, this will find the 'users' table
        await conn.run_sync(Base.metadata.create_all)