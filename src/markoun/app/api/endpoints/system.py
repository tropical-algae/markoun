from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, Security
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import WorkspaceAccess, get_db, get_workspace_access
from markoun.app.services.system_service import (
    get_allow_user_register_setting,
    get_system_setting_by_scopes,
    get_welcome_note_content,
    update_system_setting,
)
from markoun.app.utils.constant import CONSTANT, MSG_SUCCESS
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
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
    return SysStatus(
        status=SysStatusType.HEALTH.value,
        version=settings.VERSION,
        auth_required=settings.AUTH_REQUIRED,
    )


@router.get("/settings")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_get_all_settings(
    db: AsyncSession = Depends(get_db),
    access: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> list[SysSettingResponse]:
    configs: list[SysSettingResponse] = await get_system_setting_by_scopes(
        db=db, scopes=list(access.scopes)
    )
    return configs


@router.patch("/settings")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_update_setting(
    data: SysSettingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    access: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    await update_system_setting(db=db, scopes=list(access.scopes), data=data)
    return MSG_SUCCESS


@router.get("/settings/allow-register")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_allow_uesr_register(
    db: AsyncSession = Depends(get_db),
):
    return await get_allow_user_register_setting(db=db)


@router.get("/welcome-note")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_get_welcome_note() -> str:
    return get_welcome_note_content()
