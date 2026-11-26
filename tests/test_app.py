import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings
from markoun.main import create_app


@pytest.mark.parametrize("docs_enabled", [False, True])
def test_api_documentation_can_be_enabled(
    monkeypatch: pytest.MonkeyPatch, docs_enabled: bool
) -> None:
    monkeypatch.setattr(settings, "API_DOCS_ENABLED", docs_enabled)
    monkeypatch.setattr(settings, "WEB_ROOT", None)
    client = TestClient(create_app())
    expected_status = 200 if docs_enabled else 404

    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == expected_status
