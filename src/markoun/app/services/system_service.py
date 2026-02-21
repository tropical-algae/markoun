from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.utils.constant import CONSTANT
from markoun.common.logging import logger
from markoun.core.db.crud.crud_setting import (
    get_system_settings,
    insert_system_settings,
    select_all_system_settings,
    select_system_settings_by_ids,
    update_system_settings,
)
from markoun.core.db.models import SystemSetting
from markoun.core.model.base import (
    SysSettingResponse,
    SysSettingType,
    SysSettingUpdateRequest,
)
from markoun.core.model.user import ScopeType

ALLOW_REGISTER_SETTING_ID = "allow_regis"
TYPE_CHECK_MAP = {
    SysSettingType.BOOL: bool,
    SysSettingType.STR: str,
}
DEFAULT_SETTING = [
    {
        "key": ALLOW_REGISTER_SETTING_ID,
        "value": True,
        "type": SysSettingType.BOOL,
        "name": "Allow Registration",
        "desc": "Enable or disable user self-registration.",
        "scope": ScopeType.ADMIN,
    },
    # {"key": "allowed_file_exten", "value": [], "name": "Allowed File Extensions"},
]


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


async def insert_default_system_setting(db: AsyncSession):
    default_keys = [item["key"] for item in DEFAULT_SETTING]
    existed_sys_settings = await select_system_settings_by_ids(db=db, ids=default_keys)
    existed_keys = {es.id for es in existed_sys_settings}

    new_sys_settings = []
    for item in DEFAULT_SETTING:
        if item["key"] not in existed_keys:
            sys_setting = SystemSetting(
                id=item.get("key", "none"),
                name=item.get("name", "none"),
                value=item.get("value", "none"),
                type=item.get("type", SysSettingType.STR),
                description=item.get("desc", "none"),
                scope=item.get("scope", ScopeType.GUEST),
                is_active=True,
            )
            new_sys_settings.append(sys_setting)
            logger.warning(
                f"Initialize system setting: {sys_setting.name}[{sys_setting.value}]"
            )

    if new_sys_settings:
        await insert_system_settings(db, new_sys_settings)
        logger.warning(
            f"Initialized {len(new_sys_settings)} system settings successfully"
        )
    else:
        logger.info("Default system setting already exist. Initialization skipped.")
