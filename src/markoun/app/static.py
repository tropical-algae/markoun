from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.responses import FileResponse, Response
from starlette.types import Scope


class SPAStaticFiles(StaticFiles):
    def __init__(
        self,
        *,
        directory: Path,
        excluded_prefixes: tuple[str, ...],
    ) -> None:
        super().__init__(directory=directory, html=True)
        self.index_file = directory / "index.html"
        self.excluded_prefixes = excluded_prefixes

    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
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

        return FileResponse(self.index_file)


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
            excluded_prefixes=(api_prefix.strip("/"),),
        ),
        name="web",
    )
