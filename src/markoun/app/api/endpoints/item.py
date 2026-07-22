from pathlib import Path
from typing import cast

from fastapi import APIRouter, Security

from markoun.app.api.deps import get_workspace_context
from markoun.app.services.item_service import (
    get_directory_children,
    get_file_tree,
    move_item,
    remove_item,
    rename_item,
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
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    abs_path = workspace.resolve(Path(filepath), allow_root=False)
    remove_item(abs_path)
    return MSG_SUCCESS


@router.post("/rename")
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_item_rename(
    data: ItemRenameRequest,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
):
    abs_path = workspace.resolve(Path(data.path), allow_root=False)
    rename_item(workspace, abs_path, data.new_name)
    return MSG_SUCCESS


@router.post("/move", response_model=FileNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_item_move(
    data: ItemMoveRequest,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> FileNode:
    abs_path = workspace.resolve(Path(data.path), allow_root=False)
    abs_target_dir = workspace.resolve(Path(data.target_dir))
    return await move_item(workspace, abs_path, abs_target_dir, DISPLAYED_FILE_TYPES)
