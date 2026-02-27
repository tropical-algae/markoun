import json
from datetime import datetime
from typing import Any

import pytz
from fastapi import (
    APIRouter,
    Depends,
    Form,
    Response,
    Security,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import get_current_user, get_db
from markoun.app.services.user_service import (
    user_login,
    user_logout,
    user_register,
    user_update_passwd,
)
from markoun.app.utils.constant import CONSTANT, MSG_SUCCESS
from markoun.common.decorator import exception_handling
from markoun.core.db.models import UserAccount
from markoun.core.model.user import LoginResponse, ScopeType, UserBasicInfo

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_user_login(
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(False),
) -> Any:
    """
    OAuth2 compatible token login, sets HttpOnly Cookie
    """
    user = await user_login(
        response=response, db=db, user_form=form_data, is_persistent=remember_me
    )
    return LoginResponse(
        **CONSTANT.RESP_SUCCESS,
        user_id=user.id,
        scopes=json.loads(str(user.scopes)),
        timestamp=pytz.timezone("Asia/Shanghai")
        .localize(datetime.now())
        .strftime("%Y-%m-%d %H:%M:%S"),
    )


@router.post("/logout")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_user_logout(response: Response):
    """
    User logout delete cookie
    """
    user_logout(response)
    return MSG_SUCCESS


@router.get("/check")
async def api_check_token(
    _: UserAccount = Security(
        get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER, ScopeType.GUEST]
    ),
) -> str:
    """
    Test access token
    """
    return MSG_SUCCESS


@router.post("/register", response_model=UserAccount)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_user_register(
    user: UserBasicInfo,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Register new user (This interface has not undergone login verification)
    """
    new_user = await user_register(user=user, db=db)
    return new_user


@router.patch("/password")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_update_setting(
    new_passwd: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    await user_update_passwd(db=db, user=current_user, new_passwd=new_passwd)
    return MSG_SUCCESS
