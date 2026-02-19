import uuid

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.core.db.models import SystemSetting
from markoun.core.model.user import ScopeType


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


async def select_system_settings_by_ids(
    db: AsyncSession, ids: list, need_actived: bool = False
) -> list[SystemSetting]:
    results = await db.exec(
        select(SystemSetting).where(
            SystemSetting.is_active if need_actived else True,
            col(SystemSetting.id).in_(ids),
        )
    )
    return list(results.all())


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


async def insert_system_settings(db: AsyncSession, settings: list[SystemSetting]) -> None:
    db.add_all(settings)
    await db.commit()
