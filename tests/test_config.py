import json
import os
import subprocess
import sys
from pathlib import Path

from markoun.common.config import (
    CONFIG_FILE_ENV,
    WELCOME_TEMPLATE_FILE_ENV,
)

RUNTIME_ENV_SCRIPT = Path(__file__).parents[1] / "scripts/nix-runtime-defaults.sh"


def test_environment_defaults_remain_configurable(tmp_path: Path) -> None:
    config_file = tmp_path / "config.yaml"
    config_file.write_text("PORT: 9100\n")
    welcome_template = tmp_path / "welcome.md"
    script = """
import json
from markoun.common.config import DEFAULT_CONFIG_FILE, WELCOME_TEMPLATE_FILE, settings
print(json.dumps({
    "config_file": str(DEFAULT_CONFIG_FILE),
    "welcome_template": str(WELCOME_TEMPLATE_FILE),
    "host": settings.HOST,
    "port": settings.PORT,
    "database": settings.SQL_DATABASE_URI,
    "documents": settings.DOCUMENT_ROOT,
    "logs": settings.LOG_ROOT,
    "web": settings.WEB_ROOT,
    "media_mode": settings.MEDIA_DELIVERY_MODE,
}))
"""
    environ = {
        **os.environ,
        CONFIG_FILE_ENV: str(config_file),
        WELCOME_TEMPLATE_FILE_ENV: str(welcome_template),
        "HOST": "127.0.0.1",
        "PORT": "8000",
        "SQL_DATABASE_URI": "sqlite+aiosqlite:////tmp/markoun/database.db",
        "DOCUMENT_ROOT": "/tmp/markoun/data",
        "LOG_ROOT": "/tmp/markoun/log",
        "WEB_ROOT": "/nix/store/markoun/web",
        "MEDIA_DELIVERY_MODE": "application",
    }

    process = subprocess.run(
        [sys.executable, "-c", script],
        cwd=tmp_path,
        env=environ,
        check=True,
        capture_output=True,
        text=True,
    )
    values = json.loads(process.stdout)

    assert values == {
        "config_file": str(config_file),
        "welcome_template": str(welcome_template),
        "host": "127.0.0.1",
        "port": 9100,
        "database": "sqlite+aiosqlite:////tmp/markoun/database.db",
        "documents": "/tmp/markoun/data",
        "logs": "/tmp/markoun/log",
        "web": "/nix/store/markoun/web",
        "media_mode": "application",
    }


def test_nix_runtime_environment_uses_xdg_paths(tmp_path: Path) -> None:
    environ = {
        **os.environ,
        "XDG_CONFIG_HOME": str(tmp_path / "config"),
        "XDG_DATA_HOME": str(tmp_path / "data"),
        "XDG_STATE_HOME": str(tmp_path / "state"),
    }
    for key in (
        CONFIG_FILE_ENV,
        "DOCUMENT_ROOT",
        "SQL_DATABASE_URI",
        "LOG_ROOT",
    ):
        environ.pop(key, None)

    process = subprocess.run(
        [
            "bash",
            "-c",
            '. "$1"; printf "%s\\n" "$MARKOUN_CONFIG_FILE" "$DOCUMENT_ROOT" '
            '"$SQL_DATABASE_URI" "$LOG_ROOT"',
            "bash",
            str(RUNTIME_ENV_SCRIPT),
        ],
        env=environ,
        check=True,
        capture_output=True,
        text=True,
    )

    assert process.stdout.splitlines() == [
        str(tmp_path / "config/markoun/config.yaml"),
        str(tmp_path / "data/markoun/data"),
        f"sqlite+aiosqlite:///{tmp_path}/data/markoun/database.db",
        str(tmp_path / "state/markoun/log"),
    ]


def test_nix_runtime_environment_preserves_overrides(tmp_path: Path) -> None:
    document_root = tmp_path / "documents"
    process = subprocess.run(
        [
            "bash",
            "-c",
            '. "$1"; printf "%s" "$DOCUMENT_ROOT"',
            "bash",
            str(RUNTIME_ENV_SCRIPT),
        ],
        env={**os.environ, "DOCUMENT_ROOT": str(document_root)},
        check=True,
        capture_output=True,
        text=True,
    )

    assert process.stdout == str(document_root)
