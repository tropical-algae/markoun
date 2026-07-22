import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, cast

import pytz
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette import status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, StreamingResponse

from markoun.app.services.system_service import insert_default_system_setting
from markoun.app.services.user_service import insert_default_user
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.core.db.session import LocalSession, init_db_models

# ALLOW_ORIGINS = ["*"]


def resp_success(response_body: Any) -> Response:
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            **CONSTANT.RESP_SUCCESS,
            "timestamp": str(datetime.now(tz=pytz.timezone("Asia/Shanghai"))),
            "data": response_body,
        },
    )


def resp_error(response_body: dict) -> Response:
    return JSONResponse(
        status_code=response_body["status"],
        content={
            "status": response_body["status"],
            "message": response_body["message"],
            "timestamp": str(datetime.now(tz=pytz.timezone("Asia/Shanghai"))),
            "data": response_body["data"],
        },
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting service...")
    _ = app
    await init_db_models()
    async with LocalSession() as db:
        await insert_default_system_setting(db)
        await insert_default_user(db)

    Path(settings.DOCUMENT_ROOT).mkdir(parents=True, exist_ok=True)

    yield
    logger.info("Shut down and clear cache...")


def add_middleware(app: FastAPI):
    async def log_response(
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        response: StreamingResponse = cast(
            StreamingResponse,
            await call_next(request),
        )

        is_not_api: bool = not request.url.path.startswith(settings.API_PREFIX)
        is_access: bool = request.url.path.endswith("auth/login")
        is_media: bool = request.url.path.endswith("/file/media")
        is_successful_media: bool = (
            is_media and response.status_code < status.HTTP_400_BAD_REQUEST
        )

        if is_access or is_not_api or is_successful_media:
            return response

        body_chunks: list[bytes] = [
            chunk.encode() if isinstance(chunk, str) else bytes(chunk)
            async for chunk in response.body_iterator
        ]
        body_bytes = b"".join(body_chunks)

        response_body: Any
        try:
            response_body = {} if not body_bytes else json.loads(body_bytes.decode())
        except json.JSONDecodeError:
            return Response(
                content=body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        if isinstance(response_body, dict) and response_body.get("is_exception", False):
            new_response: Response = resp_error(response_body)
        else:
            new_response = resp_success(response_body)

        for key, value in response.headers.items():
            if key.lower() not in ["content-length", "content-type"]:
                new_response.headers[key] = value

        return new_response

    app.add_middleware(BaseHTTPMiddleware, dispatch=log_response)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.TRUSTED_ORIGINS,
        # allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        max_age=60 * 60 * 12,
    )
