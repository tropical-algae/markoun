from pathlib import Path
from typing import cast

from fastapi import APIRouter, Security

from markoun.app.api.deps import get_current_user
from markoun.app.services.file_service import get_file_tree, get_local_markdown
from markoun.common.config import settings
from markoun.core.db.models import UserAccount
from markoun.core.model.file import FileNode, PathNode
from markoun.core.model.user import ScopeType

router = APIRouter()


@router.get("/tree")
async def file_tree(
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> list[FileNode | PathNode]:
    file_tree = cast(
        PathNode,
        await get_file_tree(
            Path(settings.DOCUMENT_ROOT), set(settings.DISPLAYED_FILE_TYPES)
        ),
    )
    return file_tree.children


@router.get("/load")
async def load_local_file(
    path: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> str:
    content = await get_local_markdown(Path(path))
    return content
