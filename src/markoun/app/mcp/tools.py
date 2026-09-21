from pathlib import Path
from typing import Annotated, Any

from mcp.server import MCPServer
from mcp.types import ToolAnnotations
from pydantic import Field

from markoun.app.mcp.auth import get_mcp_principal
from markoun.app.services.dir_service import create_dir
from markoun.app.services.file_service import create_note, search_markdown_files
from markoun.app.services.item_service import get_directory_children
from markoun.app.services.note_service import load_note, save_note
from markoun.app.services.workspace_item_service import (
    move_workspace_item,
    remove_workspace_item,
    rename_workspace_item,
)
from markoun.app.services.workspace_service import (
    WorkspaceContext,
    create_workspace_context,
)
from markoun.common.config import settings
from markoun.common.decorator import mcp_tool_result
from markoun.core.db.session import LocalSession
from markoun.core.model.api_key import McpPermission
from markoun.core.model.file import FileSaveRequest

DISPLAYED_FILE_TYPES = set(settings.DISPLAYED_FILE_TYPES)


def _workspace(permission: McpPermission) -> WorkspaceContext:
    principal = get_mcp_principal(permission)
    return create_workspace_context(principal.user)


def _ensure_markdown(path: str | Path) -> None:
    if Path(path).suffix.lower() != ".md":
        raise ValueError("Only Markdown files are supported")


def register_workspace_tools(server: MCPServer) -> None:
    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def list_directory(
        path: Annotated[
            str,
            Field(
                min_length=1,
                description='Workspace-relative directory path. Use "." for the root.',
            ),
        ] = ".",
    ) -> dict[str, Any]:
        """List visible files and folders in a workspace directory."""
        workspace = _workspace(McpPermission.READ)
        directory = workspace.resolve(path)
        nodes = await get_directory_children(
            workspace,
            directory,
            DISPLAYED_FILE_TYPES,
        )
        return {
            "path": workspace.relative(directory).as_posix(),
            "children": [node.model_dump(mode="json") for node in nodes],
        }

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def read_file(
        path: Annotated[
            str,
            Field(min_length=1, description="Workspace-relative Markdown file path."),
        ],
        line_count: Annotated[
            int,
            Field(ge=1, description="Maximum number of lines to return."),
        ],
        start_line: Annotated[
            int,
            Field(ge=1, description="One-based line number at which reading starts."),
        ] = 1,
    ) -> dict[str, Any]:
        """Read Markdown lines and return total lines and the current revision ID."""
        _ensure_markdown(path)
        workspace = _workspace(McpPermission.READ)
        async with LocalSession() as db:
            result = await load_note(db, workspace, path)
        lines = result.content.splitlines(keepends=True)
        start_index = start_line - 1
        selected = lines[start_index : start_index + line_count]
        return {
            "path": result.meta.path,
            "content": "".join(selected),
            "start_line": start_line,
            "total_lines": len(lines),
            "revision_id": result.default_revision_id,
        }

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def search_files(
        keyword: Annotated[
            str,
            Field(
                min_length=1,
                description="Fixed, case-sensitive text to find in Markdown files.",
            ),
        ],
        limit: Annotated[
            int,
            Field(ge=1, description="Maximum number of matching files to return."),
        ],
    ) -> dict[str, Any]:
        """Find Markdown files containing a literal keyword (no fuzzy matching).

        Returns each matching file's node information and the line number and text
        of every match.
        """
        workspace = _workspace(McpPermission.SEARCH)
        results = await search_markdown_files(keyword, workspace, limit)
        return {"results": [result.model_dump(mode="json") for result in results]}

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=True,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def write_file(
        path: Annotated[
            str,
            Field(min_length=1, description="Workspace-relative Markdown file path."),
        ],
        content: Annotated[
            str,
            Field(description="Complete replacement content for the Markdown file."),
        ],
        base_revision_id: Annotated[
            str | None,
            Field(
                description=(
                    "Revision ID returned by read_file; omit when no revision exists."
                ),
            ),
        ] = None,
    ) -> dict[str, Any]:
        """Overwrite a Markdown file with the provided complete text content."""
        _ensure_markdown(path)
        workspace = _workspace(McpPermission.WRITE)
        async with LocalSession() as db:
            result = await save_note(
                db,
                workspace,
                FileSaveRequest(
                    filepath=path,
                    content=content,
                    base_revision_id=base_revision_id,
                ),
            )
        return result.model_dump(mode="json")

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def create_file(
        parent_path: Annotated[
            str,
            Field(
                min_length=1,
                description='Workspace-relative parent directory. Use "." for the root.',
            ),
        ],
        name: Annotated[
            str,
            Field(min_length=1, description='New file name without the ".md" suffix.'),
        ],
        content: Annotated[
            str,
            Field(description="Initial Markdown content for the new file."),
        ] = "",
    ) -> dict[str, Any]:
        """Create a Markdown file and save its initial content."""
        workspace = _workspace(McpPermission.CREATE)
        parent = workspace.resolve(parent_path)
        node = create_note(workspace, parent, name)
        async with LocalSession() as db:
            saved = await save_note(
                db,
                workspace,
                FileSaveRequest(filepath=node.path, content=content),
            )
        return {
            "node": node.model_dump(mode="json"),
            "revision_id": saved.revision_id,
        }

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=False,
            idempotentHint=False,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def create_directory(
        parent_path: Annotated[
            str,
            Field(
                min_length=1,
                description='Workspace-relative parent directory. Use "." for the root.',
            ),
        ],
        name: Annotated[
            str,
            Field(min_length=1, description="Name of the new directory."),
        ],
    ) -> dict[str, Any]:
        """Create a directory in the workspace."""
        workspace = _workspace(McpPermission.CREATE)
        node = create_dir(workspace, workspace.resolve(parent_path), name)
        return node.model_dump(mode="json")

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=False,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def move_item(
        path: Annotated[
            str,
            Field(min_length=1, description="Workspace-relative file or directory path."),
        ],
        target_directory: Annotated[
            str,
            Field(
                min_length=1,
                description='Workspace-relative destination directory. Use "." for root.',
            ),
        ],
    ) -> dict[str, Any]:
        """Move a file or directory into another workspace directory."""
        workspace = _workspace(McpPermission.MOVE)
        node = await move_workspace_item(
            workspace,
            path,
            target_directory,
            DISPLAYED_FILE_TYPES,
        )
        return node.model_dump(mode="json")

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=False,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def rename_item(
        path: Annotated[
            str,
            Field(min_length=1, description="Workspace-relative file or directory path."),
        ],
        new_name: Annotated[
            str,
            Field(
                min_length=1,
                description="New item name without changing the existing file suffix.",
            ),
        ],
    ) -> dict[str, Any]:
        """Rename a file or directory without changing its parent directory."""
        workspace = _workspace(McpPermission.MOVE)
        await rename_workspace_item(workspace, path, new_name)
        return {"renamed": True}

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=False,
            destructiveHint=True,
            idempotentHint=False,
            openWorldHint=False,
        ),
        structured_output=True,
    )
    @mcp_tool_result
    async def delete_item(
        path: Annotated[
            str,
            Field(min_length=1, description="Workspace-relative file or directory path."),
        ],
    ) -> dict[str, Any]:
        """Delete a workspace file or directory while retaining its history."""
        workspace = _workspace(McpPermission.DELETE)
        await remove_workspace_item(workspace, path)
        return {"deleted": True}
