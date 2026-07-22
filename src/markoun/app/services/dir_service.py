from pathlib import Path

from fastapi import HTTPException

from markoun.app.services.workspace_service import WorkspaceContext
from markoun.app.utils.constant import CONSTANT
from markoun.common.logging import logger
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import DirNode


def create_dir(workspace: WorkspaceContext, abs_path: Path, dir_name: str) -> DirNode:
    new_folder_path = workspace.resolve_child(abs_path, dir_name)

    if new_folder_path.exists():
        logger.error(f"[{new_folder_path} is existed]")
        raise HTTPException(**CONSTANT.SERV_DIR_EXISTED)

    new_folder_path.mkdir()
    return DirNode(
        name=dir_name,
        path=str(workspace.relative(new_folder_path)),
        type=FsNodeType.DIR,
        suffix="",
        children=[],
    )
