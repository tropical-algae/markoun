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
    data = response.json()

    assert response.status_code == 200
    assert data["status"] == 200
    assert data["data"]["full_name"] == user["full_name"]


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
    access_token = response.cookies.get("access_token")
    data = response.json()

    assert response.status_code == 200
    assert data["status"] == 200
    assert access_token

    # store token data
    data_store.admin_user_id = data["user_id"]


@pytest.mark.run(order=4)
def test_user_token(client: TestClient):
    url = f"{settings.API_PREFIX}/user/test-token"
    response = client.post(url=url)
    data = response.json()
    assert response.status_code == 200
    assert data["data"]
