from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from markoun.app.static import mount_web_app


def test_serves_spa_routes_and_caches_versioned_assets(tmp_path: Path) -> None:
    (tmp_path / "index.html").write_text("<html>Markoun</html>")
    assets = tmp_path / "assets"
    assets.mkdir()
    (assets / "app-17E65cF2.js").write_text("console.log('markoun')")
    app = FastAPI()
    mount_web_app(app, str(tmp_path), api_prefix="/api/v1")
    client = TestClient(app)

    for route in ("/", "/login", "/file/notes/example.md"):
        page = client.get(route)
        assert page.status_code == 200
        assert page.text == "<html>Markoun</html>"
        assert page.headers["cache-control"] == "no-cache"
        unchanged = client.get(route, headers={"If-None-Match": page.headers["etag"]})
        assert unchanged.status_code == 304
        assert unchanged.headers["cache-control"] == "no-cache"

    asset = client.get("/assets/app-17E65cF2.js")
    assert asset.status_code == 200
    assert asset.headers["cache-control"] == "public, max-age=31536000, immutable"

    for route in ("/api/v1/missing", "/mcp/missing", "/assets/missing.js"):
        assert client.get(route).status_code == 404
