import json
from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator

from markoun.common.util import generate_random_token
from markoun.core.db.models import UserAccount


class ScopeType(StrEnum):
    ADMIN = "ADMIN"
    USER = "USER"
    GUEST = "GUEST"


class LoginResponse(BaseModel):
    status: int
    message: str
    user_id: str
    scopes: list[str]
    timestamp: str


class CurrentUserProfile(BaseModel):
    full_name: str | None
    email: str
    scopes: list[str]
    is_active: bool | None
    joined_at: str | None


class PasswordUpdateRequest(BaseModel):
    new_passwd: str = Field(description="New user password")


class TokenPayload(BaseModel):
    userid: str
    username: str
    scopes: list[ScopeType]
    exp: datetime = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        data = self.model_dump()
        scopes: list[ScopeType] = data.get("scopes", [])
        data["scopes"] = [s.value for s in scopes]
        return data

    def match_scope(self, scope: list[str]):
        exp_str = [s.value for s in self.scopes]
        return any(s in scope for s in exp_str)


class UserBasicInfo(BaseModel):
    full_name: str = Field(description="User name")
    password: str = Field(description="User password")
    email: str = Field(default="admin@test.com", description="The email of user")
    scopes: list[ScopeType] = Field(
        default_factory=list,
        json_schema_extra={"readOnly": True},
        description="The scope for user, include ADMIN, USER, GUEST",
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        if not is_workspace_username(value):
            raise ValueError(
                "Username must be 3-32 ASCII letters, numbers, underscores, or hyphens"
            )
        return value

    def build_user(self) -> UserAccount:
        is_superuser = ScopeType.ADMIN in self.scopes
        return UserAccount(
            id=generate_random_token(prefix="USR", length=24),
            full_name=self.full_name,
            password=self.password,
            email=self.email,
            scopes=json.dumps([i.value for i in self.scopes]),
            is_superuser=is_superuser,
            is_active=True,
        )


def is_workspace_username(value: str) -> bool:
    if not 3 <= len(value) <= 32 or not value[0].isalnum():
        return False
    return value.isascii() and all(char.isalnum() or char in "_-" for char in value)
