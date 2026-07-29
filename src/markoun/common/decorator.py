import functools
import inspect
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, NoReturn, cast

from fastapi import HTTPException

from markoun.common.logging import logger

HttpResponse = Mapping[str, Any]


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
