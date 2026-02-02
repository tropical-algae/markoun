from typing import Union

from pydantic import BaseModel

from markoun.core.model.base import FsNodeType


class NodeAttr(BaseModel):
    path: str
    name: str


class FileNode(NodeAttr):
    type: FsNodeType
    suffix: str


class PathNode(FileNode):
    children: list[Union["FileNode", "PathNode"]]


class FileMeta(BaseModel):
    path: str
    suffix: str
    size: str
    modified: str
    changed: str
    accessed: str


class FileDetail(BaseModel):
    content: str
    meta: FileMeta
