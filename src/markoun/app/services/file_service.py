import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import (
    abs_path_to_relative_path,
    file_suffix,
    formated_file_size,
)
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import FileMeta, FileNode

TIME_FORMAT = "%Y-%m-%d %H:%M"
NOTE_SUFFIX = "md"


# async def get_format_markdown(abs_filepath: Path) -> str:
#     parent_path = abs_filepath.parent.resolve()
#     md = Markdown(renderer=MarkdownRenderer)

#     content = await aread_file(abs_filepath)
#     doc = md.parse(content)

#     def walk(node):
#         if isinstance(node, Image | Link):
#             original_dest = node.dest

#             if not original_dest.startswith(("http", "https", "www", "#")):
#                 dest_path = Path(original_dest)
#                 if not dest_path.is_absolute():
#                     resolved_abs_path = (parent_path / dest_path).resolve()
#                     node.dest = str(get_static_asset_path(resolved_abs_path))

#         if hasattr(node, "children") and isinstance(node.children, list):
#             for child in node.children:
#                 walk(child)

#     walk(doc)

#     final_md = md.render(doc)
#     return final_md


def get_file_meta(abs_filepath: Path) -> FileMeta:
    if not abs_filepath.exists():
        # raise FileNotFoundError(f"Error: {abs_filepath} is not existed")
        logger.error(f"[Failed to read file {abs_filepath}]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

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


@exception_handling(CONSTANT.SERV_FILE_CREATE_FAIL)
def create_note(abs_filepath: Path, file_name: str) -> FileNode:
    filepath = abs_filepath / f"{file_name}.{NOTE_SUFFIX}"

    if filepath.exists():
        logger.error(f"[{filepath} is existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED)

    filepath.touch()
    return FileNode(
        name=file_name,
        path=str(abs_path_to_relative_path(filepath)),
        type=FsNodeType.FILE,
        suffix=NOTE_SUFFIX,
    )


async def upload_file(abs_path: Path, file: UploadFile) -> None:
    filepath = abs_path / (file.filename or f"file_{uuid.uuid4().hex[:8]}.unknown")
    try:
        async with aiofiles.open(filepath, "wb") as f:
            while content := await file.read(1024 * 1024):
                await f.write(content)
    except Exception as err:
        logger.exception(err)
        raise HTTPException(**CONSTANT.SERV_FILE_UPLOAD_FAIL) from err
    finally:
        await file.close()
