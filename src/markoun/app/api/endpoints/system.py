from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, Security
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import get_current_user, get_db
from markoun.app.services.system_service import (
    get_allow_user_register_setting,
    get_system_setting_by_scopes,
    update_system_setting,
)
from markoun.common.config import settings
from markoun.common.util import str_to_json
from markoun.core.db.models import UserAccount
from markoun.core.model.base import (
    SysSettingResponse,
    SysSettingUpdateRequest,
    SysStatus,
    SysStatusType,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.get("/status", response_model=SysStatus)
async def api_check_system_status() -> SysStatus:
    return SysStatus(status=SysStatusType.HEALTH.value, version=settings.VERSION)


@router.get("/settings")
async def api_get_all_settings(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> list[SysSettingResponse]:
    scopes: list[str] = str_to_json(current_user.scopes)
    configs: list[SysSettingResponse] = await get_system_setting_by_scopes(
        db=db, scopes=scopes
    )
    return configs


@router.patch("/settings")
async def api_update_setting(
    data: SysSettingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    scopes: list[str] = str_to_json(current_user.scopes)
    await update_system_setting(db=db, scopes=scopes, data=data)
    return "ok"


@router.get("/settings/allow-register")
async def api_allow_uesr_register(
    db: AsyncSession = Depends(get_db),
):
    return await get_allow_user_register_setting(db=db)
