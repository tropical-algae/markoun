from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel

from markoun.common.config import settings
from markoun.main import app


class DataStore(BaseModel):
    admin_token_data: str | None = None
    admin_user_id: str | None = None


@pytest.fixture(autouse=True)
def default_runtime_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "AUTH_REQUIRED", True)
    monkeypatch.setattr(settings, "USER_WORKSPACE_ISOLATION", False)
    monkeypatch.setattr(settings, "MEDIA_DELIVERY_MODE", "application")


@pytest.fixture(scope="session", name="client")
def test_client() -> Generator:
    with TestClient(app=app) as tc:
        yield tc


@pytest.fixture(scope="session", name="data_store")
def test_data_store() -> DataStore:  # type: ignore
    return DataStore()
