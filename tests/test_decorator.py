# import inspect

# import pytest
# from fastapi import HTTPException

# from markoun.common.decorator import exception_handling

# DEFAULT_RESPONSE = {
#     "status_code": 500,
#     "detail": "default error",
# }
# VALUE_RESPONSE = {
#     "status_code": 400,
#     "detail": "invalid value",
# }


# class DecoratedService:
#     @exception_handling(DEFAULT_RESPONSE)
#     def format_value(self, value: int, prefix: str = "value") -> str:
#         return f"{prefix}:{value}"

#     @exception_handling(
#         DEFAULT_RESPONSE,
#         exception_responses={ValueError: VALUE_RESPONSE},
#     )
#     async def fail_async(self, value: int) -> str:
#         raise ValueError(value)

#     @classmethod
#     @exception_handling(DEFAULT_RESPONSE)
#     def class_name(cls) -> str:
#         return cls.__name__


# def test_exception_decorator_preserves_signature_and_method_binding() -> None:
#     service = DecoratedService()

#     assert service.format_value(3, prefix="item") == "item:3"
#     assert DecoratedService.class_name() == "DecoratedService"
#     assert str(inspect.signature(DecoratedService.format_value)) == (
#         "(self, value: int, prefix: str = 'value') -> str"
#     )
#     assert DecoratedService.format_value.__name__ == "format_value"


# @pytest.mark.anyio
# async def test_exception_decorator_maps_async_errors() -> None:
#     with pytest.raises(HTTPException) as exc_info:
#         await DecoratedService().fail_async(3)

#     assert exc_info.value.status_code == 400
#     assert exc_info.value.detail == "invalid value"


# def test_exception_decorator_preserves_existing_http_exception() -> None:
#     @exception_handling(DEFAULT_RESPONSE)
#     def fail() -> None:
#         raise HTTPException(status_code=409, detail="conflict")

#     with pytest.raises(HTTPException) as exc_info:
#         fail()

#     assert exc_info.value.status_code == 409
#     assert exc_info.value.detail == "conflict"
