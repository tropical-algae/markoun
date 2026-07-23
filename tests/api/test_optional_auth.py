from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


@pytest.mark.run(order=16)
def test_optional_auth_allows_workspace_but_protects_account(
    client: TestClient,
    monkeypatch,
):
    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    client.cookies.clear()

    status_response = client.get(f"{settings.API_PREFIX}/system/status")
    assert status_response.status_code == 200
    assert status_response.json()["data"]["auth_required"] is False

    access_response = client.get(f"{settings.API_PREFIX}/auth/check")
    assert access_response.status_code == 200

    suffix = uuid4().hex[:8]
    dir_name = f"anonymous-{suffix}"
    note_name = f"note-{suffix}"
    note_path = f"{dir_name}/{note_name}.md"
    content = f"anonymous-search-{suffix}"

    dir_response = client.post(
        f"{settings.API_PREFIX}/dir/create",
        json={"path": ".", "name": dir_name},
    )
    assert dir_response.status_code == 200

    try:
        create_response = client.post(
            f"{settings.API_PREFIX}/file/create",
            json={"path": dir_name, "name": note_name},
        )
        assert create_response.status_code == 200

        save_response = client.post(
            f"{settings.API_PREFIX}/file/save",
            json={"filepath": note_path, "content": content},
        )
        assert save_response.status_code == 200

        load_response = client.get(
            f"{settings.API_PREFIX}/file/load",
            params={"filepath": note_path},
        )
        assert load_response.status_code == 200
        assert load_response.json()["data"]["content"] == content

        search_response = client.get(
            f"{settings.API_PREFIX}/file/search",
            params={"keyword": content, "limit": 1},
        )
        assert search_response.status_code == 200
        assert search_response.json()["data"][0]["node"]["path"] == note_path

        settings_response = client.get(f"{settings.API_PREFIX}/system/settings")
        assert settings_response.status_code == 200
        image_setting = next(
            setting
            for setting in settings_response.json()["data"]
            if setting["id"] == "paste_image_note_dir"
        )
        original_image_setting = image_setting["value"]

        enable_image_setting_response = client.patch(
            f"{settings.API_PREFIX}/system/settings",
            json={"id": "paste_image_note_dir", "value": not original_image_setting},
        )
        assert enable_image_setting_response.status_code == 200
        updated_settings_response = client.get(f"{settings.API_PREFIX}/system/settings")
        updated_image_setting = next(
            setting
            for setting in updated_settings_response.json()["data"]
            if setting["id"] == "paste_image_note_dir"
        )
        assert updated_image_setting["value"] is not original_image_setting
        disable_image_setting_response = client.patch(
            f"{settings.API_PREFIX}/system/settings",
            json={"id": "paste_image_note_dir", "value": original_image_setting},
        )
        assert disable_image_setting_response.status_code == 200

        disabled_auth_responses = [
            client.post(
                f"{settings.API_PREFIX}/auth/login",
                data={"username": "user", "password": "password"},
            ),
            client.post(
                f"{settings.API_PREFIX}/auth/register",
                json={
                    "full_name": f"anonymous-{suffix}",
                    "password": "anonymous-password",
                    "email": f"anonymous-{suffix}@example.com",
                },
            ),
            client.get(f"{settings.API_PREFIX}/auth/me"),
            client.patch(
                f"{settings.API_PREFIX}/auth/password",
                json={"new_passwd": "anonymous-password"},
            ),
        ]

        for response in disabled_auth_responses:
            assert response.status_code == 403
            assert response.json()["message"] == "Authentication is disabled"
    finally:
        remove_response = client.post(
            f"{settings.API_PREFIX}/item/remove",
            params={"filepath": dir_name},
        )
        assert remove_response.status_code == 200
