from typing import Union

from pydantic import BaseModel


class FileNode(BaseModel):
    name: str
    path: str
    type: str


class PathNode(FileNode):
    children: list[Union["FileNode", "PathNode"]]
