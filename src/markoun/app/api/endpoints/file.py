from pathlib import Path

from fastapi import APIRouter, File, Query, Security, UploadFile

from markoun.app.api.deps import WorkspaceAccess, get_workspace_access
from markoun.app.services.file_service import (
    DEFAULT_SEARCH_LIMIT,
    MAX_SEARCH_LIMIT,
    create_note,
    get_file_meta,
    search_markdown_files,
    upload_file,
)
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.util import aread_file, awrite_file, relative_path_to_abs_path
from markoun.core.model.file import (
    BasicNode,
    FileContentResponse,
    FileMeta,
    FileNode,
    FileSaveRequest,
    FileSearchResult,
    UploadedFileResponse,
)
from markoun.core.model.user import ScopeType

router = APIRouter()
DOCUMENT_ABS_ROOT = Path(settings.DOCUMENT_ROOT).absolute()


@router.get("/load", response_model=FileContentResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_load_note(
    filepath: str,
    _: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileContentResponse:
    abs_filepath = relative_path_to_abs_path(Path(filepath))
    content = await aread_file(abs_filepath)
    meta = get_file_meta(abs_filepath)
    return FileContentResponse(content=content, meta=meta)


@router.get("/search", response_model=list[FileSearchResult])
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_search_notes(
    keyword: str,
    limit: int = Query(DEFAULT_SEARCH_LIMIT, ge=1, le=MAX_SEARCH_LIMIT),
    _: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> list[FileSearchResult]:
    return await search_markdown_files(keyword, DOCUMENT_ABS_ROOT, limit)


@router.post("/create", response_model=FileNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_create_note(
    note: BasicNode,
    _: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileNode:
    abs_filepath = relative_path_to_abs_path(Path(note.path))
    file_node = create_note(abs_filepath, note.name)
    return file_node


@router.post("/save", response_model=FileMeta)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_save_note(
    data: FileSaveRequest,
    _: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    abs_filepath = relative_path_to_abs_path(Path(data.filepath))
    await awrite_file(abs_filepath, data.content)
    meta = get_file_meta(abs_filepath)
    return meta


@router.post("/upload", response_model=UploadedFileResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_upload_file(
    path: str,
    file: UploadFile = File(...),
    _: WorkspaceAccess = Security(
        get_workspace_access, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    abs_path = relative_path_to_abs_path(Path(path))
    return await upload_file(abs_path, file)
