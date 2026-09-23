import re
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


def _register_and_login(client: TestClient, username: str) -> None:
    password = "mcp-password"
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


def _mcp_request(
    client: TestClient,
    api_key: str,
    method: str,
    params: dict | None = None,
    request_id: int = 1,
):
    return client.post(
        "/mcp/",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json, text/event-stream",
            "MCP-Protocol-Version": "2025-11-25",
        },
        json={
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
            **({"params": params} if params is not None else {}),
        },
    )


def _mcp_tool_result(response) -> dict:
    assert response.status_code == 200
    result = response.json()["result"]
    assert result.get("isError") is not True
    structured_content = result["structuredContent"]
    assert structured_content["error"] is None
    return structured_content["payload"]


def _mcp_tool_error(response) -> dict:
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["isError"] is True
    structured_content = result["structuredContent"]
    assert structured_content["payload"] is None
    return structured_content["error"]


def test_api_key_lifecycle_and_mcp_permissions(
    client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    suffix = uuid4().hex[:8]
    username = f"mcp-{suffix}"
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", True)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", True)
    _register_and_login(client, username)

    workspace = tmp_path / username
    workspace.mkdir(parents=True, exist_ok=True)
    (workspace / "note.md").write_text("searchable content", encoding="utf-8")
    (tmp_path / "outside.md").write_text("outside", encoding="utf-8")

    create_response = client.post(
        f"{settings.API_PREFIX}/api-keys",
        json={"name": "read-only", "permissions": ["read", "search"]},
    )
    assert create_response.status_code == 200
    created = create_response.json()["data"]
    api_key = created["key"]
    display_time_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"
    assert api_key.startswith(f"mk_{created['id']}_")
    assert re.fullmatch(display_time_pattern, created["created_at"])
    assert created["last_used_at"] is None

    list_response = client.get(f"{settings.API_PREFIX}/api-keys")
    assert list_response.status_code == 200
    listed_key = list_response.json()["data"][0]
    assert listed_key["prefix"] == f"mk_{created['id']}"
    assert re.fullmatch(display_time_pattern, listed_key["created_at"])
    assert listed_key["last_used_at"] is None
    assert "key" not in listed_key

    initialize_response = _mcp_request(
        client,
        api_key,
        "initialize",
        {
            "protocolVersion": "2025-11-25",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"},
        },
    )
    assert initialize_response.status_code == 200

    used_key = client.get(f"{settings.API_PREFIX}/api-keys").json()["data"][0]
    assert re.fullmatch(display_time_pattern, used_key["last_used_at"])

    read_response = _mcp_request(
        client,
        api_key,
        "tools/call",
        {
            "name": "read_file",
            "arguments": {"path": "note.md", "start_line": 1, "line_count": 100},
        },
        request_id=2,
    )
    assert read_response.status_code == 200
    assert "searchable content" in read_response.text

    invalid_arguments = _mcp_tool_error(
        _mcp_request(
            client,
            api_key,
            "tools/call",
            {
                "name": "read_file",
                "arguments": {"path": "note.md", "line_count": 0},
            },
            request_id=3,
        )
    )
    assert "line_count" in invalid_arguments["message"]

    outside_response = _mcp_request(
        client,
        api_key,
        "tools/call",
        {
            "name": "read_file",
            "arguments": {
                "path": "../outside.md",
                "start_line": 1,
                "line_count": 100,
            },
        },
        request_id=4,
    )
    assert outside_response.status_code == 200
    assert _mcp_tool_error(outside_response)["message"] == "Invalid workspace path"

    delete_response = _mcp_request(
        client,
        api_key,
        "tools/call",
        {"name": "delete_item", "arguments": {"path": "note.md"}},
        request_id=5,
    )
    assert delete_response.status_code == 200
    permission_error = _mcp_tool_error(delete_response)
    assert permission_error["message"] == "API key does not allow delete operations"
    assert "permission" in permission_error["hint"]
    assert (workspace / "note.md").is_file()

    full_key_response = client.post(
        f"{settings.API_PREFIX}/api-keys",
        json={
            "name": "workspace-agent",
            "permissions": ["read", "search", "write", "create", "move", "delete"],
        },
    )
    assert full_key_response.status_code == 200
    full_key = full_key_response.json()["data"]["key"]

    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "create_directory",
                "arguments": {"parent_path": ".", "name": "agent"},
            },
            request_id=5,
        )
    )
    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "create_directory",
                "arguments": {"parent_path": ".", "name": "archive"},
            },
            request_id=6,
        )
    )
    created_file = _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "create_file",
                "arguments": {
                    "parent_path": "agent",
                    "name": "draft",
                    "content": "version one",
                },
            },
            request_id=7,
        )
    )
    created_path = created_file["node"]["path"]
    assert created_path == "agent/draft.md"

    read_result = _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "read_file",
                "arguments": {"path": created_path, "line_count": 10},
            },
            request_id=8,
        )
    )
    assert read_result["content"] == "version one"

    missing_parent_error = _mcp_tool_error(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "create_file",
                "arguments": {
                    "parent_path": "missing",
                    "name": "draft",
                    "content": "must not be written",
                },
            },
            request_id=9,
        )
    )
    assert missing_parent_error["message"] == "Parent directory does not exist"
    assert "create_directory" in missing_parent_error["hint"]

    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "write_file",
                "arguments": {
                    "path": created_path,
                    "content": "agent-search-target",
                },
            },
            request_id=10,
        )
    )
    search_result = _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "search_files",
                "arguments": {"keyword": "agent-search-target", "limit": 1},
            },
            request_id=11,
        )
    )
    assert search_result["results"][0]["node"]["path"] == created_path

    missing_target_error = _mcp_tool_error(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "move_item",
                "arguments": {
                    "path": created_path,
                    "target_directory": "missing",
                },
            },
            request_id=12,
        )
    )
    assert missing_target_error["message"] == "Target directory does not exist"
    assert "create_directory" in missing_target_error["hint"]

    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "rename_item",
                "arguments": {"path": created_path, "new_name": "renamed"},
            },
            request_id=13,
        )
    )
    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "move_item",
                "arguments": {
                    "path": "agent/renamed.md",
                    "target_directory": "archive",
                },
            },
            request_id=14,
        )
    )
    _mcp_tool_result(
        _mcp_request(
            client,
            full_key,
            "tools/call",
            {
                "name": "delete_item",
                "arguments": {"path": "archive/renamed.md"},
            },
            request_id=15,
        )
    )
    assert not (workspace / "archive" / "renamed.md").exists()

    revoke_response = client.delete(f"{settings.API_PREFIX}/api-keys/{created['id']}")
    assert revoke_response.status_code == 200
    rejected_response = _mcp_request(
        client,
        api_key,
        "initialize",
        {
            "protocolVersion": "2025-11-25",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"},
        },
    )
    assert rejected_response.status_code == 401


def test_api_key_management_and_mcp_are_disabled_without_authentication(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)

    create_response = client.post(
        f"{settings.API_PREFIX}/api-keys",
        json={"name": "disabled", "permissions": ["read"]},
    )
    assert create_response.status_code == 403

    mcp_response = client.post(
        "/mcp/",
        headers={"Authorization": "Bearer mk_invalid_invalid"},
        json={"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
    )
    assert mcp_response.status_code == 401
