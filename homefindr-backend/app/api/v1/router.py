"""
API v1 router — imports and includes all endpoint sub-routers.
"""
from fastapi import APIRouter

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

api_router.include_router(auth_router)
api_router.include_router(properties_router)
api_router.include_router(offers_router)
api_router.include_router(payments_router)
api_router.include_router(viewings_router)
api_router.include_router(messages_router)
api_router.include_router(users_router)
api_router.include_router(media_router)
api_router.include_router(admin_router)
