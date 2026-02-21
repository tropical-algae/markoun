from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel

from markoun.main import app


class DataStore(BaseModel):
    admin_token_data: str | None = None
    admin_user_id: str | None = None


@pytest.fixture(scope="session", name="client")
def test_client() -> Generator:
    with TestClient(app=app) as tc:
        yield tc


@pytest.fixture(scope="session", name="data_store")
def test_data_store() -> DataStore:  # type: ignore
    return DataStore()
