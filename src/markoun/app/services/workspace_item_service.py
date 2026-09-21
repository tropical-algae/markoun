from pathlib import Path

from markoun.app.services.history_service import (
    mark_file_history_deleted,
    move_file_history,
)
from markoun.app.services.item_service import move_item, remove_item, rename_item
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.core.model.file import FileNode


async def remove_workspace_item(
    workspace: WorkspaceContext,
    path: str | Path,
    *,
    purge_history: bool = False,
) -> None:
    abs_path = workspace.resolve(path, allow_root=False)
    relative_path = workspace.relative(abs_path).as_posix()
    remove_item(abs_path)
    await mark_file_history_deleted(
        workspace,
        relative_path,
        purge=purge_history,
    )


async def rename_workspace_item(
    workspace: WorkspaceContext,
    path: str | Path,
    new_name: str,
) -> None:
    abs_path = workspace.resolve(path, allow_root=False)
    source_path = workspace.relative(abs_path).as_posix()
    new_path = rename_item(workspace, abs_path, new_name)
    await move_file_history(
        workspace,
        source_path,
        workspace.relative(new_path).as_posix(),
    )


async def move_workspace_item(
    workspace: WorkspaceContext,
    path: str | Path,
    target_dir: str | Path,
    displayed_file_types: set[str],
) -> FileNode:
    abs_path = workspace.resolve(path, allow_root=False)
    abs_target_dir = workspace.resolve(target_dir)
    source_path = workspace.relative(abs_path).as_posix()
    node = await move_item(
        workspace,
        abs_path,
        abs_target_dir,
        displayed_file_types,
    )
    await move_file_history(workspace, source_path, node.path)
    return node
