from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from markoun.common.config import settings


@pytest.mark.run(order=6)
def test_upload_rejects_existing_file(client: TestClient):
    suffix = uuid4().hex[:8]
    dir_name = f"upload-{suffix}"
    filename = "duplicate.md"

    dir_response = client.post(
        url=f"{settings.API_PREFIX}/dir/create",
        json={"path": "./", "name": dir_name},
    )
    assert dir_response.status_code == 200

    first_response = client.post(
        url=f"{settings.API_PREFIX}/file/upload",
        params={"path": dir_name},
        files={"file": (filename, b"original content", "text/markdown")},
    )
    assert first_response.status_code == 200

    duplicate_response = client.post(
        url=f"{settings.API_PREFIX}/file/upload",
        params={"path": dir_name},
        files={"file": (filename, b"replacement content", "text/markdown")},
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["message"] == "File already exists"

    uploaded_path = Path(settings.DOCUMENT_ROOT).absolute() / dir_name / filename
    assert uploaded_path.read_bytes() == b"original content"
