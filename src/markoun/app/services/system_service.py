from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.utils.constant import CONSTANT
from markoun.common.logging import logger
from markoun.core.db.crud.crud_setting import (
    ALLOW_REGISTER_SETTING_ID,
    get_system_settings,
    select_all_system_settings,
    update_system_settings,
)
from markoun.core.db.models import SystemSetting
from markoun.core.model.base import (
    SysSettingResponse,
    SysSettingType,
    SysSettingUpdateRequest,
)

TYPE_CHECK_MAP = {
    SysSettingType.BOOL: bool,
    SysSettingType.STR: str,
}


async def get_system_setting_by_scopes(
    db: AsyncSession, scopes: list[str]
) -> list[SysSettingResponse]:
    configs: list[SystemSetting] = await select_all_system_settings(db=db, scopes=scopes)
    return [
        SysSettingResponse(
            id=config.id,
            name=config.name,
            value=config.value,
            desc=config.description,
            type=SysSettingType(config.type),
        )
        for config in configs
    ]


async def update_system_setting(
    db: AsyncSession, scopes: list[str], data: SysSettingUpdateRequest
):
    try:
        setting = await get_system_settings(db=db, id=data.id)
        if setting is not None:
            if setting.scope in scopes:
                setting_type = SysSettingType(setting.type)
                expected_type = TYPE_CHECK_MAP.get(setting_type)

                if expected_type is None:
                    raise ValueError(f"Unsupported setting type: {setting_type}")

                if not isinstance(data.value, expected_type):
                    raise TypeError(
                        f"Invalid value type for {setting_type}. "
                        f"Expected {expected_type.__name__}, got {type(data.value).__name__}"
                    )
                setting.value = data.value
                await update_system_settings(db=db, settings=[setting])
                return
            raise HTTPException(**CONSTANT.SERV_SETTING_UPDATE_PERMISSION_DENIED)
        raise HTTPException(**CONSTANT.SERV_SETTING_NOT_EXISTED)
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"[Failed to update setting {data.id} ({data.value})] {err}")
        raise HTTPException(**CONSTANT.SERV_SETTING_UPDATE_FAIL) from err


async def get_allow_user_register_setting(db: AsyncSession) -> bool:
    setting = await get_system_settings(db=db, id=ALLOW_REGISTER_SETTING_ID)
    if setting is None:
        raise HTTPException(**CONSTANT.SERV_SETTING_NOT_EXISTED)

    result: bool = setting.value
    return result
