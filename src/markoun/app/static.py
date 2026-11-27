from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.responses import Response
from starlette.types import Scope


class SPAStaticFiles(StaticFiles):
    def __init__(
        self,
        *,
        directory: Path,
        excluded_prefixes: tuple[str, ...],
    ) -> None:
        super().__init__(directory=directory, html=True)
        self.excluded_prefixes = excluded_prefixes

    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            response = await super().get_response(path, scope)
        except HTTPException as exc:
            clean_path = path.lstrip("/")
            is_excluded = any(
                clean_path == prefix or clean_path.startswith(f"{prefix}/")
                for prefix in self.excluded_prefixes
            )
            if (
                exc.status_code != 404
                or scope["method"] not in {"GET", "HEAD"}
                or is_excluded
            ):
                raise

            response = await super().get_response("index.html", scope)

        if path.startswith("assets/") and response.status_code in {200, 206, 304}:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        else:
            response.headers["Cache-Control"] = "no-cache"
        return response


def mount_web_app(
    app: FastAPI,
    web_root: str | None,
    *,
    api_prefix: str,
) -> None:
    if web_root is None:
        return

    root = Path(web_root).expanduser().resolve()
    app.mount(
        "/",
        SPAStaticFiles(
            directory=root,
            excluded_prefixes=(api_prefix.strip("/"), "mcp", "assets"),
        ),
        name="web",
    )
