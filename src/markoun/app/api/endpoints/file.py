from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Query,
    Security,
    UploadFile,
)
from fastapi.responses import FileResponse, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import get_db, get_workspace_context
from markoun.app.services.file_service import (
    DEFAULT_SEARCH_LIMIT,
    MAX_SEARCH_LIMIT,
    create_note,
    get_media_response,
    search_markdown_files,
    upload_file,
    upload_pasted_image,
)
from markoun.app.services.note_service import load_note, save_note
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.core.model.file import (
    BasicNode,
    FileContentResponse,
    FileNode,
    FileSaveRequest,
    FileSaveResponse,
    FileSearchResult,
    PastedImageResponse,
    UploadedFileResponse,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.get("/load", response_model=FileContentResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_load_note(
    filepath: str,
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileContentResponse:
    return await load_note(db, workspace, filepath)


@router.get("/search", response_model=list[FileSearchResult])
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_search_notes(
    keyword: str,
    limit: int = Query(DEFAULT_SEARCH_LIMIT, ge=1, le=MAX_SEARCH_LIMIT),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> list[FileSearchResult]:
    return await search_markdown_files(keyword, workspace, limit)


@router.get("/media", response_model=None)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_get_media(
    path: str,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileResponse | Response:
    return get_media_response(workspace, path)


@router.post("/create", response_model=FileNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_create_note(
    note: BasicNode,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileNode:
    abs_filepath = workspace.resolve(Path(note.path))
    file_node = create_note(workspace, abs_filepath, note.name)
    return file_node


@router.post("/save", response_model=FileSaveResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_save_note(
    data: FileSaveRequest,
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileSaveResponse:
    return await save_note(db, workspace, data)


@router.post("/upload", response_model=UploadedFileResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_upload_file(
    path: str,
    file: UploadFile = File(...),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    abs_path = workspace.resolve(Path(path))
    return await upload_file(workspace, abs_path, file)


@router.post("/paste-image", response_model=PastedImageResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_upload_pasted_image(
    note_path: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> PastedImageResponse:
    abs_note_path = workspace.resolve(note_path, allow_root=False)
    return await upload_pasted_image(db, workspace, abs_note_path, file)
