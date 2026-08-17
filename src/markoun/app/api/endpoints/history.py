from fastapi import APIRouter, Depends, HTTPException, Security
from sqlmodel.ext.asyncio.session import AsyncSession

from markoun.app.api.deps import get_db, get_workspace_context
from markoun.app.services.history_service import (
    delete_file_history_revision,
    get_file_history_revision,
    get_file_history_tree,
    purge_file_history,
)
from markoun.app.services.system_service import get_file_history_setting
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.core.file_history import HistoryTree
from markoun.core.model.history import (
    HistoryDeleteRequest,
    HistoryNodeResponse,
    HistoryPurgeResponse,
    HistoryRevisionResponse,
    HistoryTreeResponse,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


async def _require_file_history(db: AsyncSession) -> None:
    if not await get_file_history_setting(db):
        raise HTTPException(**CONSTANT.SERV_HISTORY_DISABLED)


def _to_tree_response(tree: HistoryTree) -> HistoryTreeResponse:
    return HistoryTreeResponse(
        note_id=tree.note_id,
        root_node_id=tree.root_node_id,
        default_revision_id=tree.default_revision_id,
        nodes=[
            HistoryNodeResponse(
                id=node.id,
                parent_id=node.parent_id,
                created_at=node.created_at,
                sequence=node.sequence,
                content_size=node.content_size,
                author=node.author,
                path=node.path,
                message=node.message,
            )
            for node in tree.nodes
        ],
    )


@router.get("/tree", response_model=HistoryTreeResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_get_history_tree(
    filepath: str,
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> HistoryTreeResponse:
    await _require_file_history(db)
    relative_path = workspace.relative(
        workspace.resolve(filepath, allow_root=False)
    ).as_posix()
    tree = await get_file_history_tree(workspace, relative_path)
    return _to_tree_response(tree)


@router.get("/revision", response_model=HistoryRevisionResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_get_history_revision(
    filepath: str,
    revision_id: str,
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> HistoryRevisionResponse:
    await _require_file_history(db)
    relative_path = workspace.relative(
        workspace.resolve(filepath, allow_root=False)
    ).as_posix()
    content = await get_file_history_revision(
        workspace,
        relative_path,
        revision_id,
    )
    return HistoryRevisionResponse(revision_id=revision_id, content=content)


@router.delete("/revision", response_model=HistoryTreeResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_delete_history_revision(
    data: HistoryDeleteRequest,
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> HistoryTreeResponse:
    await _require_file_history(db)
    relative_path = workspace.relative(
        workspace.resolve(data.filepath, allow_root=False)
    ).as_posix()
    tree = await delete_file_history_revision(
        workspace,
        relative_path,
        data.revision_id,
    )
    return _to_tree_response(tree)


@router.delete("", response_model=HistoryPurgeResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_purge_history(
    path: str = ".",
    db: AsyncSession = Depends(get_db),
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> HistoryPurgeResponse:
    await _require_file_history(db)
    relative_path = workspace.relative(workspace.resolve(path)).as_posix()
    deleted_histories = await purge_file_history(workspace, relative_path)
    return HistoryPurgeResponse(deleted_histories=deleted_histories)
