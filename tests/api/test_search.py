from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


@pytest.mark.run(order=10)
def test_search_markdown_files_returns_matching_nodes(client: TestClient):
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


@pytest.mark.run(order=11)
def test_search_markdown_files_respects_limit(client: TestClient):
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


@pytest.mark.run(order=12)
def test_search_markdown_files_rejects_blank_keyword(client: TestClient):
    response = client.get(
        url=f"{settings.API_PREFIX}/file/search",
        params={"keyword": "   "},
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Search keyword cannot be empty"
