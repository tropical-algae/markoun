from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


def test_file_history_api_supports_branching_deletion_and_purge(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    note_path = "note.md"
    (tmp_path / note_path).touch()

    revision_a_response = client.post(
        f"{settings.API_PREFIX}/file/save",
        json={"filepath": note_path, "content": "A", "operation_id": "api-a"},
    )
    revision_a = revision_a_response.json()["data"]["revision_id"]
    revision_b_response = client.post(
        f"{settings.API_PREFIX}/file/save",
        json={
            "filepath": note_path,
            "content": "B",
            "base_revision_id": revision_a,
            "operation_id": "api-b",
        },
    )
    revision_c_response = client.post(
        f"{settings.API_PREFIX}/file/save",
        json={
            "filepath": note_path,
            "content": "C",
            "base_revision_id": revision_b_response.json()["data"]["revision_id"],
            "operation_id": "api-c",
        },
    )
    revision_b = revision_b_response.json()["data"]["revision_id"]
    revision_c = revision_c_response.json()["data"]["revision_id"]

    tree_response = client.get(
        f"{settings.API_PREFIX}/history/tree",
        params={"filepath": note_path},
    )
    tree = tree_response.json()["data"]

    assert revision_a_response.status_code == 200
    assert revision_b_response.status_code == 200
    assert revision_c_response.status_code == 200
    assert tree_response.status_code == 200
    assert tree["default_revision_id"] == revision_c
    assert {node["id"] for node in tree["nodes"]} == {
        revision_a,
        revision_b,
        revision_c,
    }
    assert tree["nodes"][0]["content_size"] == 1
    assert all(node["author"] is None for node in tree["nodes"])

    root_items_response = client.get(f"{settings.API_PREFIX}/item/tree")
    assert root_items_response.status_code == 200
    assert all(item["path"] != ".markoun" for item in root_items_response.json()["data"])

    protected_path_response = client.get(
        f"{settings.API_PREFIX}/file/load",
        params={"filepath": ".markoun/history/catalog.mkv"},
    )
    assert protected_path_response.status_code == 400

    delete_response = client.request(
        "DELETE",
        f"{settings.API_PREFIX}/history/revision",
        json={"filepath": note_path, "revision_id": revision_b},
    )
    deleted_tree = delete_response.json()["data"]

    assert delete_response.status_code == 200
    assert deleted_tree["root_node_id"] == revision_a
    assert deleted_tree["default_revision_id"] == revision_a
    assert [node["id"] for node in deleted_tree["nodes"]] == [revision_a]

    content_response = client.get(
        f"{settings.API_PREFIX}/history/revision",
        params={"filepath": note_path, "revision_id": revision_a},
    )
    assert content_response.status_code == 200
    assert content_response.json()["data"]["content"] == "A"
    assert (tmp_path / note_path).read_text(encoding="utf-8") == "A"

    purge_response = client.delete(
        f"{settings.API_PREFIX}/history",
        params={"path": note_path},
    )
    assert purge_response.status_code == 200
    assert purge_response.json()["data"]["deleted_histories"] == 1

    missing_response = client.get(
        f"{settings.API_PREFIX}/history/tree",
        params={"filepath": note_path},
    )
    assert missing_response.status_code == 404
