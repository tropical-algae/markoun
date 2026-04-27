from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


@pytest.mark.run(order=5)
def test_item_children_api(client: TestClient):
    suffix = uuid4().hex[:8]
    dir_name = f"tree-{suffix}"
    file_name = f"note-{suffix}"

    dir_response = client.post(
        url=f"{settings.API_PREFIX}/dir/create",
        json={"path": "./", "name": dir_name},
    )
    assert dir_response.status_code == 200

    file_response = client.post(
        url=f"{settings.API_PREFIX}/file/create",
        json={"path": dir_name, "name": file_name},
    )
    assert file_response.status_code == 200

    root_response = client.get(
        url=f"{settings.API_PREFIX}/item/children",
        params={"path": "./"},
    )
    root_data = root_response.json()["data"]

    assert root_response.status_code == 200
    assert root_data["path"] == "."

    root_dir = next(item for item in root_data["children"] if item["path"] == dir_name)
    assert root_dir["type"] == "dir"
    assert root_dir["has_children"] is True
    assert "children" not in root_dir

    child_response = client.get(
        url=f"{settings.API_PREFIX}/item/children",
        params={"path": dir_name},
    )
    child_data = child_response.json()["data"]

    assert child_response.status_code == 200
    assert child_data["path"] == dir_name
    assert len(child_data["children"]) == 1
    assert child_data["children"][0]["path"] == f"{dir_name}/{file_name}.md"
    assert child_data["children"][0]["type"] == "file"
