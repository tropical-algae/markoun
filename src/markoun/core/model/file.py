from typing import Union

from pydantic import BaseModel

from markoun.core.model.base import FsNodeType


class BasicNode(BaseModel):
    path: str
    name: str


class FileNode(BasicNode):
    type: FsNodeType
    suffix: str


class DirNode(FileNode):
    children: list[Union["FileNode", "DirNode"]]


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
