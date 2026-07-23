from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.app.services import file_service
from markoun.common.config import settings


@pytest.mark.run(order=6)
def test_upload_rejects_existing_file(client: TestClient):
    suffix = uuid4().hex[:8]
    dir_name = f"upload-{suffix}"
    filename = "duplicate.md"

    dir_response = client.post(
        url=f"{settings.API_PREFIX}/dir/create",
        json={"path": "./", "name": dir_name},
    )
    assert dir_response.status_code == 200

    first_response = client.post(
        url=f"{settings.API_PREFIX}/file/upload",
        params={"path": dir_name},
        files={"file": (filename, b"original content", "text/markdown")},
    )
    assert first_response.status_code == 200

    duplicate_response = client.post(
        url=f"{settings.API_PREFIX}/file/upload",
        params={"path": dir_name},
        files={"file": (filename, b"replacement content", "text/markdown")},
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["message"] == "File already exists"

    uploaded_path = Path(settings.DOCUMENT_ROOT).absolute() / dir_name / filename
    assert uploaded_path.read_bytes() == b"original content"


def test_pasted_image_uses_note_parent_when_grouping_is_disabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    async def grouping_disabled(*_args, **_kwargs) -> bool:
        return False

    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(
        file_service,
        "get_paste_image_note_dir_setting",
        grouping_disabled,
    )
    note_path = tmp_path / "notes" / "example.md"
    note_path.parent.mkdir()
    note_path.touch()

    response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "notes/example.md"},
        files={"file": ("image.png", b"image", "image/png")},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["filename"] == "image.png"
    assert data["path"] == "notes/image.png"
    assert data["markdown_path"] == "image.png"
    assert data["created_directory"] is None
    assert (tmp_path / data["path"]).read_bytes() == b"image"


def test_pasted_image_creates_and_reuses_encoded_note_directory(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    async def grouping_enabled(*_args, **_kwargs) -> bool:
        return True

    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(
        file_service,
        "get_paste_image_note_dir_setting",
        grouping_enabled,
    )
    note_path = tmp_path / "nested dir" / "My Note.md"
    note_path.parent.mkdir()
    note_path.touch()

    first_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "nested dir/My Note.md"},
        files={"file": ("screen shot (1).png", b"first", "image/png")},
    )
    second_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "nested dir/My Note.md"},
        files={"file": ("second.jpg", b"second", "image/jpeg")},
    )
    duplicate_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "nested dir/My Note.md"},
        files={"file": ("second.jpg", b"replacement", "image/jpeg")},
    )

    assert first_response.status_code == 200
    first_data = first_response.json()["data"]
    assert first_data["path"] == "nested dir/My Note/screen shot (1).png"
    assert first_data["markdown_path"] == "My%20Note/screen%20shot%20%281%29.png"
    assert first_data["created_directory"]["path"] == "nested dir/My Note"
    assert first_data["created_directory"]["has_children"] is True

    assert second_response.status_code == 200
    second_data = second_response.json()["data"]
    assert second_data["path"] == "nested dir/My Note/second.jpg"
    assert second_data["markdown_path"] == "My%20Note/second.jpg"
    assert second_data["created_directory"] is None
    assert duplicate_response.status_code == 409
    assert (tmp_path / second_data["path"]).read_bytes() == b"second"


def test_pasted_image_rejects_conflicts_and_invalid_sources(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    async def grouping_enabled(*_args, **_kwargs) -> bool:
        return True

    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(
        file_service,
        "get_paste_image_note_dir_setting",
        grouping_enabled,
    )
    note_path = tmp_path / "conflict.md"
    note_path.touch()
    (tmp_path / "conflict").write_text("not a directory", encoding="utf-8")

    conflict_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "conflict.md"},
        files={"file": ("image.png", b"image", "image/png")},
    )
    invalid_image_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "conflict.md"},
        files={"file": ("document.txt", b"text", "text/plain")},
    )
    missing_note_response = client.post(
        f"{settings.API_PREFIX}/file/paste-image",
        data={"note_path": "missing.md"},
        files={"file": ("image.png", b"image", "image/png")},
    )

    assert conflict_response.status_code == 409
    assert conflict_response.json()["message"] == (
        "A file already uses the image folder name"
    )
    assert invalid_image_response.status_code == 415
    assert missing_note_response.status_code == 400
