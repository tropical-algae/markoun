from fastapi import APIRouter

from markoun.app.api.endpoints import file, health, user

router = APIRouter()
router.include_router(health.router, prefix="/system", tags=["system status"])
router.include_router(user.router, prefix="/user", tags=["user"])
router.include_router(file.router, prefix="/file", tags=["file"])
