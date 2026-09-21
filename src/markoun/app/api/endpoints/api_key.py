from fastapi import APIRouter, Depends, HTTPException, Response, Security, status
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import get_current_user, get_db, require_auth_enabled
from markoun.app.services.api_key_service import (
    create_api_key,
    list_api_keys,
    revoke_api_key,
    update_api_key,
)
from markoun.core.db.models import UserAccount
from markoun.core.model.api_key import (
    ApiKeyCreated,
    ApiKeyCreateRequest,
    ApiKeyInfo,
    ApiKeyUpdateRequest,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="API key not found",
    )


@router.get("", response_model=list[ApiKeyInfo])
async def api_list_api_keys(
    _: None = Depends(require_auth_enabled),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user,
        scopes=[ScopeType.ADMIN, ScopeType.USER],
    ),
) -> list[ApiKeyInfo]:
    return await list_api_keys(db, current_user.id)


@router.post("", response_model=ApiKeyCreated)
async def api_create_api_key(
    payload: ApiKeyCreateRequest,
    _: None = Depends(require_auth_enabled),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user,
        scopes=[ScopeType.ADMIN, ScopeType.USER],
    ),
) -> ApiKeyCreated:
    return await create_api_key(db, current_user, payload)


@router.patch("/{key_id}", response_model=ApiKeyInfo)
async def api_update_api_key(
    key_id: str,
    payload: ApiKeyUpdateRequest,
    _: None = Depends(require_auth_enabled),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user,
        scopes=[ScopeType.ADMIN, ScopeType.USER],
    ),
) -> ApiKeyInfo:
    api_key = await update_api_key(db, current_user.id, key_id, payload)
    if api_key is None:
        raise _not_found()
    return api_key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def api_revoke_api_key(
    key_id: str,
    _: None = Depends(require_auth_enabled),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Security(
        get_current_user,
        scopes=[ScopeType.ADMIN, ScopeType.USER],
    ),
) -> Response:
    if not await revoke_api_key(db, current_user.id, key_id):
        raise _not_found()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
