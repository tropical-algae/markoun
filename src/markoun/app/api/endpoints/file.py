from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
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
    get_file_meta,
    get_media_response,
    search_markdown_files,
    upload_file,
    upload_pasted_image,
)
from markoun.app.services.history_service import (
    get_file_history_tree,
    save_file_history,
)
from markoun.app.services.system_service import get_file_history_setting
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.common.util import aread_file, awrite_file
from markoun.core.model.file import (
    BasicNode,
    FileContentResponse,
    FileMeta,
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
    abs_filepath = workspace.resolve(Path(filepath), allow_root=False)
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
    abs_filepath = workspace.resolve(Path(data.filepath), allow_root=False)
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
            operation_id=data.operation_id,
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
