import asyncio
import json
import shutil
import uuid
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

import aiofiles
import anyio
from fastapi import HTTPException, UploadFile
from marko import Markdown
from marko.inline import Image, Link
from marko.md_renderer import MarkdownRenderer

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import (
    abs_path_to_relative_path,
    aread_file,
    file_suffix,
    formated_file_size,
    get_static_asset_path,
)
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import FileMeta, FileNode, PathNode

TIME_FORMAT = "%Y-%m-%d %H:%M"
NOTE_SUFFIX = "md"


@exception_handling
async def get_file_tree(
    current_path: Path, displayed_file_types: set[str]
) -> FileNode | PathNode | None:
    is_dir = await anyio.Path(current_path).is_dir()

    suffix = file_suffix(current_path)

    basic_info = {
        "name": current_path.stem,
        "path": str(abs_path_to_relative_path(current_path.resolve())),
        "type": FsNodeType.DIR if is_dir else FsNodeType.FILE,
        "suffix": suffix,
    }

    if is_dir:
        path_node = PathNode(children=[], **basic_info)
        async for item in anyio.Path(current_path).iterdir():
            child_node = await get_file_tree(Path(item), displayed_file_types)
            if child_node:
                path_node.children.append(child_node)

        path_node.children.sort(key=lambda x: (x.type != "dir", x.name))
        return path_node

    return FileNode(**basic_info) if suffix in displayed_file_types else None


async def get_format_markdown(abs_filepath: Path) -> str:
    parent_path = abs_filepath.parent.resolve()
    md = Markdown(renderer=MarkdownRenderer)

    content = await aread_file(abs_filepath)
    doc = md.parse(content)

    def walk(node):
        if isinstance(node, Image | Link):
            original_dest = node.dest

            if not original_dest.startswith(("http", "https", "www", "#")):
                dest_path = Path(original_dest)
                if not dest_path.is_absolute():
                    resolved_abs_path = (parent_path / dest_path).resolve()
                    node.dest = str(get_static_asset_path(resolved_abs_path))

        if hasattr(node, "children") and isinstance(node.children, list):
            for child in node.children:
                walk(child)

    walk(doc)

    final_md = md.render(doc)
    return final_md


def get_file_meta(abs_filepath: Path) -> FileMeta:
    if not abs_filepath.exists():
        raise FileNotFoundError(f"Error: {abs_filepath} is not existed")

    def fmt(ts: float) -> str:
        return datetime.fromtimestamp(ts).strftime(TIME_FORMAT)

    stat = abs_filepath.stat()
    return FileMeta(
        path=str(abs_path_to_relative_path(abs_filepath)),
        suffix=file_suffix(abs_filepath),
        size=formated_file_size(stat.st_size),
        modified=fmt(stat.st_mtime),
        changed=fmt(stat.st_ctime),
        accessed=fmt(stat.st_atime),
    )


def create_note(abs_path: Path, file_name: str) -> FileNode:
    new_filepath = abs_path / f"{file_name}.{NOTE_SUFFIX}"

    if new_filepath.exists():
        logger.error(f"[{new_filepath} is existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED)

    new_filepath.touch()
    return FileNode(
        name=file_name,
        path=str(abs_path_to_relative_path(new_filepath)),
        type=FsNodeType.FILE,
        suffix=NOTE_SUFFIX,
    )


def create_folder(abs_path: Path, folder_name: str) -> PathNode:
    new_folder_path = abs_path / folder_name

    if new_folder_path.exists():
        logger.error(f"[{new_folder_path} is existed]")
        raise HTTPException(**CONSTANT.SERV_FOLDER_EXISTED)

    new_folder_path.mkdir()
    return PathNode(
        name=folder_name,
        path=str(abs_path_to_relative_path(new_folder_path)),
        type=FsNodeType.DIR,
        suffix="",
        children=[],
    )


async def upload_file(abs_path: Path, file: UploadFile) -> None:
    file_path = abs_path / (file.filename or f"file_{uuid.uuid4().hex[:8]}.png")
    try:
        async with aiofiles.open(file_path, "wb") as f:
            while content := await file.read(1024 * 1024):
                await f.write(content)
    except Exception as err:
        logger.exception(err)
        raise HTTPException(**CONSTANT.SERV_FILE_UPLOAD_FAIL) from err
    finally:
        await file.close()


def remove_path(abs_path: Path) -> None:
    if not abs_path.exists():
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    if abs_path.is_file() or abs_path.is_symlink():
        abs_path.unlink()
    elif abs_path.is_dir():
        shutil.rmtree(abs_path)
