import functools
import inspect
from collections.abc import Awaitable, Callable, Mapping
from typing import Annotated, Any, NoReturn, cast

from fastapi import HTTPException
from mcp.types import CallToolResult

from markoun.app.utils.constant import CONSTANT
from markoun.common.logging import logger
from markoun.core.model.mcp import McpError, McpToolResponse

HttpResponse = Mapping[str, Any]
McpCallToolResult = Annotated[CallToolResult, McpToolResponse]


class _ExceptionHandler:
    def __init__(
        self,
        default_response: HttpResponse,
        exception_responses: Mapping[type[Exception], HttpResponse] | None,
    ) -> None:
        self.default_response = default_response
        self.exception_responses = exception_responses or {}

    def __call__[**P, R](self, inner_func: Callable[P, R]) -> Callable[P, R]:
        func_path = inner_func.__qualname__

        if inspect.iscoroutinefunction(inner_func):
            async_func = cast(Callable[P, Awaitable[Any]], inner_func)

            @functools.wraps(inner_func)
            async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
                try:
                    return await async_func(*args, **kwargs)
                except Exception as err:
                    self._raise_http_exception(func_path, err)

            return cast(Callable[P, R], async_wrapper)

        @functools.wraps(inner_func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            try:
                return inner_func(*args, **kwargs)
            except Exception as err:
                self._raise_http_exception(func_path, err)

        return sync_wrapper

    def _raise_http_exception(self, func_path: str, error: Exception) -> NoReturn:
        if isinstance(error, HTTPException):
            logger.error(f"[Failed to run {func_path}] {error.detail}")
            raise error

        for error_type, response in self.exception_responses.items():
            if isinstance(error, error_type):
                logger.error(f"[Failed to run {func_path}] {error}")
                raise HTTPException(**dict(response)) from error

        logger.exception(f"[Failed to run {func_path}] {error}")
        raise HTTPException(**dict(self.default_response)) from error


def exception_handling(
    http_response: HttpResponse,
    *,
    exception_responses: Mapping[type[Exception], HttpResponse] | None = None,
) -> _ExceptionHandler:
    return _ExceptionHandler(http_response, exception_responses)


def _http_error_hint(error: HTTPException) -> str | None:
    if error.detail == CONSTANT.SERV_PARENT_DIR_NOT_EXISTED["detail"]:
        return CONSTANT.MCP_CREATE_PARENT_HINT
    if error.detail == CONSTANT.SERV_TARGET_DIR_NOT_EXISTED["detail"]:
        return CONSTANT.MCP_MOVE_TARGET_HINT
    return None


def mcp_tool_result[**P, R: dict[str, Any]](
    func: Callable[P, Awaitable[R]],
) -> Callable[P, Awaitable[McpCallToolResult]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> CallToolResult:
        try:
            response = McpToolResponse(payload=await func(*args, **kwargs))
        except HTTPException as error:
            detail = error.detail if isinstance(error.detail, str) else str(error.detail)
            response = McpToolResponse(
                error=McpError(message=detail, hint=_http_error_hint(error))
            )
        except PermissionError as error:
            response = McpToolResponse(
                error=McpError(
                    message=str(error),
                    hint=CONSTANT.MCP_PERMISSION_DENIED_HINT,
                )
            )
        except ValueError as error:
            response = McpToolResponse(error=McpError(message=str(error)))
        except Exception:
            logger.exception(f"[Failed to run MCP tool {func.__qualname__}]")
            response = McpToolResponse(
                error=McpError(message=CONSTANT.MCP_INTERNAL_ERROR_MESSAGE)
            )
        return response.call_tool_result()

    signature = inspect.signature(func).replace(return_annotation=McpCallToolResult)
    wrapper.__signature__ = signature  # type: ignore[attr-defined]
    return cast(Callable[P, Awaitable[McpCallToolResult]], wrapper)
