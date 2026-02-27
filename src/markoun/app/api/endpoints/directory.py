from pathlib import Path

from fastapi import APIRouter, Security

from markoun.app.api.deps import get_current_user
from markoun.app.services.dir_service import create_dir
from markoun.app.utils.constant import CONSTANT
from markoun.common.decorator import exception_handling
from markoun.common.util import relative_path_to_abs_path
from markoun.core.db.models import UserAccount
from markoun.core.model.file import BasicNode, DirNode
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.post("/create", response_model=DirNode)
@exception_handling(CONSTANT.RESP_SERVER_ERROR)
async def api_create_dir(
    note: BasicNode,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> DirNode:
    abs_path = relative_path_to_abs_path(Path(note.path))
    dir_node = create_dir(abs_path, note.name)
    return dir_node
