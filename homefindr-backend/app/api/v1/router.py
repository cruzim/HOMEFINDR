"""
API v1 router — imports and includes all endpoint sub-routers.
"""
from fastapi import APIRouter

# Import the routers from each endpoint module
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.properties import router as properties_router
from app.api.v1.endpoints.offers import router as offers_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.viewings import router as viewings_router
from app.api.v1.endpoints.messages import router as messages_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.media import router as media_router
from app.api.v1.endpoints.admin import router as admin_router

api_router = APIRouter()

# Authentication & Identity
# FIXED: Using auth_router (the name imported above) instead of auth.router
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])

# Property Management
api_router.include_router(properties_router, prefix="/properties", tags=["properties"])
api_router.include_router(media_router, prefix="/media", tags=["media"])

# Transactions & Communication
api_router.include_router(offers_router, prefix="/offers", tags=["offers"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(viewings_router, prefix="/viewings", tags=["viewings"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])

# System Administration
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])