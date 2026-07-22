from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from markoun.app.services.workspace_service import create_workspace_context
from markoun.common.config import settings
from markoun.core.db.models import UserAccount


def _register_and_login(client: TestClient, username: str) -> None:
    password = "workspace-password"
    register_response = client.post(
        f"{settings.API_PREFIX}/auth/register",
        json={
            "full_name": username,
            "password": password,
            "email": f"{username}@example.com",
        },
    )
    assert register_response.status_code == 200

    login_response = client.post(
        f"{settings.API_PREFIX}/auth/login",
        data={"username": username, "password": password},
    )
    assert login_response.status_code == 200


@pytest.mark.parametrize(
    ("auth_required", "isolation_enabled", "expected_suffix"),
    [
        (True, True, "workspace-user"),
        (True, False, ""),
        (False, True, ""),
        (False, False, ""),
    ],
)
def test_workspace_root_configuration_matrix(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    auth_required: bool,
    isolation_enabled: bool,
    expected_suffix: str,
):
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", auth_required)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", isolation_enabled)
    user = UserAccount(full_name="workspace-user")

    workspace = create_workspace_context(user)

    expected_root = tmp_path / expected_suffix if expected_suffix else tmp_path
    assert workspace.root == expected_root.resolve()


def test_authenticated_users_have_isolated_workspaces(
    client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    suffix = uuid4().hex[:8]
    first_user = f"first-{suffix}"
    second_user = f"second-{suffix}"
    note_path = "notes/shared-name.md"
    image_path = "images/shared-name.png"

    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", True)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", True)
    monkeypatch.setattr(settings, "MEDIA_DELIVERY_MODE", "application")

    for username, content in (
        (first_user, "first-user-content"),
        (second_user, "second-user-content"),
    ):
        _register_and_login(client, username)
        for directory in ("notes", "images", "archive"):
            response = client.post(
                f"{settings.API_PREFIX}/dir/create",
                json={"path": ".", "name": directory},
            )
            assert response.status_code == 200

        create_response = client.post(
            f"{settings.API_PREFIX}/file/create",
            json={"path": "notes", "name": "shared-name"},
        )
        assert create_response.status_code == 200
        assert create_response.json()["data"]["path"] == note_path

        save_response = client.post(
            f"{settings.API_PREFIX}/file/save",
            json={"filepath": note_path, "content": content},
        )
        assert save_response.status_code == 200

        rename_response = client.post(
            f"{settings.API_PREFIX}/item/rename",
            json={"path": note_path, "new_name": "renamed"},
        )
        assert rename_response.status_code == 200
        rename_back_response = client.post(
            f"{settings.API_PREFIX}/item/rename",
            json={"path": "notes/renamed.md", "new_name": "shared-name"},
        )
        assert rename_back_response.status_code == 200

        move_response = client.post(
            f"{settings.API_PREFIX}/item/move",
            json={"path": note_path, "target_dir": "archive"},
        )
        assert move_response.status_code == 200
        assert move_response.json()["data"]["path"] == "archive/shared-name.md"
        move_back_response = client.post(
            f"{settings.API_PREFIX}/item/move",
            json={"path": "archive/shared-name.md", "target_dir": "notes"},
        )
        assert move_back_response.status_code == 200

        disposable_response = client.post(
            f"{settings.API_PREFIX}/file/create",
            json={"path": ".", "name": "disposable"},
        )
        assert disposable_response.status_code == 200
        remove_response = client.post(
            f"{settings.API_PREFIX}/item/remove",
            params={"filepath": "disposable.md"},
        )
        assert remove_response.status_code == 200

        upload_response = client.post(
            f"{settings.API_PREFIX}/file/upload",
            params={"path": "images"},
            files={"file": ("shared-name.png", content.encode(), "image/png")},
        )
        assert upload_response.status_code == 200

    for username, content, other_user in (
        (first_user, "first-user-content", second_user),
        (second_user, "second-user-content", first_user),
    ):
        login_response = client.post(
            f"{settings.API_PREFIX}/auth/login",
            data={"username": username, "password": "workspace-password"},
        )
        assert login_response.status_code == 200

        load_response = client.get(
            f"{settings.API_PREFIX}/file/load",
            params={"filepath": note_path},
        )
        assert load_response.status_code == 200
        assert load_response.json()["data"]["content"] == content

        tree_response = client.get(
            f"{settings.API_PREFIX}/item/children",
            params={"path": "."},
        )
        assert tree_response.status_code == 200
        root_paths = {node["path"] for node in tree_response.json()["data"]["children"]}
        assert {"notes", "images", "archive"}.issubset(root_paths)
        assert other_user not in root_paths

        recursive_tree_response = client.get(f"{settings.API_PREFIX}/item/tree")
        assert recursive_tree_response.status_code == 200
        assert {node["path"] for node in recursive_tree_response.json()["data"]} == (
            root_paths
        )

        search_response = client.get(
            f"{settings.API_PREFIX}/file/search",
            params={"keyword": content},
        )
        assert search_response.status_code == 200
        assert search_response.json()["data"][0]["node"]["path"] == note_path

        media_response = client.get(
            f"{settings.API_PREFIX}/file/media",
            params={"path": image_path},
        )
        assert media_response.status_code == 200
        assert media_response.content == content.encode()

        traversal_response = client.get(
            f"{settings.API_PREFIX}/file/load",
            params={"filepath": f"../{other_user}/{note_path}"},
        )
        assert traversal_response.status_code == 400

        media_traversal_response = client.get(
            f"{settings.API_PREFIX}/file/media",
            params={"path": f"../{other_user}/{image_path}"},
        )
        assert media_traversal_response.status_code == 400

        invalid_name_response = client.post(
            f"{settings.API_PREFIX}/file/create",
            json={"path": ".", "name": "../invalid"},
        )
        assert invalid_name_response.status_code == 400

        remove_root_response = client.post(
            f"{settings.API_PREFIX}/item/remove",
            params={"filepath": "."},
        )
        assert remove_root_response.status_code == 400

        assert (tmp_path / username / note_path).read_text() == content


