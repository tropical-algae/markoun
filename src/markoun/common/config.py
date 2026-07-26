import os
import secrets
from pathlib import Path
from shutil import copyfile
from typing import Any, Literal

from pydantic import Field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

from markoun import __version__

CONFIG_FILE_ENV = "MARKOUN_CONFIG_PATH_ENV"

DEFAULT_ENV_FILE = ".env"
DEFAULT_CONFIG_FILE = os.getenv(CONFIG_FILE_ENV, "./config.yaml")
DEFAULT_WELCOME_FILE = "./welcome.md"


class SensitiveSetting(BaseSettings):
    DEFAULT_ADMIN_NAME: str = "admin"
    DEFAULT_ADMIN_EMAIL: str = "admin@admin.com"
    DEFAULT_ADMIN_PASSWORD: str = Field(
        default_factory=lambda: secrets.token_urlsafe(16),
        min_length=1,
    )


class SysSetting(BaseSettings):
    # FastAPI
    VERSION: str = __version__
    PROJECT_NAME: str = "markoun"
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    WORKERS: int = 2
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    TRUSTED_ORIGINS: list[str] = ["http://localhost:8000"]


class BasicSetting(BaseSettings):
    AUTH_REQUIRED: bool = True
    USER_WORKSPACE_ISOLATION: bool = False

    # database
    SQL_DATABASE_URI: str = "sqlite+aiosqlite:///database.db"
    SQL_POOL_PRE_PING: bool = True
    SQL_POOL_SIZE: int = 10
    SQL_MAX_OVERFLOW: int = 20
    SQL_POOL_TIMEOUT: int = 30
    SQL_POOL_RECYCLE: int = 1800

    ACCESS_TOKEN_DEFAULT_EXPIRE_MINUTES: int = 60 * 24
    ACCESS_TOKEN_EXTENDED_EXPIRE_MINUTES: int = 60 * 24 * 30

    ACCESS_TOKEN_SECRET_KEY: str = secrets.token_hex(32)
    ACCESS_TOKEN_COOKIE_SECURE: bool = False

    DOCUMENT_ROOT: str = "./data"
    MEDIA_DELIVERY_MODE: Literal["application", "nginx"] = "nginx"
    WELCOME_NOTE_PATH: str = DEFAULT_WELCOME_FILE
    DISPLAYED_FILE_TYPES: list = ["md", "png", "jpg", "jpeg", "bmp", "svg"]


class LogSetting(BaseSettings):
    # logger
    LOG_ROOT: str = "./log"
    LOG_LEVEL: str = "INFO"
    LOG_FILE_ENCODING: str = "utf-8"
    LOG_CONSOLE_OUTPUT: bool = True


class RestrictedYamlConfigSettingsSource(YamlConfigSettingsSource):
    def __call__(self) -> dict[str, Any]:
        values = super().__call__()
        return {
            key: value
            for key, value in values.items()
            if key not in SensitiveSetting.model_fields
        }


class Setting(SysSetting, BasicSetting, SensitiveSetting, LogSetting):
    model_config = SettingsConfigDict(
        env_file=DEFAULT_ENV_FILE,
        case_sensitive=True,
        extra="ignore",
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        _ = init_settings
        yaml_settings = RestrictedYamlConfigSettingsSource(
            settings_cls=settings_cls,
            yaml_file=DEFAULT_CONFIG_FILE,
            yaml_file_encoding="utf-8",
        )
        return yaml_settings, env_settings, dotenv_settings, file_secret_settings


def init_system_file(settings: Setting):
    config_filepath = Path(DEFAULT_CONFIG_FILE)
    default_welcome_filepath = Path(DEFAULT_WELCOME_FILE)
    welcome_filepath = Path(settings.WELCOME_NOTE_PATH)

    if not config_filepath.is_file():
        config_filepath.parent.mkdir(parents=True, exist_ok=True)
        config_filepath.touch(exist_ok=True)

    if not default_welcome_filepath.is_file():
        raise FileNotFoundError(
            f"Default welcome file does not exist or is not a file: "
            f"{default_welcome_filepath}"
        )

    if not welcome_filepath.is_file():
        welcome_filepath.parent.mkdir(parents=True, exist_ok=True)
        copyfile(default_welcome_filepath, welcome_filepath)


settings = Setting()
