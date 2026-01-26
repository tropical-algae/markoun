from typing import Union

from pydantic import BaseModel

from markoun.core.model.base import FsNodeType


class FileNode(BaseModel):
    name: str
    path: str
    type: FsNodeType
    suffix: str


class PathNode(FileNode):
    children: list[Union["FileNode", "PathNode"]]


class FileMeta(BaseModel):
    path: str
    suffix: str
    size: str
    mtime: str
    ctime: str
    atime: str


class FileDetail(BaseModel):
    content: str
    meta: FileMeta
