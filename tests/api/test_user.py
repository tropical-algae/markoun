import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings
from markoun.core.model.base import SystemStatusType
from markoun.core.model.user import ScopeType
from tests.conftest import DataStore

TEMP_USER: dict = {
    "full_name": "user",
    "password": "123456",
    "email": "user@test.com",
    "scopes": [ScopeType.ADMIN.value, ScopeType.USER.value],
}


@pytest.mark.run(order=1)
def test_system_status(client: TestClient):
    url = f"{settings.API_PREFIX}/system/status"

    response = client.get(url=url)

    assert response.status_code == 200
    assert response.json()["data"]["status"] == SystemStatusType.HEALTH.value


@pytest.mark.run(order=2)
@pytest.mark.parametrize(
    "user",
    [TEMP_USER],
)
def test_user_register(client: TestClient, user: dict):
    url = f"{settings.API_PREFIX}/user/register"

    response = client.post(url=url, json=user)
    tokens = response.json()

    assert response.status_code == 200
    assert response.json()["status"] == 200
    assert tokens["data"]["full_name"] == user["full_name"]


@pytest.mark.run(order=3)
@pytest.mark.parametrize(
    "user",
    [TEMP_USER],
)
def test_user_login_api(client: TestClient, data_store: DataStore, user: dict):
    url = f"{settings.API_PREFIX}/user/access-token"
    login_data = {
        "username": user["full_name"],
        "password": user["password"],
    }

    response = client.post(url=url, data=login_data)
    tokens = response.json()

    assert response.status_code == 200
    assert response.json()["status"] == 200
    assert "access_token" in tokens
    assert tokens["access_token"]

    # store token data
    data_store.admin_token_data = tokens["access_token"]
    data_store.admin_user_id = tokens["user_id"]


@pytest.mark.run(order=4)
def test_user_token(client: TestClient, data_store: DataStore):
    header = {"Authorization": f"Bearer {data_store.admin_token_data}"}
    url = f"{settings.API_PREFIX}/user/test-token"
    response = client.post(url=url, headers=header)
    assert response.status_code == 200
