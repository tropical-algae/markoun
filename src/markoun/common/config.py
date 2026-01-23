import secrets

from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

from markoun import __version__

CONFIG_FILE = "config.yaml"
ENV_FILE = ".env"


class SysSetting(BaseSettings):
    # FastAPI
    VERSION: str = __version__
    PROJECT_NAME: str = "markoun"
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    WORKERS: int = 2
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False


class BasicSetting(BaseSettings):
    # database
    SQL_DATABASE_URI: str = ""
    SQL_POOL_PRE_PING: bool = True
    SQL_POOL_SIZE: int = 10
    SQL_MAX_OVERFLOW: int = 20
    SQL_POOL_TIMEOUT: int = 30
    SQL_POOL_RECYCLE: int = 1800

    ACCESS_TOKEN_DEFAULT_EXPIRE_MINUTES: int = 60 * 24
    ACCESS_TOKEN_EXTENDED_EXPIRE_MINUTES: int = 60 * 24 * 30

    ACCESS_TOKEN_SECRET_KEY: str = secrets.token_hex(32)

    DOCUMENT_ROOT: str = "./data"
    DOCUMENT_STATIC_ASSET_PATH: str = "/static"
    DISPLAYED_FILE_TYPES: list = ["md", "png", "jpg", "jpeg", "bmp", "svg"]


class LogSetting(BaseSettings):
    # logger
    LOG_ROOT: str = "./log"
    LOG_LEVEL: str = "INFO"
    LOG_FILE_ENCODING: str = "utf-8"
    LOG_CONSOLE_OUTPUT: bool = True


class Setting(SysSetting, BasicSetting, LogSetting):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
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
        yaml_settings = YamlConfigSettingsSource(
            settings_cls=settings_cls, yaml_file=CONFIG_FILE, yaml_file_encoding="utf-8"
        )
        return yaml_settings, env_settings, dotenv_settings, file_secret_settings


settings = Setting()
