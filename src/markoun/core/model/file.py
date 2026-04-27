from typing import Union

from pydantic import BaseModel, Field

from markoun.core.model.base import FsNodeType


class BasicNode(BaseModel):
    path: str
    name: str


class FileNode(BasicNode):
    type: FsNodeType
    suffix: str
    has_children: bool | None = None


class DirNode(FileNode):
    children: list[Union["FileNode", "DirNode"]] = Field(default_factory=list)
    has_children: bool = False


class DirectoryChildrenResponse(BaseModel):
    path: str
    children: list["FileNode"] = Field(default_factory=list)


class FileMeta(BaseModel):
    path: str
    suffix: str
    size: str
    modified: str
    changed: str
    accessed: str


class FileContentResponse(BaseModel):
    content: str
    meta: FileMeta


class FileSaveRequest(BaseModel):
    filepath: str
    content: str


class ItemRenameRequest(BaseModel):
    path: str
    new_name: str


class UploadedFileResponse(BaseModel):
    filename: str
    node: FileNode | None = None
