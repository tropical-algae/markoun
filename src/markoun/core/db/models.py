from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    BigInteger,
    Boolean,
    Column,
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
