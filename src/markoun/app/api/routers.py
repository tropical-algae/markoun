from fastapi import APIRouter

from markoun.app.api.endpoints import (
    api_key,
    directory,
    file,
    history,
    item,
    system,
    user,
)

router = APIRouter()
router.include_router(system.router, prefix="/system", tags=["system status"])
router.include_router(user.router, prefix="/auth", tags=["user"])
router.include_router(api_key.router, prefix="/api-keys", tags=["API keys"])
router.include_router(file.router, prefix="/file", tags=["file"])
router.include_router(history.router, prefix="/history", tags=["file history"])
router.include_router(directory.router, prefix="/dir", tags=["directory"])
router.include_router(item.router, prefix="/item", tags=["file & dir"])
