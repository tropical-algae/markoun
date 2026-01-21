import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import pytz
from fastapi import FastAPI
from fastapi.concurrency import iterate_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from starlette import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.core.db.session import init_db_models

origins = ["*"]


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
    Path(settings.DOCUMENT_ROOT).mkdir(parents=True, exist_ok=True)

    yield
    logger.info("Shut down and clear cache...")


def add_middleware(app: FastAPI):
    async def log_response(request: Request, call_next):
        response = await call_next(request)
        # return directly if not an api endpoint
        is_not_api: bool = not request.url.path.startswith(settings.API_PREFIX)
        is_access: bool = request.url.path.endswith("access-token")
        is_stream: bool = request.url.path.endswith("stream")
        if is_access or is_not_api or is_stream:
            return response

        # return exception
        response_body = [chunk async for chunk in response.body_iterator]
        response.body_iterator = iterate_in_threadpool(iter(response_body))
        response_body = json.loads(response_body[0].decode())
        if isinstance(response_body, dict) and response_body.get("is_exception", False):
            return resp_error(response_body)

        response_body = [chunk async for chunk in response.body_iterator]
        response.body_iterator = iterate_in_threadpool(iter(response_body))
        response_body = json.loads(response_body[0].decode())

        return resp_success(response_body)

    app.add_middleware(BaseHTTPMiddleware, dispatch=log_response)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
