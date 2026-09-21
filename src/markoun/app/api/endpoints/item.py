from pathlib import Path
from typing import cast

from fastapi import APIRouter, Security

from markoun.app.api.deps import get_workspace_context
from markoun.app.services.item_service import (
    get_directory_children,
    get_file_tree,
)
from markoun.app.services.workspace_item_service import (
    move_workspace_item,
    remove_workspace_item,
    rename_workspace_item,
)
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT, MSG_SUCCESS
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.core.model.file import (
    DirectoryChildrenResponse,
    DirNode,
    FileNode,
    ItemMoveRequest,
    ItemRenameRequest,
)
from markoun.core.model.user import ScopeType

router = APIRouter()


DISPLAYED_FILE_TYPES = set(settings.DISPLAYED_FILE_TYPES)


@router.get("/tree")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_load_tree(
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> list[FileNode | DirNode]:
    file_tree = cast(
        DirNode,
        await get_file_tree(workspace, workspace.root, DISPLAYED_FILE_TYPES),
    )
    return file_tree.children


@router.get("/children", response_model=DirectoryChildrenResponse)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_load_directory_children(
    path: str = ".",
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> DirectoryChildrenResponse:
    abs_path = workspace.resolve(Path(path))
    children = await get_directory_children(workspace, abs_path, DISPLAYED_FILE_TYPES)
    return DirectoryChildrenResponse(
        path=str(workspace.relative(abs_path)),
        children=children,
    )


@router.post("/remove")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_remove_path(
    filepath: str,
    purge_history: bool = False,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    await remove_workspace_item(workspace, filepath, purge_history=purge_history)
    return MSG_SUCCESS


@router.post("/rename")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_item_rename(
    data: ItemRenameRequest,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    await rename_workspace_item(workspace, data.path, data.new_name)
    return MSG_SUCCESS


@router.post("/move", response_model=FileNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_item_move(
    data: ItemMoveRequest,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileNode:
    return await move_workspace_item(
        workspace,
        data.path,
        data.target_dir,
        DISPLAYED_FILE_TYPES,
    )
