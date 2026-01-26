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
from markoun.core.db.models import UserAccount
from markoun.core.model.file import FileDetail, FileNode, PathNode
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


@router.get("/load", response_model=FileDetail)
async def load_local_file(
    path: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileDetail:
    try:
        file_path = Path(path)
        content = await get_format_markdown(file_path)
        meta = get_file_meta(file_path)
        return FileDetail(content=content, meta=meta)
    except Exception as err:
        logger.error(f"{err} Failed to load file {path}.")
        raise HTTPException(**CONSTANT.SERV_LOAD_FILE_FAIL) from err
