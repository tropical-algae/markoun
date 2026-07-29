import json
import os
import secrets
import zlib
from pathlib import Path
from typing import Any

from markoun.core.file_history.errors import HistoryCorruptedError

FORMAT_VERSION = 1
JSON_MAGIC = b"MKHJ"
BLOB_MAGIC = b"MKHB"


def encode_json(value: dict[str, Any]) -> bytes:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return JSON_MAGIC + bytes((FORMAT_VERSION,)) + zlib.compress(payload)


def decode_json(data: bytes) -> dict[str, Any]:
    if len(data) < 5 or data[:4] != JSON_MAGIC or data[4] != FORMAT_VERSION:
        raise HistoryCorruptedError("Unsupported history index format")
    try:
        value = json.loads(zlib.decompress(data[5:]).decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, zlib.error) as err:
        raise HistoryCorruptedError("Invalid history index payload") from err
    if not isinstance(value, dict):
        raise HistoryCorruptedError("History index must contain an object")
    return value


def encode_blob(content: bytes) -> bytes:
    return BLOB_MAGIC + bytes((FORMAT_VERSION,)) + zlib.compress(content)


def decode_blob(data: bytes) -> bytes:
    if len(data) < 5 or data[:4] != BLOB_MAGIC or data[4] != FORMAT_VERSION:
        raise HistoryCorruptedError("Unsupported history blob format")
    try:
        return zlib.decompress(data[5:])
    except zlib.error as err:
        raise HistoryCorruptedError("Invalid history blob payload") from err


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{secrets.token_hex(8)}.tmp")
    try:
        with temporary.open("xb") as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
