from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.util import is_valid_username
from markoun.core.db.models import UserAccount


@dataclass(frozen=True)
class WorkspaceContext:
    document_root: Path
    root: Path
    username: str | None = None

    def resolve(self, relative_path: str | Path, *, allow_root: bool = True) -> Path:
        if "\0" in str(relative_path) or "\\" in str(relative_path):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
        path = Path(relative_path)
        if path.is_absolute():
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)

        candidate = (self.root / path).resolve(strict=False)
        if not candidate.is_relative_to(self.root) or (
            not allow_root and candidate == self.root
        ):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
        return candidate

    def resolve_child(self, parent: Path, name: str) -> Path:
        if (
            not name
            or name in {".", ".."}
            or Path(name).name != name
            or "\\" in name
            or any(ord(char) < 32 for char in name)
        ):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
        return self.resolve(self.relative(parent) / name, allow_root=False)

    def relative(self, path: Path) -> Path:
        resolved_path = path.resolve(strict=False)
        if not resolved_path.is_relative_to(self.root):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
        return resolved_path.relative_to(self.root)

    def document_relative(self, path: Path) -> Path:
        resolved_path = path.resolve(strict=False)
        if not resolved_path.is_relative_to(self.root):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
        return resolved_path.relative_to(self.document_root)


def create_workspace_context(user: UserAccount | None) -> WorkspaceContext:
    document_root = Path(settings.DOCUMENT_ROOT).resolve()
    username: str | None = None
    workspace_root = document_root

    if settings.AUTH_REQUIRED and settings.USER_WORKSPACE_ISOLATION:
        username = user.full_name if user else None
        if username is None or not is_valid_username(username):
            raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_USER)
        workspace_root = document_root / username

    workspace_root.mkdir(parents=True, exist_ok=True)
    resolved_workspace_root = workspace_root.resolve()
    if not resolved_workspace_root.is_relative_to(document_root):
        raise HTTPException(**CONSTANT.SERV_INVALID_WORKSPACE_PATH)
    return WorkspaceContext(
        document_root=document_root,
        root=resolved_workspace_root,
        username=username,
    )
