from pathlib import Path

from fastapi import APIRouter, File, Security, UploadFile

from markoun.app.api.deps import get_current_user
from markoun.app.services.file_service import create_note, get_file_meta, upload_file
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.common.util import aread_file, awrite_file, relative_path_to_abs_path
from markoun.core.db.models import UserAccount
from markoun.core.model.file import (
    BasicNode,
    FileContentResponse,
    FileMeta,
    FileNode,
    SaveFileRequest,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.get("/load", response_model=FileContentResponse)
async def api_load_note(
    filepath: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileContentResponse:
    abs_filepath = relative_path_to_abs_path(Path(filepath))
    content = await aread_file(abs_filepath)
    meta = get_file_meta(abs_filepath)
    return FileContentResponse(content=content, meta=meta)


@router.post("/create", response_model=FileNode)
async def api_create_note(
    note: BasicNode,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileNode:
    abs_filepath = relative_path_to_abs_path(Path(note.path))
    file_node = create_note(abs_filepath, note.name)
    return file_node


@router.post("/save", response_model=FileMeta)
async def api_save_note(
    data: SaveFileRequest,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
):
    abs_filepath = relative_path_to_abs_path(Path(data.filepath))
    await awrite_file(abs_filepath, data.content)
    meta = get_file_meta(abs_filepath)
    return meta


@router.post("/upload")
async def api_upload_file(
    path: str,
    file: UploadFile = File(...),
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
):
    abs_path = relative_path_to_abs_path(Path(path))
    await upload_file(abs_path, file)
    return {
        "status": "ok",
        "filename": file.filename,
    }
