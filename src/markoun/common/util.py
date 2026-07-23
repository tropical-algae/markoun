import asyncio
import importlib
import json
import os
import pkgutil
import re
import secrets
import string
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from types import ModuleType
from typing import Any

import aiofiles
import yaml
from fastapi import HTTPException

from markoun.app.utils.constant import CONSTANT
from markoun.common.logging import logger
from markoun.core.db.session import LocalSession

TOKEN_SEQUENCE = string.ascii_uppercase + string.digits
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$")
SIZE_UNITS = ["B", "KB", "MB", "GB"]


def local_now() -> datetime:
    """Return the current time using the operating system's local timezone."""
    return datetime.now().astimezone()


async def async_db_wrapper(func: Callable, *args, **kwargs) -> Any:
    try:
        async with LocalSession() as db:
            return await func(*args, db=db, **kwargs)
    except Exception:
        return None


async def aread_file(filepath: Path) -> str:
    try:
        async with aiofiles.open(str(filepath), encoding="utf-8") as f:
            content = await f.read()
            return content
    except Exception as err:
        logger.exception(f"[Failed to read file {filepath}] {err}")
        raise HTTPException(**CONSTANT.SERV_READ_FILE_FAIL) from err


async def awrite_file(filepath: Path, content: str) -> None:
    if not await asyncio.to_thread(filepath.exists):
        logger.error(f"[File {filepath} is not existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)
    try:
        async with aiofiles.open(filepath, mode="w", encoding="utf-8") as f:
            await f.write(content)
    except Exception as err:
        logger.exception(f"[Failed to write file {filepath}] {err}")
        raise HTTPException(**CONSTANT.SERV_FILE_SAVE_FAIL) from err


def file_suffix(path: Path) -> str:
    return path.suffix.lower().lstrip(".")


def relative_path_from_file(source_file: Path, target_path: Path) -> str:
    relative_path = os.path.relpath(target_path, start=source_file.parent)
    return Path(relative_path).as_posix()


def formated_file_size(size: int) -> str:
    value = float(size)

    for unit in SIZE_UNITS[:-1]:
        if value < 1024:
            return f"{value:.2f} {unit}"
        value /= 1024

    return f"{value:.2f} {SIZE_UNITS[-1]}"


def load_yaml(yaml_path: str) -> dict:
    try:
        with open(yaml_path) as yaml_file:
            return yaml.safe_load(yaml_file)
    except Exception as err:
        raise Exception(
            f"Error occurred when read YAML from path '{yaml_path}'. Error: {err}"
        ) from err


def import_all_modules_from_package(package: ModuleType) -> None:
    """Import all models from pkg

    Args:
        package (str): pkg name
    """
    for _, modname, _ in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        importlib.import_module(modname)


def generate_random_token(prefix: str = "", length: int = 32) -> str:
    """Generate random token

    Args:
        length (int, optional): the length of token. Defaults to 32.

    Returns:
        str: random token
    """
    key_length = length - len(prefix)
    assert key_length > 0, "The length of the token must greater than the prefix."
    return prefix + "".join(secrets.choice(TOKEN_SEQUENCE) for _ in range(key_length))


def is_valid_username(value: str) -> bool:
    return USERNAME_PATTERN.fullmatch(value) is not None


def str_to_json(text: str) -> list:
    try:
        scopes = json.loads(text)
        return scopes
    except Exception as err:
        logger.error(f"[Failed to trans text '{text}' to json] {err}")
        raise HTTPException(**CONSTANT.RESP_SERVER_ERROR) from err
