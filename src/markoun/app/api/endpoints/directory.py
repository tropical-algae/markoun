from pathlib import Path

from fastapi import APIRouter, Security

from markoun.app.api.deps import get_workspace_context
from markoun.app.services.dir_service import create_dir
from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.core.model.file import BasicNode, DirNode
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.post("/create", response_model=DirNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_create_dir(
    note: BasicNode,
    workspace: WorkspaceContext = Security(
        get_workspace_context, scopes=[ScopeType.ADMIN, ScopeType.USER]
    ),
) -> DirNode:
    abs_path = workspace.resolve(Path(note.path))
    dir_node = create_dir(workspace, abs_path, note.name)
    return dir_node
