import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings
from markoun.core.model.base import SysStatusType
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
    assert response.json()["data"]["status"] == SysStatusType.HEALTH.value
    assert response.json()["data"]["auth_required"] is True


@pytest.mark.run(order=2)
@pytest.mark.parametrize(
    "user",
    [TEMP_USER],
)
def test_user_register(client: TestClient, user: dict):
    url = f"{settings.API_PREFIX}/auth/register"

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
    url = f"{settings.API_PREFIX}/auth/login"
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
    assert "secure" not in response.headers.get("set-cookie", "").lower()

    # store token data
    data_store.admin_user_id = data["user_id"]


@pytest.mark.run(order=4)
def test_user_token(client: TestClient):
    url = f"{settings.API_PREFIX}/auth/check"
    response = client.get(url=url)
    data = response.json()
    assert response.status_code == 200
    assert data["data"]


@pytest.mark.run(order=5)
def test_current_user_profile(client: TestClient):
    url = f"{settings.API_PREFIX}/auth/me"
    response = client.get(url=url)
    data = response.json().get("data")

    assert response.status_code == 200
    assert data["full_name"] == TEMP_USER["full_name"]
    assert data["email"] == TEMP_USER["email"]
    assert ScopeType.USER.value in data["scopes"]
    assert "password" not in data


@pytest.mark.run(order=6)
@pytest.mark.parametrize(
    ("username", "password"),
    [
        ("missing-user", "123456"),
        (TEMP_USER["full_name"], "wrong-password"),
    ],
)
def test_user_login_uses_generic_auth_error(
    client: TestClient, username: str, password: str
):
    url = f"{settings.API_PREFIX}/auth/login"
    response = client.post(
        url=url,
        data={
            "username": username,
            "password": password,
        },
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Incorrect username or password"


@pytest.mark.run(order=7)
def test_update_password_requires_request_body(client: TestClient):
    url = f"{settings.API_PREFIX}/auth/password"
    new_password = "new-123456"

    query_response = client.patch(url=url, params={"new_passwd": new_password})
    assert query_response.status_code == 422

    body_response = client.patch(url=url, json={"new_passwd": new_password})
    assert body_response.status_code == 200
    assert body_response.json()["data"]
