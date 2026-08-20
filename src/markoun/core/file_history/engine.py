import fcntl
import hashlib
import secrets
import shutil
from collections.abc import Collection, Iterator
from contextlib import contextmanager, suppress
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Any

from markoun.core.file_history.codec import (
    atomic_write,
    decode_blob,
    decode_json,
    encode_blob,
    encode_json,
)
from markoun.core.file_history.errors import (
    HistoryCorruptedError,
    HistoryNodeNotFoundError,
    HistoryNotFoundError,
    UnsupportedHistoryFileError,
)
from markoun.core.file_history.model import (
    HistoryNode,
    HistorySaveResult,
    HistoryTree,
)

SCHEMA_VERSION = 1


class FileHistory:
    """Store branching edit history for individual files without a database."""

    def __init__(
        self,
        workspace_root: Path,
        repository_root: Path,
        allowed_suffixes: Collection[str] = (".md",),
    ) -> None:
        self.workspace_root = workspace_root.resolve()
        self.repository_root = repository_root.resolve()
        self.allowed_suffixes = frozenset(
            suffix.lower() if suffix.startswith(".") else f".{suffix.lower()}"
            for suffix in allowed_suffixes
        )

    def save(
        self,
        path: str | Path,
        content: str,
        *,
        base_revision_id: str | None = None,
        author: str | None = None,
        message: str | None = None,
    ) -> HistorySaveResult:
        relative_path = self._normalize_file_path(path)
        source_path = self._source_path(relative_path)
        if not source_path.is_file():
            raise FileNotFoundError(source_path)

        content_bytes = content.encode("utf-8")
        blob_id = hashlib.sha256(content_bytes).hexdigest()

        with self._locked():
            catalog = self._load_catalog()
            note_id = catalog["paths"].get(relative_path)
            is_new_note = note_id is None
            if note_id is None:
                note_id = secrets.token_hex(16)
                index = self._new_index(note_id)
            else:
                index = self._load_index(note_id)

            nodes: dict[str, dict[str, Any]] = index["nodes"]
            default_revision_id: str | None = index["default_revision_id"]
            parent_id = (
                base_revision_id if base_revision_id is not None else default_revision_id
            )

            if parent_id is not None:
                parent = self._require_node(index, parent_id)
                if parent["blob_id"] == blob_id:
                    return HistorySaveResult(
                        note_id=note_id,
                        revision_id=parent_id,
                        default_revision_id=default_revision_id or parent_id,
                        created=False,
                        reused=False,
                    )

                matching_child = next(
                    (
                        node
                        for node in nodes.values()
                        if node["parent_id"] == parent_id and node["blob_id"] == blob_id
                    ),
                    None,
                )
            else:
                matching_child = None

            previous_content = source_path.read_bytes()
            self._write_blob(note_id, blob_id, content_bytes)

            created = matching_child is None
            if matching_child is None:
                revision_id = secrets.token_hex(16)
                sequence = index["next_sequence"]
                node = {
                    "id": revision_id,
                    "parent_id": parent_id,
                    "blob_id": blob_id,
                    "created_at": datetime.now(UTC).isoformat(),
                    "sequence": sequence,
                    "content_size": len(content_bytes),
                    "author": author,
                    "path": relative_path,
                    "message": message,
                }
                nodes[revision_id] = node
                index["next_sequence"] = sequence + 1
                if index["root_node_id"] is None:
                    index["root_node_id"] = revision_id
            else:
                revision_id = matching_child["id"]

            index["default_revision_id"] = revision_id

            self._write_source(source_path, content_bytes)
            try:
                self._save_index(note_id, index)
                if is_new_note:
                    catalog["paths"][relative_path] = note_id
                    catalog["notes"][note_id] = {
                        "path": relative_path,
                        "active": True,
                    }
                    self._save_catalog(catalog)
            except Exception:
                self._write_source(source_path, previous_content)
                raise

            return HistorySaveResult(
                note_id=note_id,
                revision_id=revision_id,
                default_revision_id=revision_id,
                created=created,
                reused=not created,
            )

    def get_tree(self, path: str | Path) -> HistoryTree:
        relative_path = self._normalize_file_path(path)
        self._require_repository()
        with self._locked():
            note_id, index = self._history_for_path(relative_path)
            nodes = tuple(
                self._to_node(node)
                for node in sorted(
                    index["nodes"].values(),
                    key=lambda item: item["sequence"],
                )
            )
            return HistoryTree(
                note_id=note_id,
                root_node_id=index["root_node_id"],
                default_revision_id=index["default_revision_id"],
                nodes=nodes,
            )

    def get_revision(self, path: str | Path, revision_id: str) -> str:
        relative_path = self._normalize_file_path(path)
        self._require_repository()
        with self._locked():
            note_id, index = self._history_for_path(relative_path)
            node = self._require_node(index, revision_id)
            return self._read_blob(note_id, node["blob_id"]).decode("utf-8")

    def delete_revision(self, path: str | Path, revision_id: str) -> HistoryTree:
        relative_path = self._normalize_file_path(path)
        source_path = self._source_path(relative_path)
        self._require_repository()

        with self._locked():
            note_id, index = self._history_for_path(relative_path)
            nodes: dict[str, dict[str, Any]] = index["nodes"]
            target = self._require_node(index, revision_id)
            default_id: str | None = index["default_revision_id"]
            if default_id is None:
                raise HistoryNodeNotFoundError(revision_id)

            children = self._children_by_parent(nodes)
            deleted_ids = self._descendants(children, revision_id)
            default_deleted = default_id in deleted_ids
            restore_node_id = target["parent_id"] if default_deleted else None
            for node_id in deleted_ids:
                nodes.pop(node_id, None)
            if default_deleted:
                index["default_revision_id"] = restore_node_id

            if not nodes:
                index["root_node_id"] = None
                index["default_revision_id"] = None
            elif index["root_node_id"] not in nodes:
                index["root_node_id"] = next(
                    node_id
                    for node_id, node in nodes.items()
                    if node["parent_id"] is None
                )

            previous_content: bytes | None = None
            if restore_node_id is not None:
                restore_node = self._require_node(index, restore_node_id)
                restored_content = self._read_blob(note_id, restore_node["blob_id"])
                previous_content = source_path.read_bytes()
                self._write_source(source_path, restored_content)

            try:
                self._save_index(note_id, index)
            except Exception:
                if previous_content is not None:
                    self._write_source(source_path, previous_content)
                raise

            self._remove_unreferenced_blobs(note_id, index)
            return self._tree_from_index(note_id, index)

    def move(self, source: str | Path, target: str | Path) -> int:
        source_path = self._normalize_scope_path(source)
        target_path = self._normalize_scope_path(target)
        if not self.repository_root.exists():
            return 0
        with self._locked():
            catalog = self._load_catalog()
            changes: list[tuple[str, str, str]] = []
            for current_path, note_id in catalog["paths"].items():
                replacement = self._replace_scope(current_path, source_path, target_path)
                if replacement is not None:
                    changes.append((current_path, replacement, note_id))

            if not changes:
                return 0

            moving_note_ids = {note_id for _, _, note_id in changes}
            for _, destination, _ in changes:
                stale_note_id = catalog["paths"].get(destination)
                if stale_note_id is not None and stale_note_id not in moving_note_ids:
                    catalog["paths"].pop(destination)
                    catalog["notes"][stale_note_id]["active"] = False

            for current_path, _, _ in changes:
                catalog["paths"].pop(current_path)
            for _, destination, note_id in changes:
                catalog["paths"][destination] = note_id
                catalog["notes"][note_id]["path"] = destination

            self._save_catalog(catalog)
            return len(changes)

    def mark_deleted(self, path: str | Path, *, purge: bool = False) -> int:
        scope = self._normalize_scope_path(path)
        if not self.repository_root.exists():
            return 0
        with self._locked():
            catalog = self._load_catalog()
            note_ids = {
                note_id
                for note_id, note in catalog["notes"].items()
                if self._is_in_scope(note["path"], scope)
            }
            if not note_ids:
                return 0

            for current_path, note_id in tuple(catalog["paths"].items()):
                if note_id in note_ids:
                    catalog["paths"].pop(current_path)

            if purge:
                for note_id in note_ids:
                    catalog["notes"].pop(note_id, None)
                    shutil.rmtree(self._note_root(note_id), ignore_errors=True)
            else:
                for note_id in note_ids:
                    catalog["notes"][note_id]["active"] = False

            self._save_catalog(catalog)
            return len(note_ids)

    def purge(self, path: str | Path) -> int:
        return self.mark_deleted(path, purge=True)

    def has_history(self, path: str | Path) -> bool:
        relative_path = self._normalize_file_path(path)
        if not self.repository_root.exists():
            return False
        with self._locked():
            return relative_path in self._load_catalog()["paths"]

    def _require_repository(self) -> None:
        if not self.repository_root.exists():
            raise HistoryNotFoundError(str(self.repository_root))

    def _normalize_file_path(self, path: str | Path) -> str:
        normalized = self._normalize_scope_path(path)
        if PurePosixPath(normalized).suffix.lower() not in self.allowed_suffixes:
            raise UnsupportedHistoryFileError(normalized)
        return normalized

    @staticmethod
    def _normalize_scope_path(path: str | Path) -> str:
        raw_path = str(path)
        if "\0" in raw_path or "\\" in raw_path:
            raise ValueError("Invalid history path")
        pure_path = PurePosixPath(raw_path)
        if pure_path.is_absolute() or ".." in pure_path.parts:
            raise ValueError("History paths must be workspace-relative")
        normalized = pure_path.as_posix()
        return "." if normalized in {"", "."} else normalized.removeprefix("./")

    def _source_path(self, relative_path: str) -> Path:
        source_path = (self.workspace_root / relative_path).resolve(strict=False)
        if not source_path.is_relative_to(self.workspace_root):
            raise ValueError("History path escapes the workspace")
        return source_path

    @contextmanager
    def _locked(self) -> Iterator[None]:
        lock_path = self.repository_root / ".lock"
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        with lock_path.open("a+b") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

    def _load_catalog(self) -> dict[str, Any]:
        path = self.repository_root / "catalog.mkv"
        if not path.exists():
            return {
                "schema": SCHEMA_VERSION,
                "paths": {},
                "notes": {},
            }
        catalog = decode_json(path.read_bytes())
        if catalog.get("schema") != SCHEMA_VERSION:
            raise HistoryCorruptedError("Unsupported history catalog schema")
        return catalog

    def _save_catalog(self, catalog: dict[str, Any]) -> None:
        atomic_write(self.repository_root / "catalog.mkv", encode_json(catalog))

    @staticmethod
    def _new_index(note_id: str) -> dict[str, Any]:
        return {
            "schema": SCHEMA_VERSION,
            "note_id": note_id,
            "root_node_id": None,
            "default_revision_id": None,
            "next_sequence": 1,
            "nodes": {},
        }

    def _load_index(self, note_id: str) -> dict[str, Any]:
        path = self._note_root(note_id) / "index.mkv"
        if not path.exists():
            raise HistoryCorruptedError(f"Missing history index for note {note_id}")
        index = decode_json(path.read_bytes())
        if index.get("schema") != SCHEMA_VERSION or index.get("note_id") != note_id:
            raise HistoryCorruptedError("Invalid note history index")
        return index

    def _save_index(self, note_id: str, index: dict[str, Any]) -> None:
        atomic_write(self._note_root(note_id) / "index.mkv", encode_json(index))

    def _history_for_path(self, relative_path: str) -> tuple[str, dict[str, Any]]:
        catalog = self._load_catalog()
        note_id = catalog["paths"].get(relative_path)
        if note_id is None:
            raise HistoryNotFoundError(relative_path)
        return note_id, self._load_index(note_id)

    def _note_root(self, note_id: str) -> Path:
        return self.repository_root / "notes" / note_id

    def _blob_path(self, note_id: str, blob_id: str) -> Path:
        return self._note_root(note_id) / "blobs" / blob_id[:2] / f"{blob_id}.mkv"

    def _write_blob(self, note_id: str, blob_id: str, content: bytes) -> None:
        path = self._blob_path(note_id, blob_id)
        if not path.exists():
            atomic_write(path, encode_blob(content))

    def _read_blob(self, note_id: str, blob_id: str) -> bytes:
        path = self._blob_path(note_id, blob_id)
        if not path.exists():
            raise HistoryCorruptedError(f"Missing history blob {blob_id}")
        content = decode_blob(path.read_bytes())
        if hashlib.sha256(content).hexdigest() != blob_id:
            raise HistoryCorruptedError(f"History blob checksum mismatch: {blob_id}")
        return content

    @staticmethod
    def _write_source(path: Path, content: bytes) -> None:
        atomic_write(path, content)

    @staticmethod
    def _require_node(index: dict[str, Any], revision_id: str) -> dict[str, Any]:
        node = index["nodes"].get(revision_id)
        if node is None:
            raise HistoryNodeNotFoundError(revision_id)
        return node

    @staticmethod
    def _to_node(node: dict[str, Any]) -> HistoryNode:
        return HistoryNode(
            id=node["id"],
            parent_id=node["parent_id"],
            blob_id=node["blob_id"],
            created_at=node["created_at"],
            sequence=node["sequence"],
            content_size=node["content_size"],
            author=node["author"],
            path=node["path"],
            message=node.get("message"),
        )

    def _tree_from_index(self, note_id: str, index: dict[str, Any]) -> HistoryTree:
        return HistoryTree(
            note_id=note_id,
            root_node_id=index["root_node_id"],
            default_revision_id=index["default_revision_id"],
            nodes=tuple(
                self._to_node(node)
                for node in sorted(
                    index["nodes"].values(),
                    key=lambda item: item["sequence"],
                )
            ),
        )

    @staticmethod
    def _children_by_parent(
        nodes: dict[str, dict[str, Any]],
    ) -> dict[str, list[str]]:
        children: dict[str, list[str]] = {}
        for node_id, node in nodes.items():
            parent_id = node["parent_id"]
            if parent_id is not None:
                children.setdefault(parent_id, []).append(node_id)
        return children

    @staticmethod
    def _descendants(children: dict[str, list[str]], node_id: str) -> set[str]:
        result: set[str] = set()
        pending = [node_id]
        while pending:
            current = pending.pop()
            if current in result:
                continue
            result.add(current)
            pending.extend(children.get(current, ()))
        return result

    @staticmethod
    def _is_in_scope(path: str, scope: str) -> bool:
        if scope == ".":
            return True
        pure_path = PurePosixPath(path)
        pure_scope = PurePosixPath(scope)
        return pure_path == pure_scope or pure_scope in pure_path.parents

    @classmethod
    def _replace_scope(
        cls,
        path: str,
        source: str,
        target: str,
    ) -> str | None:
        if not cls._is_in_scope(path, source):
            return None
        if path == source:
            return target
        relative = PurePosixPath(path).relative_to(PurePosixPath(source))
        return (PurePosixPath(target) / relative).as_posix()

    def _remove_unreferenced_blobs(
        self,
        note_id: str,
        index: dict[str, Any],
    ) -> None:
        referenced = {node["blob_id"] for node in index["nodes"].values()}
        blob_root = self._note_root(note_id) / "blobs"
        if not blob_root.exists():
            return
        for blob_path in blob_root.glob("*/*.mkv"):
            if blob_path.stem not in referenced:
                blob_path.unlink(missing_ok=True)
        for directory in blob_root.iterdir():
            if directory.is_dir():
                with suppress(OSError):
                    directory.rmdir()
