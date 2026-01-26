from pathlib import Path
from typing import cast

from fastapi import APIRouter, HTTPException, Security

from markoun.app.api.deps import get_current_user
from markoun.app.services.file_service import (
    get_file_meta,
    get_file_tree,
    get_format_markdown,
)
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.common.util import relative_path_to_abs_path
from markoun.core.db.models import UserAccount
from markoun.core.model.file import FileDetail, FileNode, PathNode
from markoun.core.model.user import ScopeType

router = APIRouter()

DOUCMENT_ABS_ROOT = Path(settings.DOCUMENT_ROOT).absolute()
DISPLAYED_FILE_TYPES = set(settings.DISPLAYED_FILE_TYPES)


@router.get("/tree")
async def file_tree(
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> list[FileNode | PathNode]:
    try:
        file_tree = cast(
            PathNode,
            await get_file_tree(DOUCMENT_ABS_ROOT, DISPLAYED_FILE_TYPES),
        )
        return file_tree.children
    except Exception as err:
        logger.error(f"{err} Failed to load File Tree.")
        raise HTTPException(**CONSTANT.SERV_LOAD_TREE_FAIL) from err


@router.get("/load", response_model=FileDetail)
async def load_local_file(
    path: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileDetail:
    try:
        abs_file_path = relative_path_to_abs_path(Path(path))
        content = await get_format_markdown(abs_file_path)
        meta = get_file_meta(abs_file_path)
        return FileDetail(content=content, meta=meta)
    except Exception as err:
        logger.error(f"{err} Failed to load file {path}.")
        raise HTTPException(**CONSTANT.SERV_LOAD_FILE_FAIL) from err