def test_workspace_rejects_absolute_and_symlink_escape(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    document_root = tmp_path / "documents"
    outside_root = tmp_path / "outside"
    outside_root.mkdir()
    (outside_root / "secret.md").write_text("secret", encoding="utf-8")

    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(document_root))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", True)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", True)
    workspace = create_workspace_context(UserAccount(full_name="safe-user"))
    (workspace.root / "escape").symlink_to(outside_root, target_is_directory=True)

    with pytest.raises(HTTPException):
        workspace.resolve("/etc/passwd")
    with pytest.raises(HTTPException):
        workspace.resolve("../outside/secret.md")
    with pytest.raises(HTTPException):
        workspace.resolve("escape/secret.md")
    with pytest.raises(HTTPException):
        workspace.resolve_child(workspace.root, "../secret.md")

    (document_root / "linked-user").symlink_to(outside_root, target_is_directory=True)
    with pytest.raises(HTTPException):
        create_workspace_context(UserAccount(full_name="linked-user"))


def test_nginx_media_delivery_returns_internal_redirect(
    client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", True)
    monkeypatch.setattr(settings, "MEDIA_DELIVERY_MODE", "nginx")
    image_path = tmp_path / "images" / "photo name.png"
    image_path.parent.mkdir()
    image_path.write_bytes(b"image")
    client.cookies.clear()

    response = client.get(
        f"{settings.API_PREFIX}/file/media",
        params={"path": "images/photo name.png"},
    )

    assert response.status_code == 200
    assert response.headers["x-accel-redirect"] == (
        "/_protected_media/images/photo%20name.png"
    )


def test_registration_rejects_unsafe_workspace_username(client: TestClient):
    response = client.post(
        f"{settings.API_PREFIX}/auth/register",
        json={
            "full_name": "../unsafe",
            "password": "workspace-password",
            "email": "unsafe@example.com",
        },
    )

    assert response.status_code == 422
