from pathlib import Path

from fastapi import HTTPException

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.logging import logger
from markoun.common.util import abs_path_to_relative_path
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import DirNode


def create_dir(abs_path: Path, dir_name: str) -> DirNode:
    new_folder_path = abs_path / dir_name

    if new_folder_path.exists():
        logger.error(f"[{new_folder_path} is existed]")
        raise HTTPException(**CONSTANT.SERV_DIR_EXISTED)

    new_folder_path.mkdir()
    return DirNode(
        name=dir_name,
        path=str(abs_path_to_relative_path(new_folder_path)),
        type=FsNodeType.DIR,
        suffix="",
        children=[],
    )
