from pydantic import BaseModel, Field


class HistoryNodeResponse(BaseModel):
    id: str
    parent_id: str | None
    blob_id: str
    created_at: str
    sequence: int
    content_size: int
    operation_id: str
    author: str | None
    path: str
    message: str | None


class HistoryTreeResponse(BaseModel):
    note_id: str
    root_node_id: str | None
    default_revision_id: str | None
    nodes: list[HistoryNodeResponse] = Field(default_factory=list)


class HistoryRevisionResponse(BaseModel):
    revision_id: str
    content: str


class HistoryDeleteRequest(BaseModel):
    filepath: str
    revision_id: str


class HistoryPurgeResponse(BaseModel):
    deleted_histories: int
