from fastapi import APIRouter

from markoun.app.api.endpoints import health, user

router = APIRouter()
router.include_router(health.router, prefix="/system", tags=["system status"])
router.include_router(user.router, prefix="/user", tags=["user"])
