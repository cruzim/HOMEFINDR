"""
HomeFindr Backend — FastAPI application factory.
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.routing import Mount
from starlette.applications import Starlette

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db, engine
from app.models.models import Base
from app.services.socketio_app import socket_app
from app.schemas.schemas import HealthCheck

logger = logging.getLogger(__name__)

# ── Allowed origins (single source of truth) ──────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://homefindr.vercel.app",
    "https://homefindr-frontend.vercel.app",
]


def _cors_headers(request: Request) -> dict:
    """Return CORS headers for a given request origin (used in error handlers)."""
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


# ── Shared startup logic ───────────────────────────────────────────────

async def _create_tables() -> None:
    """Ensure all DB tables exist. Safe to call multiple times (create_all is idempotent)."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified / created.")
    except Exception:
        logger.exception("Failed to create database tables on startup.")
        raise


# ── FastAPI lifespan ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await _create_tables()
    if settings.is_development:
        await init_db()
    yield


# ── FastAPI instance ───────────────────────────────────────────────────

app = FastAPI(
    title="HomeFindr API",
    description="Nigeria's premier real estate platform API.",
    version="1.0.0",
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# ── CORS middleware ────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Timing middleware ──────────────────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter() - start) * 1000:.2f}ms"
    return response

# ── Global exception handlers ──────────────────────────────────────────
# These handlers add CORS headers manually so that the browser can actually
# read the error body when a non-2xx response is returned from an origin
# the CORS middleware would otherwise have allowed.

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found"},
        headers=_cors_headers(request),
    )

@app.exception_handler(Exception)
async def internal_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error — our team has been notified"},
        headers=_cors_headers(request),
    )

# ── Routes ────────────────────────────────────────────────────────────

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", response_model=HealthCheck, tags=["health"])
async def health_check() -> HealthCheck:
    return HealthCheck(
        status="ok",
        version="1.0.0",
        environment=settings.APP_ENV,
    )

@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health",
    }


# ── ASGI composition ───────────────────────────────────────────────────
# combined_app is what Railway actually runs (uvicorn app.main:combined_app).
# It needs its own lifespan so that _create_tables() is guaranteed to run
# even if Starlette doesn't propagate the mounted FastAPI app's lifespan.

@asynccontextmanager
async def combined_lifespan(app: Starlette):
    await _create_tables()
    yield


combined_app = Starlette(
    lifespan=combined_lifespan,
    routes=[
        Mount("/socket.io", app=socket_app),
        Mount("/", app=app),
    ],
)