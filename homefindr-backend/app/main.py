"""
HomeFindr Backend — FastAPI application factory.
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.routing import Mount
from starlette.applications import Starlette

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db
from app.services.socketio_app import socket_app
from app.schemas.schemas import HealthCheck

# ── Lifespan ──────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_development:
        await init_db()
    yield

# ── FastAPI instance ──────────────────────────────────────────────────

app = FastAPI(
    title="HomeFindr API",
    description="Nigeria's premier real estate platform API.",
    version="1.0.0",
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json", # Uses the fixed setting
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────

origins = [
    "http://localhost:3000",
    "https://homefindr.vercel.app",
    "https://homefindr-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter() - start) * 1000:.2f}ms"
    return response

# ── Global exception handlers ─────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found"},
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error — our team has been notified"},
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

# ── ASGI composition ──────────────────────────────────────────────────

combined_app = Starlette(
    routes=[
        Mount("/socket.io", app=socket_app),
        Mount("/", app=app),
    ]
)