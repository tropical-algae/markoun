from fastapi import APIRouter, HTTPException, Request, Security

from markoun.common.config import settings
from markoun.core.model.base import SystemStatus, SystemStatusType

router = APIRouter()


@router.get("/status", response_model=SystemStatus)
async def api_check_system_status() -> SystemStatus:
    return SystemStatus(status=SystemStatusType.HEALTH.value, version=settings.VERSION)
