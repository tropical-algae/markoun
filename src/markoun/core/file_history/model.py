from dataclasses import dataclass


@dataclass(frozen=True)
class HistoryNode:
    id: str
    parent_id: str | None
    blob_id: str
    created_at: str
    sequence: int
    content_size: int
    author: str | None
    path: str
    message: str | None = None


@dataclass(frozen=True)
class HistoryTree:
    note_id: str
    root_node_id: str | None
    default_revision_id: str | None
    nodes: tuple[HistoryNode, ...]


@dataclass(frozen=True)
class HistorySaveResult:
    note_id: str
    revision_id: str
    default_revision_id: str
    created: bool
    reused: bool
