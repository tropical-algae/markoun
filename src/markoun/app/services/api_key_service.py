import hmac
import json
import secrets
from datetime import UTC, datetime

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.common.util import format_display_time, hash_secret
from markoun.core.db.models import McpApiKey, UserAccount
from markoun.core.model.api_key import (
    ApiKeyCreated,
    ApiKeyCreateRequest,
    ApiKeyInfo,
    ApiKeyPrincipal,
    ApiKeyUpdateRequest,
    McpPermission,
)
from markoun.core.model.user import ScopeType

API_KEY_PREFIX = "mk"


def _to_info(api_key: McpApiKey) -> ApiKeyInfo:
    return ApiKeyInfo(
        id=api_key.id,
        name=api_key.name,
        prefix=f"{API_KEY_PREFIX}_{api_key.id}",
        permissions=[McpPermission(item) for item in api_key.permissions],
        is_active=api_key.is_active,
        created_at=format_display_time(api_key.create_date),
        last_used_at=format_display_time(api_key.last_used_at),
    )


async def create_api_key(
    db: AsyncSession,
    user: UserAccount,
    payload: ApiKeyCreateRequest,
) -> ApiKeyCreated:
    key_id = secrets.token_hex(12)
    secret = secrets.token_urlsafe(32)
    token = f"{API_KEY_PREFIX}_{key_id}_{secret}"
    api_key = McpApiKey(
        id=key_id,
        user_id=user.id,
        name=payload.name,
        secret_hash=hash_secret(secret),
        permissions=[permission.value for permission in payload.permissions],
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return ApiKeyCreated(**_to_info(api_key).model_dump(), key=token)


async def list_api_keys(db: AsyncSession, user_id: str) -> list[ApiKeyInfo]:
    result = await db.exec(
        select(McpApiKey)
        .where(McpApiKey.user_id == user_id)
        .order_by(col(McpApiKey.create_date).asc())
    )
    return [_to_info(api_key) for api_key in result.all()]


async def update_api_key(
    db: AsyncSession,
    user_id: str,
    key_id: str,
    payload: ApiKeyUpdateRequest,
) -> ApiKeyInfo | None:
    api_key = await db.get(McpApiKey, key_id)
    if api_key is None or api_key.user_id != user_id or not api_key.is_active:
        return None
    if payload.name is not None:
        api_key.name = payload.name
    if payload.permissions is not None:
        api_key.permissions = [item.value for item in payload.permissions]
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return _to_info(api_key)


async def revoke_api_key(
    db: AsyncSession,
    user_id: str,
    key_id: str,
) -> bool:
    api_key = await db.get(McpApiKey, key_id)
    if api_key is None or api_key.user_id != user_id or not api_key.is_active:
        return False
    api_key.is_active = False
    db.add(api_key)
    await db.commit()
    return True


async def authenticate_api_key(
    db: AsyncSession,
    token: str,
) -> ApiKeyPrincipal | None:
    prefix, separator, remainder = token.partition("_")
    key_id, second_separator, secret = remainder.partition("_")
    if prefix != API_KEY_PREFIX or not separator or not second_separator or not secret:
        return None

    api_key = await db.get(McpApiKey, key_id)
    if api_key is None or not api_key.is_active:
        return None
    if not hmac.compare_digest(api_key.secret_hash, hash_secret(secret)):
        return None

    user = await db.get(UserAccount, api_key.user_id)
    if user is None or not user.is_active:
        return None
    user_scopes = set(json.loads(user.scopes))
    if not user_scopes.intersection({ScopeType.ADMIN.value, ScopeType.USER.value}):
        return None

    principal = ApiKeyPrincipal(
        key_id=api_key.id,
        user=UserAccount.model_validate(user.model_dump()),
        permissions=frozenset(McpPermission(item) for item in api_key.permissions),
    )
    api_key.last_used_at = datetime.now(UTC)
    db.add(api_key)
    await db.commit()
    return principal
