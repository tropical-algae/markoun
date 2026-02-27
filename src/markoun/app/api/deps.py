from collections.abc import AsyncGenerator, Awaitable, Callable

from fastapi import Body, Depends, Header, HTTPException, Request, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.utils.constant import CONSTANT
from markoun.app.utils.security import verift_access_token
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.core.db.crud import select_user_by_full_name
from markoun.core.db.models import UserAccount
from markoun.core.db.session import LocalSession
from markoun.core.model.user import ScopeType

AUTHENTICATE_HEADER = "WWW-Authenticate"


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/user/access-token",
    scopes={
        ScopeType.ADMIN.value: CONSTANT.ROLE_ADMIN_DESCRIPTION,
        ScopeType.USER.value: CONSTANT.ROLE_USER_DESCRIPTION,
        ScopeType.GUEST.value: CONSTANT.ROLE_GUEST_DESCRIPTION,
    },
    auto_error=False,
)


async def get_db() -> AsyncGenerator:
    db = None
    try:
        db = LocalSession()
        yield db
    finally:
        if db:
            await db.close()


@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def get_current_user(
    request: Request,
    security_scopes: SecurityScopes,
    db: AsyncSession = Depends(get_db),
) -> UserAccount:
    authorization: str | None = request.cookies.get("access_token")
    if not authorization:
        raise HTTPException(**CONSTANT.RESP_TOKEN_NOT_EXISTED)

    scheme, _, token = authorization.partition(" ")
    if not scheme or scheme.lower() != "bearer":
        raise HTTPException(**CONSTANT.RESP_TOKEN_INVALID)

    headers = {AUTHENTICATE_HEADER: "Bearer"}
    if security_scopes.scopes:
        headers = {AUTHENTICATE_HEADER: f'Bearer scope="{security_scopes.scope_str}"'}
    payload = verift_access_token(token=token, headers=headers)
    user = await select_user_by_full_name(db, full_name=payload.username)
    if user is None:
        raise HTTPException(headers=headers, **CONSTANT.RESP_USER_NOT_EXISTS)
    # Check whether the permission of the current user is in the allowed permission list
    if len(security_scopes.scopes) != 0 and not payload.match_scope(
        security_scopes.scopes
    ):
        raise HTTPException(headers=headers, **CONSTANT.RESP_USER_FORBIDDEN)
    return user
