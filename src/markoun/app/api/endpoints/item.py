from pathlib import Path
from typing import cast

from fastapi import APIRouter, HTTPException, Security

from markoun.app.api.deps import get_current_user
from markoun.app.services.item_service import get_file_tree, remove_item, rename_item
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.common.util import relative_path_to_abs_path
from markoun.core.db.models import UserAccount
from markoun.core.model.file import DirNode, FileNode, ItemRenameRequest
from markoun.core.model.user import ScopeType

router = APIRouter()


DOUCMENT_ABS_ROOT = Path(settings.DOCUMENT_ROOT).absolute()
DISPLAYED_FILE_TYPES = set(settings.DISPLAYED_FILE_TYPES)


@router.get("/tree")
async def api_load_tree(
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> list[FileNode | DirNode]:
    file_tree = cast(
        DirNode,
        await get_file_tree(DOUCMENT_ABS_ROOT, DISPLAYED_FILE_TYPES),
    )
    return file_tree.children


@router.post("/remove")
async def api_remove_path(
    filepath: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
):
    abs_path = relative_path_to_abs_path(Path(filepath))
    remove_item(abs_path)
    return "ok"


@router.post("/rename")
async def api_item_rename(
    data: ItemRenameRequest,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
):
    abs_path = relative_path_to_abs_path(Path(data.path))
    rename_item(abs_path, data.new_name)
    return "ok"
