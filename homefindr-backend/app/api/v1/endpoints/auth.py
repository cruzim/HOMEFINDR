"""
Authentication endpoints.
POST /auth/register   — email/password signup
POST /auth/login      — email/password login
POST /auth/refresh    — rotate access token using refresh token
POST /auth/google     — Google OAuth code exchange
POST /auth/logout     — client-side: just discard tokens
GET  /auth/me         — current user profile
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.limiter import limiter

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import (
    GoogleAuthCode,
    MessageResponse,
    TokenPair,
    TokenRefresh,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.api.v1.deps import CurrentUser
import httpx

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # AUDIT FIX [6.8]: prevent registration brute-force
async def register(request: Request, body: UserRegister, db: AsyncSession = Depends(get_db)) -> User:
    """Create a new user account (buyer or agent)."""
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = User(
        email=body.email,
        full_name=body.full_name,
        phone=body.phone,
        role=body.role,
        hashed_password=hash_password(body.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenPair)
@limiter.limit("10/minute")  # AUDIT FIX [6.8]: prevent credential stuffing
async def login(request: Request, body: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenPair:
    """Authenticate with email + password. Returns access + refresh tokens."""
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh_tokens(body: TokenRefresh, db: AsyncSession = Depends(get_db)) -> TokenPair:
    """Exchange a valid refresh token for a new token pair."""
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise JWTError("Wrong token type")
        user_id: str = payload["sub"]
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/google", response_model=TokenPair)
async def google_oauth(body: GoogleAuthCode, db: AsyncSession = Depends(get_db)) -> TokenPair:
    """
    Exchange a Google OAuth authorization code for HomeFindr tokens.
    Frontend sends the code from Google's redirect; we verify with Google,
    get the user's profile, and create or update the user record.
    """
    # Exchange code for Google tokens
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": body.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": body.redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Google token exchange failed")

    google_tokens = token_res.json()
    id_token = google_tokens.get("id_token", "")

    # Decode ID token (no signature verification needed — already exchanged)
    import base64, json as _json
    try:
        payload_b64 = id_token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        profile = _json.loads(base64.urlsafe_b64decode(payload_b64))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode Google ID token")

    google_id = profile.get("sub")
    email = profile.get("email")
    name = profile.get("name", email)
    photo = profile.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Incomplete Google profile")

    # Upsert user
    result = await db.execute(select(User).where(User.google_id == google_id))
    user: User | None = result.scalar_one_or_none()

    if not user:
        # Check by email
        result2 = await db.execute(select(User).where(User.email == email))
        user = result2.scalar_one_or_none()
        if user:
            user.google_id = google_id
            user.photo_url = photo or user.photo_url
        else:
            user = User(
                email=email,
                full_name=name,
                google_id=google_id,
                photo_url=photo,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser) -> User:
    """Return the authenticated user's profile."""
    return current_user

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    # Your logic to exchange the code for a token and save the user
    pass

@router.post("/logout", response_model=MessageResponse)
async def logout() -> MessageResponse:
    """
    Stateless logout — client must discard stored tokens.
    For full revocation, implement a Redis token denylist here.
    """
    return MessageResponse(message="Logged out successfully")