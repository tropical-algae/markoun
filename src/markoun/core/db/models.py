from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    BigInteger,
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlmodel import Field, SQLModel


class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    __table_args__ = (
        Index("ix_user_email", "email", unique=True),
        Index("ix_user_full_name", "full_name"),
        Index("ix_user_id", "id"),
    )

    id: str = Field(sa_column=Column("id", String(32), primary_key=True))
    email: str = Field(sa_column=Column("email", String(64)))
    password: str = Field(sa_column=Column("password", String(128)))
    scopes: str = Field(sa_column=Column("scopes", String(128)))
    full_name: str = Field(default=None, sa_column=Column("full_name", String(32)))
    is_active: bool = Field(default=None, sa_column=Column("is_active", Boolean))
    is_superuser: bool = Field(default=None, sa_column=Column("is_superuser", Boolean))
    create_date: datetime | None = Field(
        default=None,
        sa_column=Column(
            "create_date", TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
        ),
    )
    profile: str | None = Field(default=None, sa_column=Column("profile", String(128)))


class SystemSetting(SQLModel, table=True):
    __tablename__ = "system_setting"

    id: str = Field(sa_column=Column("id", String(32), primary_key=True))
    name: str = Field(default=None, sa_column=Column("name", String(32)))
    value: Any = Field(sa_column=Column("value", JSON, nullable=False))
    type: str = Field(sa_column=Column("type", String(32)))
    description: str = Field(sa_column=Column("description", String(128)))
    scope: str = Field(sa_column=Column("scope", String(128)))
    is_active: bool = Field(default=True, sa_column=Column("is_active", Boolean))
    create_date: datetime | None = Field(
        default=None,
        sa_column=Column(
            "create_date", TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
        ),
    )
    update_date: datetime | None = Field(
        default=None,
        sa_column=Column(
            "update_date",
            TIMESTAMP,
            server_default=text("CURRENT_TIMESTAMP"),
            onupdate=text("CURRENT_TIMESTAMP"),
        ),
    )


class McpApiKey(SQLModel, table=True):
    __tablename__ = "mcp_api_key"

    __table_args__ = (Index("ix_mcp_api_key_user_id", "user_id"),)

    id: str = Field(sa_column=Column("id", String(32), primary_key=True))
    user_id: str = Field(
        sa_column=Column(
            "user_id",
            String(32),
            ForeignKey("user_account.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    name: str = Field(sa_column=Column("name", String(64), nullable=False))
    secret_hash: str = Field(sa_column=Column("secret_hash", String(64), nullable=False))
    permissions: list[str] = Field(
        default_factory=list,
        sa_column=Column("permissions", JSON, nullable=False),
    )
    is_active: bool = Field(
        default=True,
        sa_column=Column("is_active", Boolean, nullable=False),
    )
    create_date: datetime | None = Field(
        default=None,
        sa_column=Column(
            "create_date", TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
        ),
    )
    last_used_at: datetime | None = Field(
        default=None,
        sa_column=Column("last_used_at", TIMESTAMP, nullable=True),
    )
