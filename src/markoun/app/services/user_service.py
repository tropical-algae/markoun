import json
import uuid
from datetime import timedelta

from fastapi import HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.services.system_service import get_allow_user_register_setting
from markoun.app.utils.constant import CONSTANT
from markoun.app.utils.security import get_access_token, verify_password
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.core.db.crud.crud_user import (
    insert_user,
    select_user_by_email,
    select_user_by_full_name,
    select_user_count,
    update_user,
)
from markoun.core.db.models import UserAccount
from markoun.core.model.user import ScopeType, TokenPayload, UserBasicInfo

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


async def user_login(
    response: Response,
    db: AsyncSession,
    user_form: OAuth2PasswordRequestForm,
    is_persistent: bool,
) -> UserAccount:
    user = await select_user_by_full_name(db, full_name=user_form.username)
    if not user:
        raise HTTPException(**CONSTANT.RESP_USER_NOT_EXISTS)

    if not verify_password(user_form.password, str(user.password)):
        raise HTTPException(**CONSTANT.RESP_USER_INCORRECT_PASSWD)

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXTENDED_EXPIRE_MINUTES
        if is_persistent
        else settings.ACCESS_TOKEN_DEFAULT_EXPIRE_MINUTES
    )
    access_token = get_access_token(
        data=TokenPayload(
            userid=user.id, username=user.full_name, scopes=json.loads(str(user.scopes))
        ),
        expires_delta=access_token_expires,
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=int(access_token_expires.total_seconds()),
        expires=int(access_token_expires.total_seconds()),
        samesite="lax",
        secure=False,
        path="/",
    )
    return user


def user_logout(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/", samesite="lax")


async def user_register(user: UserBasicInfo, db: AsyncSession) -> UserAccount:
    can_user_regis = await get_allow_user_register_setting(db=db)
    if not can_user_regis:
        raise HTTPException(**CONSTANT.SERV_DISABLE_REGISTRATION)

    existed_user = await select_user_by_full_name(db, full_name=user.full_name)
    if existed_user is not None:
        raise HTTPException(**CONSTANT.RESP_USER_EXISTS)

    existed_user = await select_user_by_email(db, email=user.email)
    if existed_user is not None:
        raise HTTPException(**CONSTANT.RESP_USER_EMAIL_EXISTS)

    user.scopes = [ScopeType.USER]  # Could only create USER
    new_user = user.build_user()
    new_user = await insert_user(db=db, user=new_user)
    del new_user.password
    return new_user


async def user_update_passwd(
    db: AsyncSession, user: UserAccount, new_passwd: str
) -> None:
    result = await update_user(
        db=db, user_id=user.id, update_attr={"password": new_passwd}
    )
    if result is None:
        raise HTTPException(**CONSTANT.SERV_PASSWD_UPDATE_FAIL)
