from pathlib import Path

from fastapi.testclient import TestClient

from markoun.common.config import settings


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


def test_welcome_note_falls_back_when_file_missing(
    client: TestClient,
    monkeypatch,
    tmp_path: Path,
):
    monkeypatch.setattr(settings, "WELCOME_NOTE_PATH", str(tmp_path / "missing.md"))

    response = client.get(f"{settings.API_PREFIX}/system/welcome-note")

    assert response.status_code == 404
    assert response.json()["message"] == "Welcome note file does not exist"
