from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class SysStatusType(StrEnum):
    HEALTH = "health"
    UNHEALTH = "unhealth"


class SysStatus(BaseModel):
    status: str
    version: str


class FsNodeType(StrEnum):
    FILE = "file"
    DIR = "dir"


class SysSettingType(StrEnum):
    BOOL = "bool"
    STR = "str"


class SysSettingResponse(BaseModel):
    id: str
    name: str
    value: Any
    desc: str
    type: SysSettingType


class SysSettingUpdateRequest(BaseModel):
    id: str
    value: Any
