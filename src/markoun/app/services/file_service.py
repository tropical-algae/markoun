import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.common.decorator import exception_handling
from markoun.common.logging import logger
from markoun.common.util import (
    abs_path_to_relative_path,
    file_suffix,
    formated_file_size,
)
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import (
    FileMeta,
    FileNode,
    FileSearchMatch,
    FileSearchResult,
    UploadedFileResponse,
)

TIME_FORMAT = "%Y-%m-%d %H:%M"
NOTE_SUFFIX = "md"
DISPLAYED_FILE_TYPES = set(settings.DISPLAYED_FILE_TYPES)
DEFAULT_SEARCH_LIMIT = 20
MAX_SEARCH_LIMIT = 200


def get_file_meta(abs_filepath: Path) -> FileMeta:
    if not abs_filepath.exists():
        # raise FileNotFoundError(f"Error: {abs_filepath} is not existed")
        logger.error(f"[Failed to read file {abs_filepath}]")
        raise HTTPException(**CONSTANT.SERV_FILE_NOT_EXISTED)

    def fmt(ts: float) -> str:
        return datetime.fromtimestamp(ts).strftime(TIME_FORMAT)

    stat = abs_filepath.stat()
    return FileMeta(
        path=str(abs_path_to_relative_path(abs_filepath)),
        suffix=file_suffix(abs_filepath),
        size=formated_file_size(stat.st_size),
        modified=fmt(stat.st_mtime),
        changed=fmt(stat.st_ctime),
        accessed=fmt(stat.st_atime),
    )


async def search_markdown_files(
    keyword: str,
    abs_root: Path,
    limit: int = DEFAULT_SEARCH_LIMIT,
) -> list[FileSearchResult]:
    normalized_keyword = keyword.strip()
    if not normalized_keyword:
        raise HTTPException(**CONSTANT.SERV_FILE_SEARCH_EMPTY_KEYWORD)

    safe_limit = max(1, min(limit, MAX_SEARCH_LIMIT))
    process = await asyncio.create_subprocess_exec(
        "rg",
        "--json",
        "--fixed-strings",
        "--no-ignore",
        "--glob",
        f"*.{NOTE_SUFFIX}",
        normalized_keyword,
        str(abs_root),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    if process.stdout is None or process.stderr is None:
        raise HTTPException(**CONSTANT.SERV_FILE_SEARCH_FAIL)

    stderr_task = asyncio.create_task(process.stderr.read())
    results_by_path: dict[str, FileSearchResult] = {}
    reached_limit = False

    while line := await process.stdout.readline():
        data = json.loads(line.decode("utf-8"))
        if data.get("type") == "match":
            match_data = data["data"]
            filepath = Path(match_data["path"]["text"]).resolve()
            if not filepath.is_file() or file_suffix(filepath) != NOTE_SUFFIX:
                continue

            relative_path = str(abs_path_to_relative_path(filepath))
            result = results_by_path.get(relative_path)
            if result is None:
                if len(results_by_path) >= safe_limit:
                    reached_limit = True
                    process.terminate()
                    break

                result = FileSearchResult(
                    node=FileNode(
                        name=filepath.stem,
                        path=relative_path,
                        type=FsNodeType.FILE,
                        suffix=NOTE_SUFFIX,
                    ),
                )
                results_by_path[relative_path] = result

            result.matches.append(
                FileSearchMatch(
                    snippet=match_data["lines"]["text"].strip(),
                    line=match_data["line_number"],
                )
            )

    returncode = await process.wait()
    stderr = await stderr_task
    if returncode == 1:
        return []
    if returncode != 0 and not reached_limit:
        logger.error(f"[Failed to search markdown files] {stderr.decode().strip()}")
        raise HTTPException(**CONSTANT.RESP_SERVER_ERROR)

    return list(results_by_path.values())


@exception_handling(CONSTANT.SERV_FILE_CREATE_FAIL)
def create_note(abs_filepath: Path, file_name: str) -> FileNode:
    filepath = abs_filepath / f"{file_name}.{NOTE_SUFFIX}"

    if filepath.exists():
        logger.error(f"[{filepath} is existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED)

    filepath.touch()
    return FileNode(
        name=file_name,
        path=str(abs_path_to_relative_path(filepath)),
        type=FsNodeType.FILE,
        suffix=NOTE_SUFFIX,
    )


async def upload_file(abs_path: Path, file: UploadFile) -> UploadedFileResponse:
    filename = file.filename or f"file_{uuid.uuid4().hex[:8]}.unknown"
    filepath = abs_path / filename
    try:
        async with aiofiles.open(filepath, "xb") as f:
            while content := await file.read(1024 * 1024):
                await f.write(content)
    except FileExistsError as err:
        logger.error(f"[{filepath} is existed]")
        raise HTTPException(**CONSTANT.SERV_FILE_EXISTED) from err
    except Exception as err:
        logger.exception(err)
        raise HTTPException(**CONSTANT.SERV_FILE_UPLOAD_FAIL) from err
    finally:
        await file.close()

    suffix = file_suffix(filepath)
    node = None
    if suffix in DISPLAYED_FILE_TYPES:
        node = FileNode(
            name=filepath.stem,
            path=str(abs_path_to_relative_path(filepath)),
            type=FsNodeType.FILE,
            suffix=suffix,
        )

    return UploadedFileResponse(filename=filename, node=node)
