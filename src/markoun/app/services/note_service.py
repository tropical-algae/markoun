import asyncio
import hashlib
from pathlib import Path

from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.services.file_service import get_file_meta
from markoun.app.services.history_service import (
    get_file_history_tree,
    save_file_history,
)
from markoun.app.services.system_service import get_file_history_setting
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.util import aread_file, awrite_file
from markoun.core.model.file import (
    FileContentResponse,
    FileSaveRequest,
    FileSaveResponse,
)


async def _content_hash(path: Path) -> str:
    content = await asyncio.to_thread(path.read_bytes)
    return hashlib.sha256(content).hexdigest()


async def load_note(
    db: AsyncSession,
    workspace: WorkspaceContext,
    path: str | Path,
) -> FileContentResponse:
    abs_filepath = workspace.resolve(path, allow_root=False)
    content = await aread_file(abs_filepath)
    meta = get_file_meta(workspace, abs_filepath)
    history_enabled = (
        abs_filepath.suffix.lower() == ".md" and await get_file_history_setting(db)
    )
    default_revision_id = None
    if history_enabled:
        try:
            tree = await get_file_history_tree(
                workspace,
                workspace.relative(abs_filepath).as_posix(),
            )
            default_revision_id = tree.default_revision_id
        except HTTPException as err:
            if err.status_code != CONSTANT.SERV_HISTORY_NOT_FOUND["status_code"]:
                raise
    return FileContentResponse(
        content=content,
        meta=meta,
        history_enabled=history_enabled,
        default_revision_id=default_revision_id,
    )


async def save_note(
    db: AsyncSession,
    workspace: WorkspaceContext,
    data: FileSaveRequest,
    *,
    expected_hash: str | None = None,
) -> FileSaveResponse:
    abs_filepath = workspace.resolve(data.filepath, allow_root=False)
    if expected_hash is not None:
        current_hash = await _content_hash(abs_filepath)
        if current_hash != expected_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="File changed since it was read",
            )

    relative_path = workspace.relative(abs_filepath).as_posix()
    history_enabled = (
        abs_filepath.suffix.lower() == ".md" and await get_file_history_setting(db)
    )
    revision_id = None
    default_revision_id = None
    if history_enabled:
        result = await save_file_history(
            workspace,
            relative_path,
            data.content,
            base_revision_id=data.base_revision_id,
        )
        revision_id = result.revision_id
        default_revision_id = result.default_revision_id
    else:
        await awrite_file(abs_filepath, data.content)

    meta = get_file_meta(workspace, abs_filepath)
    return FileSaveResponse(
        **meta.model_dump(),
        history_enabled=history_enabled,
        revision_id=revision_id,
        default_revision_id=default_revision_id,
    )


async def get_note_content_hash(
    workspace: WorkspaceContext,
    path: str | Path,
) -> str:
    return await _content_hash(workspace.resolve(path, allow_root=False))
