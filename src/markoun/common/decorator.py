import functools
import inspect
from collections.abc import Callable

from fastapi import HTTPException

from markoun.common.logging import logger


def exception_handling(http_response: dict):
    def decorator(inner_func: Callable):
        is_coroutine = inspect.iscoroutinefunction(inner_func)
        func_path = inner_func.__qualname__

        @functools.wraps(inner_func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await inner_func(*args, **kwargs)
            except HTTPException as err:
                logger.error(f"[Failed to run {func_path}] {err.detail}")
                raise
            except Exception as err:
                logger.exception(f"[Failed to run {func_path}] {err}")
                raise HTTPException(**http_response) from err

        @functools.wraps(inner_func)
        def sync_wrapper(*args, **kwargs):
            try:
                return inner_func(*args, **kwargs)
            except HTTPException as err:
                logger.error(f"[Failed to run {func_path}] {err.detail}")
                raise
            except Exception as err:
                logger.exception(f"[Failed to run {func_path}] {err}")
                raise HTTPException(**http_response) from err

        return async_wrapper if is_coroutine else sync_wrapper

    return decorator


# def exception_handling(http_response: dict):
#     """异常捕获装饰器，可用于函数/类方法，支持同步和异步函数

#     Args:
#         func (Callable | None, optional): _description_. Defaults to None.
#         default_return (Any, optional): _description_. Defaults to None.
#     """

#     def decorator(inner_func: Callable):
#         is_coroutine = asyncio.iscoroutinefunction(inner_func)

#         @functools.wraps(inner_func)
#         async def async_wrapper(*args, **kwargs):
#             is_method = len(args) > 0 and inspect.isclass(type(args[0]))
#             self = args[0] if is_method else None
#             func_path = (
#                 f"{type(self).__name__ + '.' if self else ''}{inner_func.__name__}"
#             )
#             try:
#                 return await inner_func(*args, **kwargs)
#             except HTTPException:
#                 raise
#             except Exception as err:
#                 logger.exception(f"[Failed to run {func_path}] {err}")
#                 raise HTTPException(**http_response) from err

#         @functools.wraps(inner_func)
#         def sync_wrapper(*args, **kwargs):
#             is_method = len(args) > 0 and inspect.isclass(type(args[0]))
#             self = args[0] if is_method else None
#             func_path = (
#                 f"{type(self).__name__ + '.' if self else ''}{inner_func.__name__}"
#             )
#             try:
#                 return inner_func(*args, **kwargs)
#             except HTTPException:
#                 raise
#             except Exception as err:
#                 logger.exception(f"[Failed to run {func_path}] {err}")
#                 raise HTTPException(**http_response) from err

#         return async_wrapper if is_coroutine else sync_wrapper

#     return decorator
