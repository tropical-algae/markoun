import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.common.logging import logger
from markoun.core.db.crud.crud_user import insert_user, select_user_count
from markoun.core.model.user import ScopeType, UserBasicInfo

DEFAULT_USER = {
    "email": "admin@admin.com",
    "scopes": [ScopeType.ADMIN, ScopeType.USER],
    "full_name": "admin",
}


async def insert_default_user(db: AsyncSession) -> None:
    user_count = await select_user_count(db)
    if user_count == 0:
        logger.warning("Preparing to create system admin user")
        password = uuid.uuid4().hex[:12]
        new_user = UserBasicInfo(password=password, **DEFAULT_USER).build_user()
        await insert_user(db=db, user=new_user)
        logger.warning(f"Username: {new_user.full_name}")
        logger.warning(f"password: {password}")
    else:
        logger.info("Default user already exist. Initialization skipped.")
