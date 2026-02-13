import uuid

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.utils.security import get_password_hash, verify_password
from markoun.common.logging import logger
from markoun.core.db.models import SystemSetting
from markoun.core.model.base import SysSettingType
from markoun.core.model.user import ScopeType

ALLOW_REGISTER_SETTING_ID = "allow_regis"

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


async def select_all_system_settings(
    db: AsyncSession, scopes: list[str] | None = None
) -> list[SystemSetting]:
    scopes = scopes or [member.value for member in ScopeType]

    user_result = await db.exec(
        select(SystemSetting).where(
            SystemSetting.is_active,
            col(SystemSetting.scope).in_(scopes),
        )
    )
    return list(user_result.all())


async def get_system_settings(db: AsyncSession, id: str) -> SystemSetting | None:
    db_config = await db.get(SystemSetting, id)
    return db_config


async def update_system_settings(db: AsyncSession, settings: list[SystemSetting]) -> None:
    try:
        db.add_all(settings)
        await db.commit()
    except Exception as err:
        await db.rollback()
        raise err


async def insert_default_setting(db: AsyncSession):
    default_keys = [item["key"] for item in DEFAULT_SETTING]

    statement = select(SystemSetting.id).where(SystemSetting.id.in_(default_keys))  # type: ignore
    results = await db.exec(statement)
    existing_keys = set(results.all())

    new_configs = []
    for item in DEFAULT_SETTING:
        if item["key"] not in existing_keys:
            config = SystemSetting(
                id=item.get("key", "none"),
                name=item.get("name", "none"),
                value=item.get("value", "none"),
                type=item.get("type", SysSettingType.STR),
                description=item.get("desc", "none"),
                scope=item.get("scope", ScopeType.GUEST),
                is_active=True,
            )
            new_configs.append(config)

    if new_configs:
        db.add_all(new_configs)
        await db.commit()
        logger.info(f"Initialized {len(new_configs)} configuration items successfully")
    else:
        logger.warning("Default configurations already exist. Initialization skipped.")
