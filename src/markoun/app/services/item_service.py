import asyncio
import shutil
from pathlib import Path

from fastapi import HTTPException

from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import file_suffix
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import DirNode, FileNode


def _sort_key(node: FileNode | DirNode) -> tuple[bool, bool, str, str]:
    return (
        node.type != FsNodeType.DIR,
        node.suffix.lower() != "md",
        node.suffix,
        node.name.lower(),
    )


def _directory_has_children(current_path: Path, displayed_file_types: set[str]) -> bool:
    for item_path in current_path.iterdir():
        if item_path.is_symlink():
            continue
        if item_path.is_dir() or file_suffix(item_path) in displayed_file_types:
            return True
    return False


def _get_node_summary(
    workspace: WorkspaceContext,
    current_path: Path,
    displayed_file_types: set[str],
) -> FileNode | None:
    if current_path.is_symlink():
        return None
    is_dir = current_path.is_dir()
    suffix = "" if is_dir else file_suffix(current_path)
    node_name = current_path.name if is_dir else current_path.stem
    basic_info = {
        "name": node_name,
        "path": str(workspace.relative(current_path)),
        "type": FsNodeType.DIR if is_dir else FsNodeType.FILE,
        "suffix": suffix,
    }

    if is_dir:
        return FileNode(
            has_children=_directory_has_children(current_path, displayed_file_types),
            **basic_info,
        )

    return FileNode(**basic_info) if suffix in displayed_file_types else None


def _get_directory_children(
    workspace: WorkspaceContext,
    current_path: Path,
    displayed_file_types: set[str],
) -> list[FileNode]:
    if not current_path.exists() or not current_path.is_dir():
        logger.error(f"[Directory {current_path} is not existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    children: list[FileNode] = []
    for item_path in current_path.iterdir():
        child_node = _get_node_summary(workspace, item_path, displayed_file_types)
        if child_node:
            children.append(child_node)

    children.sort(key=_sort_key)
    return children


@exception_handling(CONSTANT.SERV_LOAD_TREE_FAIL)
async def get_directory_children(
    workspace: WorkspaceContext,
    current_path: Path,
    displayed_file_types: set[str],
) -> list[FileNode]:
    return await asyncio.to_thread(
        _get_directory_children, workspace, current_path, displayed_file_types
    )


def _get_file_tree(
    workspace: WorkspaceContext,
    current_path: Path,
    displayed_file_types: set[str],
) -> FileNode | DirNode | None:
    node_summary = _get_node_summary(workspace, current_path, displayed_file_types)
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
            child_node = _get_file_tree(workspace, item_path, displayed_file_types)
            if child_node:
                path_node.children.append(child_node)
        path_node.has_children = bool(path_node.children)
        path_node.children.sort(key=_sort_key)
        return path_node

    return node_summary


@exception_handling(CONSTANT.SERV_LOAD_TREE_FAIL)
async def get_file_tree(
    workspace: WorkspaceContext,
    current_path: Path,
    displayed_file_types: set[str],
) -> FileNode | DirNode | None:
    return await asyncio.to_thread(
        _get_file_tree, workspace, current_path, displayed_file_types
    )


@exception_handling(CONSTANT.SERV_REMOVE_ITEM_FAIL)
def remove_item(abs_path: Path) -> None:
    if not abs_path.exists():
        logger.error(f"[File {abs_path} is not existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    if abs_path.is_file() or abs_path.is_symlink():
        abs_path.unlink()
    elif abs_path.is_dir():
        shutil.rmtree(abs_path)


def _move_item(
    workspace: WorkspaceContext,
    source_path: str | Path,
    target_dir: str | Path,
    displayed_file_types: set[str],
) -> FileNode:
    source_path = Path(source_path).resolve()
    target_dir = Path(target_dir).resolve()

    if not source_path.exists():
        logger.error(f"Failed to move {source_path}, file not existed!")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    if not target_dir.exists() or not target_dir.is_dir():
        logger.error(
            f"Failed to move {source_path}, target dir {target_dir} not existed!"
        )
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    if source_path.parent == target_dir:
        node = _get_node_summary(workspace, source_path, displayed_file_types)
        if node is None:
            raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)
        return node

    if source_path.is_dir() and target_dir.is_relative_to(source_path):
        logger.error(f"Failed to move {source_path} into itself or child {target_dir}")
        raise HTTPException(**CONSTANT.SERV_ITEM_MOVE_FORBIDDEN)

    new_path = workspace.resolve_child(target_dir, source_path.name)
    if new_path.exists():
        logger.error(f"Failed to move {source_path}, target {new_path} existed!")
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED)

    source_path.rename(new_path)
    node = _get_node_summary(workspace, new_path, displayed_file_types)
    if node is None:
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)
    return node


async def move_item(
    workspace: WorkspaceContext,
    source_path: str | Path,
    target_dir: str | Path,
    displayed_file_types: set[str],
) -> FileNode:
    return await asyncio.to_thread(
        _move_item,
        workspace,
        source_path,
        target_dir,
        displayed_file_types,
    )


def rename_item(workspace: WorkspaceContext, path: str | Path, new_name: str) -> None:
    path = Path(path)
    if not path.exists():
        logger.error(f"Failed to rename {path}, file not existed!")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    new_path = workspace.resolve_child(path.parent, f"{new_name}{path.suffix}")
    if new_path.exists():
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED)
    path.rename(new_path)
