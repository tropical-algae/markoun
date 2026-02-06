import shutil
from pathlib import Path

import anyio
from fastapi import HTTPException

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import abs_path_to_relative_path, file_suffix
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import DirNode, FileNode


@exception_handling(CONSTANT.SERV_LOAD_TREE_FAIL)
async def get_file_tree(
    current_path: Path, displayed_file_types: set[str]
) -> FileNode | DirNode | None:
    is_dir = await anyio.Path(current_path).is_dir()

    suffix = file_suffix(current_path)

    basic_info = {
        "name": current_path.stem,
        "path": str(abs_path_to_relative_path(current_path.resolve())),
        "type": FsNodeType.DIR if is_dir else FsNodeType.FILE,
        "suffix": suffix,
    }

    if is_dir:
        path_node = DirNode(children=[], **basic_info)
        async for item in anyio.Path(current_path).iterdir():
            child_node = await get_file_tree(Path(item), displayed_file_types)
            if child_node:
                path_node.children.append(child_node)

        path_node.children.sort(key=lambda x: (x.type != "dir", x.name))
        return path_node

    return FileNode(**basic_info) if suffix in displayed_file_types else None


@exception_handling(CONSTANT.SERV_REMOVE_ITEM_FAIL)
def remove_item(abs_path: Path) -> None:
    if not abs_path.exists():
        logger.error(f"[File {abs_path} is not existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    if abs_path.is_file() or abs_path.is_symlink():
        abs_path.unlink()
    elif abs_path.is_dir():
        shutil.rmtree(abs_path)


def rename_item(path: str | Path, new_name: str) -> None:
    path = Path(path)
    if not path.exists():
        logger.error(f"Failed to rename {path}, file not existed!")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    new_path = path.with_stem(new_name)
    path.rename(new_path)
