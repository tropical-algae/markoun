import shutil
from pathlib import Path

from fastapi import HTTPException

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import abs_path_to_relative_path, file_suffix
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import DirNode, FileNode


def _sort_key(node: FileNode | DirNode) -> tuple[bool, bool, str, str]:
    return (
        node.type != FsNodeType.DIR,
        node.suffix.lower() != "md",
        node.suffix,
        node.name.lower(),
    )


async def _directory_has_children(
    current_path: Path, displayed_file_types: set[str]
) -> bool:
    for item_path in current_path.iterdir():
        if item_path.is_dir() or file_suffix(item_path) in displayed_file_types:
            return True
    return False


async def _get_node_summary(
    current_path: Path, displayed_file_types: set[str]
) -> FileNode | None:
    is_dir = current_path.is_dir()
    suffix = "" if is_dir else file_suffix(current_path)
    node_name = current_path.name if is_dir else current_path.stem
    basic_info = {
        "name": node_name,
        "path": str(abs_path_to_relative_path(current_path.resolve())),
        "type": FsNodeType.DIR if is_dir else FsNodeType.FILE,
        "suffix": suffix,
    }

    if is_dir:
        return FileNode(
            has_children=await _directory_has_children(
                current_path, displayed_file_types
            ),
            **basic_info,
        )

    return FileNode(**basic_info) if suffix in displayed_file_types else None


@exception_handling(CONSTANT.SERV_LOAD_TREE_FAIL)
async def get_directory_children(
    current_path: Path, displayed_file_types: set[str]
) -> list[FileNode]:
    if not current_path.exists() or not current_path.is_dir():
        logger.error(f"[Directory {current_path} is not existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    children: list[FileNode] = []
    for item_path in current_path.iterdir():
        child_node = await _get_node_summary(item_path, displayed_file_types)
        if child_node:
            children.append(child_node)

    children.sort(key=_sort_key)
    return children


@exception_handling(CONSTANT.SERV_LOAD_TREE_FAIL)
async def get_file_tree(
    current_path: Path, displayed_file_types: set[str]
) -> FileNode | DirNode | None:
    node_summary = await _get_node_summary(current_path, displayed_file_types)
    if node_summary is None:
        return None

    if node_summary.type == FsNodeType.DIR:
        path_node = DirNode(
            name=node_summary.name,
            path=node_summary.path,
            type=node_summary.type,
            suffix=node_summary.suffix,
            has_children=bool(node_summary.has_children),
            children=[],
        )
        for item_path in current_path.iterdir():
            child_node = await get_file_tree(item_path, displayed_file_types)
            if child_node:
                path_node.children.append(child_node)
        path_node.has_children = bool(path_node.children)
        path_node.children.sort(key=_sort_key)
        return path_node

    return node_summary


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
