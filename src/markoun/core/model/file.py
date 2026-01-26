from typing import Union

from pydantic import BaseModel


class FileNode(BaseModel):
    name: str
    path: str
    type: str
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
