from collections.abc import Awaitable, Callable
from contextvars import ContextVar, Token
from json import dumps

from starlette.types import ASGIApp, Receive, Scope, Send

from markoun.app.services.api_key_service import authenticate_api_key
from markoun.common.config import settings
from markoun.core.db.session import LocalSession
from markoun.core.model.api_key import ApiKeyPrincipal, McpPermission

current_principal: ContextVar[ApiKeyPrincipal | None] = ContextVar(
    "mcp_api_key_principal",
    default=None,
)


def get_mcp_principal(permission: McpPermission) -> ApiKeyPrincipal:
    principal = current_principal.get()
    if principal is None:
        raise PermissionError("MCP authentication is required")
    if not principal.allows(permission):
        raise PermissionError(f"API key does not allow {permission.value} operations")
    return principal


class ApiKeyAuthMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if not settings.AUTH_REQUIRED:
            await self._unauthorized(
                send, "MCP is disabled when authentication is disabled"
            )
            return

        authorization = next(
            (
                value.decode("latin-1")
                for key, value in scope.get("headers", [])
                if key.lower() == b"authorization"
            ),
            "",
        )
        scheme, _, api_key = authorization.partition(" ")
        if scheme.lower() != "bearer" or not api_key:
            await self._unauthorized(send, "A valid API key is required")
            return

        async with LocalSession() as db:
            principal = await authenticate_api_key(db, api_key)
        if principal is None:
            await self._unauthorized(send, "Invalid or revoked API key")
            return

        context_token: Token[ApiKeyPrincipal | None] = current_principal.set(principal)
        try:
            await self.app(scope, receive, send)
        finally:
            current_principal.reset(context_token)

    @staticmethod
    async def _unauthorized(send: Send, detail: str) -> None:
        body = dumps({"error": "invalid_token", "error_description": detail}).encode()
        await send(
            {
                "type": "http.response.start",
                "status": 401,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode()),
                    (b"www-authenticate", b"Bearer"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
