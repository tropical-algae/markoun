from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any, cast

from mcp.server import MCPServer
from mcp.server.context import (
    CallNext,
    HandlerResult,
    ServerMiddleware,
    ServerRequestContext,
)
from mcp.types import CallToolResult, TextContent

from markoun import __version__
from markoun.app.mcp.auth import ApiKeyAuthMiddleware
from markoun.app.mcp.tools import register_workspace_tools
from markoun.app.utils.constant import CONSTANT
from markoun.common.config import settings
from markoun.core.model.mcp import McpError, McpToolResponse


async def normalize_mcp_tool_result(
    context: ServerRequestContext[Any, Any],
    call_next: CallNext,
) -> HandlerResult:
    result = await call_next(context)
    if (
        context.method != "tools/call"
        or not isinstance(result, CallToolResult)
        or not result.is_error
        or result.structured_content is not None
    ):
        return result

    message = next(
        (
            block.text
            for block in result.content
            if isinstance(block, TextContent) and block.text
        ),
        CONSTANT.MCP_INTERNAL_ERROR_MESSAGE,
    )
    return McpToolResponse(error=McpError(message=message)).call_tool_result()


mcp_server = MCPServer(
    name="markoun",
    title="Markoun Workspace",
    description="Read, search, edit, and organize Markdown files in a Markoun workspace.",
    instructions=(
        "Work only within the current markoun workspace and treat every path as relative "
        "to the workspace root. If a tool reports that an operation is not "
        "permitted, do not retry it."
    ),
    version=__version__,
    middleware=[cast(ServerMiddleware[Any], normalize_mcp_tool_result)],
)
register_workspace_tools(mcp_server)

mcp_app = ApiKeyAuthMiddleware(
    mcp_server.streamable_http_app(
        streamable_http_path="/",
        json_response=True,
        stateless_http=True,
        host=settings.HOST,
    )
)


@asynccontextmanager
async def mcp_lifespan() -> AsyncGenerator[None]:
    async with mcp_server.session_manager.run():
        yield
