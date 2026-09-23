from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field, field_validator

if TYPE_CHECKING:
    from markoun.core.db.models import UserAccount


class McpPermission(StrEnum):
    READ = "read"
    SEARCH = "search"
    WRITE = "write"
    CREATE = "create"
    MOVE = "move"
    DELETE = "delete"


@dataclass(frozen=True)
class ApiKeyPrincipal:
    key_id: str
    user: UserAccount
    permissions: frozenset[McpPermission]

    def allows(self, permission: McpPermission) -> bool:
        return permission in self.permissions


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    permissions: list[McpPermission] = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("API key name cannot be empty")
        return normalized

    @field_validator("permissions")
    @classmethod
    def deduplicate_permissions(
        cls,
        value: list[McpPermission],
    ) -> list[McpPermission]:
        return list(dict.fromkeys(value))


class ApiKeyUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    permissions: list[McpPermission] | None = Field(default=None, min_length=1)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("API key name cannot be empty")
        return normalized

    @field_validator("permissions")
    @classmethod
    def deduplicate_permissions(
        cls,
        value: list[McpPermission] | None,
    ) -> list[McpPermission] | None:
        return None if value is None else list(dict.fromkeys(value))


class ApiKeyInfo(BaseModel):
    id: str
    name: str
    prefix: str
    permissions: list[McpPermission]
    is_active: bool
    created_at: str | None
    last_used_at: str | None


class ApiKeyCreated(ApiKeyInfo):
    key: str
