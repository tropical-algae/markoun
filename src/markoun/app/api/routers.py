from fastapi import APIRouter

from markoun.app.api.endpoints import directory, file, health, item, user

router = APIRouter()
router.include_router(health.router, prefix="/system", tags=["system status"])
router.include_router(user.router, prefix="/user", tags=["user"])
router.include_router(file.router, prefix="/file", tags=["file"])
router.include_router(directory.router, prefix="/dir", tags=["directory"])
router.include_router(item.router, prefix="/item", tags=["file & dir"])
