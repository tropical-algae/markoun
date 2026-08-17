import asyncio
from collections.abc import Callable
from pathlib import Path

from markoun.app.services.workspace_service import (
    WORKSPACE_DATA_DIRECTORY,
    WorkspaceContext,
)
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.core.file_history import (
    FileHistory,
    HistoryCorruptedError,
    HistoryNodeNotFoundError,
    HistoryNotFoundError,
    HistorySaveResult,
    HistoryTree,
    UnsupportedHistoryFileError,
)

HISTORY_DIRECTORY = "history"
MANAGED_HISTORY_SUFFIXES = {".md"}
HISTORY_EXCEPTION_RESPONSES = {
    FileNotFoundError: CONSTANT.SERV_FILE_NOT_EXISTED,
    HistoryNotFoundError: CONSTANT.SERV_HISTORY_NOT_FOUND,
    HistoryNodeNotFoundError: CONSTANT.SERV_HISTORY_NODE_NOT_FOUND,
    UnsupportedHistoryFileError: CONSTANT.SERV_HISTORY_FILE_UNSUPPORTED,
    HistoryCorruptedError: CONSTANT.SERV_HISTORY_CORRUPTED,
}


def create_file_history(workspace: WorkspaceContext) -> FileHistory:
    return FileHistory(
        workspace_root=workspace.document_root,
        repository_root=(
            workspace.document_root / WORKSPACE_DATA_DIRECTORY / HISTORY_DIRECTORY
        ),
        allowed_suffixes=MANAGED_HISTORY_SUFFIXES,
    )


def _resolve_history_path(
    workspace: WorkspaceContext,
    path: str | Path,
) -> str:
    return workspace.document_relative(workspace.resolve(path)).as_posix()


async def save_file_history(
    workspace: WorkspaceContext,
    path: str | Path,
    content: str,
    *,
    base_revision_id: str | None = None,
) -> HistorySaveResult:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.save,
        _resolve_history_path(workspace, path),
        content,
        base_revision_id=base_revision_id,
        author=workspace.username,
    )


async def get_file_history_tree(
    workspace: WorkspaceContext,
    path: str | Path,
) -> HistoryTree:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.get_tree,
        _resolve_history_path(workspace, path),
    )


async def get_file_history_revision(
    workspace: WorkspaceContext,
    path: str | Path,
    revision_id: str,
) -> str:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.get_revision,
        _resolve_history_path(workspace, path),
        revision_id,
    )


async def delete_file_history_revision(
    workspace: WorkspaceContext,
    path: str | Path,
    revision_id: str,
) -> HistoryTree:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.delete_revision,
        _resolve_history_path(workspace, path),
        revision_id,
    )


async def move_file_history(
    workspace: WorkspaceContext,
    source: str | Path,
    target: str | Path,
) -> int:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.move,
        _resolve_history_path(workspace, source),
        _resolve_history_path(workspace, target),
    )


async def mark_file_history_deleted(
    workspace: WorkspaceContext,
    path: str | Path,
    *,
    purge: bool = False,
) -> int:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.mark_deleted,
        _resolve_history_path(workspace, path),
        purge=purge,
    )


async def purge_file_history(
    workspace: WorkspaceContext,
    path: str | Path,
) -> int:
    history = create_file_history(workspace)
    return await _run_history_operation(
        history.purge,
        _resolve_history_path(workspace, path),
    )


@exception_handling(
    CONSTANT.RESP_SERVER_ERROR,
    exception_responses=HISTORY_EXCEPTION_RESPONSES,
)
async def _run_history_operation[**P, R](
    operation: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R:
    return await asyncio.to_thread(operation, *args, **kwargs)
