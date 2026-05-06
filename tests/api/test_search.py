from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from markoun.common.config import settings


def authenticate_client(client: TestClient) -> None:
    suffix = uuid4().hex[:8]
    username = f"search-user-{suffix}"
    password = "123456"

    register_response = client.post(
        url=f"{settings.API_PREFIX}/auth/register",
        json={
            "full_name": username,
            "password": password,
            "email": f"{username}@test.com",
        },
    )
    assert register_response.status_code == 200

    login_response = client.post(
        url=f"{settings.API_PREFIX}/auth/login",
        data={
            "username": username,
            "password": password,
        },
    )
    assert login_response.status_code == 200


def test_search_markdown_files_returns_matching_nodes(client: TestClient):
    authenticate_client(client)
    suffix = uuid4().hex[:8]
    keyword = f"needle-{suffix}"
    root = Path(settings.DOCUMENT_ROOT).absolute() / f"search-{suffix}"
    nested = root / "nested"
    nested.mkdir(parents=True, exist_ok=True)

    (root / "alpha.md").write_text(
        f"first line\n{keyword} appears here\n{keyword} appears again\n",
        encoding="utf-8",
    )
    (nested / "beta.md").write_text(
        f"another {keyword} result\nsecond line\n",
        encoding="utf-8",
    )
    (root / "ignored.txt").write_text(f"{keyword} in text file\n", encoding="utf-8")

    response = client.get(
        url=f"{settings.API_PREFIX}/file/search",
        params={"keyword": keyword, "limit": 10},
    )

    assert response.status_code == 200
    results = response.json()["data"]
    result_paths = {item["node"]["path"] for item in results}

    assert f"search-{suffix}/alpha.md" in result_paths
    assert f"search-{suffix}/nested/beta.md" in result_paths
    assert f"search-{suffix}/ignored.txt" not in result_paths

    alpha_result = next(
        item for item in results if item["node"]["path"] == f"search-{suffix}/alpha.md"
    )
    assert alpha_result["matches"] == [
        {"snippet": f"{keyword} appears here", "line": 2},
        {"snippet": f"{keyword} appears again", "line": 3},
    ]


def test_search_markdown_files_respects_limit(client: TestClient):
    authenticate_client(client)
    suffix = uuid4().hex[:8]
    keyword = f"needle-{suffix}"
    root = Path(settings.DOCUMENT_ROOT).absolute() / f"search-limit-{suffix}"
    root.mkdir(parents=True, exist_ok=True)
    (root / "match-a.md").write_text(f"{keyword} one\n{keyword} two\n", encoding="utf-8")
    (root / "match-b.md").write_text(f"{keyword} three\n", encoding="utf-8")

    response = client.get(
        url=f"{settings.API_PREFIX}/file/search",
        params={"keyword": keyword, "limit": 1},
    )

    assert response.status_code == 200
    results = response.json()["data"]
    assert len(results) == 1


def test_search_markdown_files_rejects_blank_keyword(client: TestClient):
    authenticate_client(client)
    response = client.get(
        url=f"{settings.API_PREFIX}/file/search",
        params={"keyword": "   "},
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Search keyword cannot be empty"
