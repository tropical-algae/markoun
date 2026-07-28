import os
import secrets
from pathlib import Path
from shutil import copyfile
from typing import Any, Literal, cast

from pydantic import Field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

from markoun import __project_name__, __version__

CONFIG_FILE_ENV = "MARKOUN_CONFIG_FILE"
DEPLOYMENT_MODE_ENV = "MARKOUN_DEPLOYMENT_MODE"

_deployment_mode = os.getenv(DEPLOYMENT_MODE_ENV, "server").strip().lower()
if _deployment_mode not in ("server", "nix"):
    raise ValueError(f"{DEPLOYMENT_MODE_ENV} must be 'server' or 'nix'")
DEPLOYMENT_MODE = cast(Literal["server", "nix"], _deployment_mode)


def _deployment_default[T](server: T, nix: T) -> T:
    return nix if DEPLOYMENT_MODE == "nix" else server


_home = Path.home()
_config_home = Path(os.getenv("XDG_CONFIG_HOME", _home / ".config")).expanduser()
_data_home = Path(os.getenv("XDG_DATA_HOME", _home / ".local/share")).expanduser()
_state_home = Path(os.getenv("XDG_STATE_HOME", _home / ".local/state")).expanduser()
_nix_config_root = _config_home / __project_name__
_nix_data_root = _data_home / __project_name__
_nix_state_root = _state_home / __project_name__
_nix_resource_root = Path(__file__).resolve().parents[1] / "_standalone"
_default_config_file = _deployment_default(
    "config.yaml", _nix_config_root / "config.yaml"
)


DEFAULT_ENV_FILE = ".env"
DEFAULT_WELCOME_FILE = "./welcome.md"
DEFAULT_CONFIG_FILE = Path(os.getenv(CONFIG_FILE_ENV, _default_config_file)).expanduser()


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
    PROJECT_NAME: str = __project_name__
    HOST: str = _deployment_default("0.0.0.0", "127.0.0.1")
    PORT: int = _deployment_default(8080, 8000)
    WORKERS: int = 2
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    WEB_ROOT: str | None = _deployment_default(None, str(_nix_resource_root / "web"))

    TRUSTED_ORIGINS: list[str] = ["http://localhost:8000"]


class BasicSetting(BaseSettings):
    AUTH_REQUIRED: bool = True
    USER_WORKSPACE_ISOLATION: bool = False

    # database
    SQL_DATABASE_URI: str = _deployment_default(
        "sqlite+aiosqlite:///database.db",
        f"sqlite+aiosqlite:///{_nix_data_root / 'database.db'}",
    )
    SQL_POOL_PRE_PING: bool = True
    SQL_POOL_SIZE: int = 10
    SQL_MAX_OVERFLOW: int = 20
    SQL_POOL_TIMEOUT: int = 30
    SQL_POOL_RECYCLE: int = 1800

    ACCESS_TOKEN_DEFAULT_EXPIRE_MINUTES: int = 60 * 24
    ACCESS_TOKEN_EXTENDED_EXPIRE_MINUTES: int = 60 * 24 * 30

    ACCESS_TOKEN_SECRET_KEY: str = secrets.token_hex(32)
    ACCESS_TOKEN_COOKIE_SECURE: bool = False

    DOCUMENT_ROOT: str = _deployment_default(
        "./data",
        str(_nix_data_root / "documents"),
    )
    MEDIA_DELIVERY_MODE: Literal["application", "nginx"] = _deployment_default(
        "nginx",
        "application",
    )
    WELCOME_NOTE_PATH: str = _deployment_default(
        DEFAULT_WELCOME_FILE,
        str(_nix_resource_root / "welcome.md"),
    )
    DISPLAYED_FILE_TYPES: list = ["md", "png", "jpg", "jpeg", "bmp", "svg"]


class LogSetting(BaseSettings):
    # logger
    LOG_ROOT: str = _deployment_default("./log", str(_nix_state_root / "log"))
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
            yaml_file=str(DEFAULT_CONFIG_FILE),
            yaml_file_encoding="utf-8",
        )
        return yaml_settings, env_settings, dotenv_settings, file_secret_settings


def init_system_file(settings: Setting):
    default_welcome_filepath = Path(DEFAULT_WELCOME_FILE)
    welcome_filepath = Path(settings.WELCOME_NOTE_PATH)

    if not DEFAULT_CONFIG_FILE.is_file():
        DEFAULT_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        DEFAULT_CONFIG_FILE.touch(exist_ok=True)

    if not default_welcome_filepath.is_file():
        raise FileNotFoundError(
            f"Default welcome file does not exist or is not a file: "
            f"{default_welcome_filepath}"
        )

    if not welcome_filepath.is_file():
        welcome_filepath.parent.mkdir(parents=True, exist_ok=True)
        copyfile(default_welcome_filepath, welcome_filepath)


settings = Setting()
