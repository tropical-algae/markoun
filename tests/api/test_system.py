from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from markoun.app.services.system_service import (
    DEFAULT_SETTING,
    PASTE_IMAGE_NOTE_DIR_SETTING_ID,
)
from markoun.common.config import settings


def test_pasted_image_grouping_is_disabled_by_default():
    image_setting = next(
        item for item in DEFAULT_SETTING if item["key"] == PASTE_IMAGE_NOTE_DIR_SETTING_ID
    )

    assert image_setting["value"] is False


@pytest.mark.run(order=14)
def test_welcome_note_uses_configured_path(
    client: TestClient,
    monkeypatch,
    tmp_path: Path,
):
    welcome_file = tmp_path / "welcome.md"
    welcome_file.write_text(
        "# Custom Welcome\n\nHello from mounted file.", encoding="utf-8"
    )
    monkeypatch.setattr(settings, "WELCOME_NOTE_PATH", str(welcome_file))

    response = client.get(f"{settings.API_PREFIX}/system/welcome-note")

    assert response.status_code == 200
    assert response.json()["data"] == "# Custom Welcome\n\nHello from mounted file."


@pytest.mark.run(order=15)
def test_welcome_note_falls_back_when_file_missing(
    client: TestClient,
    monkeypatch,
    tmp_path: Path,
):
    monkeypatch.setattr(settings, "WELCOME_NOTE_PATH", str(tmp_path / "missing.md"))

    response = client.get(f"{settings.API_PREFIX}/system/welcome-note")

    assert response.status_code == 404
    assert response.json()["message"] == "Welcome note file does not exist"
