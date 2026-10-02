from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


@pytest.fixture
def search_workspace(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(settings, "DOCUMENT_ROOT", str(tmp_path))
    monkeypatch.setattr(settings, "AUTH_REQUIRED", False)
    return tmp_path


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


@pytest.mark.parametrize("keyword", ["needle", "-needle", "a[b]", "\u7b14\u8bb0"])
def test_search_matches_filenames_and_content(
    client: TestClient, search_workspace: Path, keyword: str
):
    files = {
        f"{keyword}-name.md": "unrelated text",
        f"nested/{keyword}-both.md": f"first\n{keyword}\n{keyword} again",
        "content.md": f"{keyword} in content",
        f"line\nbreak-{keyword}.md": "",
        f"{keyword}-folder/unrelated.md": "unrelated text",
        f"{keyword}.txt": keyword,
        f".markoun/{keyword}.md": keyword,
        f"nested/.markoun/{keyword}.md": keyword,
    }
    for path, content in files.items():
        filepath = search_workspace / path
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(content, encoding="utf-8")

    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": f" {keyword} "}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    results = {item["node"]["path"]: item for item in data}
    assert len(data) == len(results) == 4
    assert results[f"{keyword}-name.md"]["matches"] == []
    assert results[f"line\nbreak-{keyword}.md"]["matches"] == []
    assert results[f"nested/{keyword}-both.md"]["matches"] == [
        {"line": 2, "snippet": keyword},
        {"line": 3, "snippet": f"{keyword} again"},
    ]
    assert results["content.md"]["matches"] == [
        {"line": 1, "snippet": f"{keyword} in content"}
    ]
    assert all(item["matches"] for item in data[:2])


@pytest.mark.parametrize("limit", [None, -1, 1, 2, 201, 500])
def test_search_limit_counts_files_without_an_upper_bound(
    client: TestClient, search_workspace: Path, limit: int | None
):
    for index in range(205):
        (search_workspace / f"needle-{index}.md").write_text(
            "needle\nneedle again" if index % 2 else "unrelated", encoding="utf-8"
        )
    params: dict[str, str | int] = {"keyword": "needle"}
    if limit is not None:
        params["limit"] = limit

    response = client.get(f"{settings.API_PREFIX}/file/search", params=params)

    assert response.status_code == 200
    results = response.json()["data"]
    assert len(results) == (205 if limit is None or limit == -1 else min(limit, 205))
    assert len({item["node"]["path"] for item in results}) == len(results)
    assert all(len(item["matches"]) in (0, 2) for item in results)


def test_search_filename_only_limit(client: TestClient, search_workspace: Path):
    for index in range(3):
        (search_workspace / f"needle-{index}.md").touch()

    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": "needle", "limit": 2}
    )

    assert response.status_code == 200
    results = response.json()["data"]
    assert len(results) == 2
    assert all(item["matches"] == [] for item in results)


@pytest.mark.parametrize("limit", [0, -2])
def test_search_rejects_invalid_limits(
    client: TestClient, search_workspace: Path, limit: int
):
    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": "needle", "limit": limit}
    )

    assert response.status_code in (400, 422)
    assert not list(search_workspace.iterdir())


@pytest.mark.parametrize("keyword", ["", " \t\n "])
def test_search_rejects_empty_keywords(
    client: TestClient, search_workspace: Path, keyword: str
):
    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": keyword}
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Search keyword cannot be empty"
    assert not list(search_workspace.iterdir())


def test_search_preserves_long_matching_lines(client: TestClient, search_workspace: Path):
    long_line = "needle " + "x" * (128 * 1024)
    (search_workspace / "note.md").write_text(
        f"{long_line}\nneedle again", encoding="utf-8"
    )

    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": "needle", "limit": 1}
    )

    assert response.status_code == 200
    assert response.json()["data"][0]["matches"] == [
        {"line": 1, "snippet": long_line},
        {"line": 2, "snippet": "needle again"},
    ]


def test_search_is_case_sensitive(client: TestClient, search_workspace: Path):
    (search_workspace / "Needle.md").write_text("NEEDLE", encoding="utf-8")

    response = client.get(
        f"{settings.API_PREFIX}/file/search", params={"keyword": "needle"}
    )

    assert response.status_code == 200
    assert response.json()["data"] == []
