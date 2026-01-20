import json
from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field

from markoun.common.util import generate_random_token
from markoun.core.db.models import UserAccount


class ScopeType(StrEnum):
    ADMIN = "ADMIN"
    USER = "USER"
    GUEST = "GUEST"


class Token(BaseModel):
    user_id: str
    access_token: str
    token_type: str
    message: str
    timestamp: datetime
    scopes: list[str]
    status: int


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
        default_factory=list, description="The scope for user, include ADMIN, USER, GUEST"
    )

    def build_user(self) -> UserAccount:
        return UserAccount(
            id=generate_random_token(prefix="USR", length=24),
            full_name=self.full_name,
            password=self.password,
            email=self.email,
            scopes=json.dumps([i.value for i in self.scopes]),
            is_superuser=False,
            is_active=True,
        )
