from pathlib import Path
from typing import cast

from fastapi import APIRouter, HTTPException, Security

from markoun.app.api.deps import get_current_user
from markoun.app.services.file_service import (
    create_folder,
    create_note,
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
async def api_load_tree(
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> list[FileNode | PathNode]:
    try:
        file_tree = cast(
            PathNode,
            await get_file_tree(DOUCMENT_ABS_ROOT, DISPLAYED_FILE_TYPES),
        )
        return file_tree.children
    except Exception as err:
        logger.error(f"[Failed to load File Tree] {err}")
        raise HTTPException(**CONSTANT.SERV_LOAD_TREE_FAIL) from err


@router.get("/load-note", response_model=FileDetail)
async def api_load_note(
    filepath: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileDetail:
    try:
        abs_filepath = relative_path_to_abs_path(Path(filepath))
        content = await get_format_markdown(abs_filepath)
        meta = get_file_meta(abs_filepath)
        return FileDetail(content=content, meta=meta)
    except Exception as err:
        logger.error(f"[Failed to load file {filepath}] {err}")
        raise HTTPException(**CONSTANT.SERV_LOAD_FILE_FAIL) from err


@router.get("/create-note", response_model=FileNode)
async def api_create_note(
    path: str,
    file_name: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> FileNode:
    try:
        abs_filepath = relative_path_to_abs_path(Path(path))
        file_node = create_note(abs_filepath, file_name)
        return file_node
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"[Failed to create file {path}] {err}")
        raise HTTPException(**CONSTANT.SERV_FILE_CREATE_FAIL) from err


@router.get("/create-folder", response_model=PathNode)
async def api_create_folder(
    path: str,
    folder_name: str,
    _: UserAccount = Security(get_current_user, scopes=[ScopeType.ADMIN, ScopeType.USER]),
) -> PathNode:
    try:
        abs_path = relative_path_to_abs_path(Path(path))
        path_node = create_folder(abs_path, folder_name)
        return path_node
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"[Failed to create folder {path}] {err}")
        raise HTTPException(**CONSTANT.SERV_FOLDER_CREATE_FAIL) from err
