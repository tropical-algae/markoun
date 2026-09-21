from typing import Any

from mcp.types import CallToolResult, TextContent
from pydantic import BaseModel, Field, model_validator


class McpError(BaseModel):
    message: str = Field(description="Human-readable reason the operation failed.")
    hint: str | None = Field(
        default=None,
        description="Optional instruction for correcting the failure.",
    )


class McpToolResponse(BaseModel):
    payload: dict[str, Any] | None = Field(
        default=None,
        description="Tool-specific result when the operation succeeds.",
    )
    error: McpError | None = Field(
        default=None,
        description="Failure details when the operation does not succeed.",
    )

    @model_validator(mode="after")
    def validate_result(self) -> "McpToolResponse":
        if (self.payload is None) == (self.error is None):
            raise ValueError("Exactly one of payload or error must be provided")
        return self

    def call_tool_result(self) -> CallToolResult:
        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=self.model_dump_json(exclude_none=True),
                )
            ],
            structured_content=self.model_dump(mode="json"),
            is_error=self.error is not None,
        )
