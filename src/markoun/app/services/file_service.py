from datetime import datetime
from pathlib import Path

import anyio
from marko import Markdown
from marko.inline import Image, Link
from marko.md_renderer import MarkdownRenderer

from markoun.common.config import settings
from markoun.common.util import aread_file, get_static_asset_path
from markoun.core.model.base import FsNodeType
from markoun.core.model.file import FileMeta, FileNode, PathNode

TIME_FORMAT = "%Y-%m-%d %H:%M"


async def get_file_tree(
    current_path: Path, displayed_file_types: set[str]
) -> FileNode | PathNode | None:
    is_dir = await anyio.Path(current_path).is_dir()

    suffix = current_path.suffix.lower().lstrip(".")

    basic_info = {
        "name": current_path.stem,
        "path": str(current_path.absolute()),
        "type": FsNodeType.DIR if is_dir else FsNodeType.FILE,
        "suffix": suffix,
    }

    if is_dir:
        path_node = PathNode(children=[], **basic_info)
        async for item in anyio.Path(current_path).iterdir():
            child_node = await get_file_tree(Path(item), displayed_file_types)
            if child_node:
                path_node.children.append(child_node)

        path_node.children.sort(key=lambda x: (x.type != "dir", x.name))
        return path_node

    return FileNode(**basic_info) if suffix in displayed_file_types else None


async def get_format_markdown(file_path: Path) -> str:
    parent_path = file_path.parent.absolute()
    md = Markdown(renderer=MarkdownRenderer)

    content = await aread_file(file_path)
    doc = md.parse(content)

    def walk(node):
        if isinstance(node, Image | Link):
            original_dest = node.dest

            if not original_dest.startswith(("http", "https", "www", "#")):
                dest_path = Path(original_dest)
                if not dest_path.is_absolute():
                    resolved_abs_path = (parent_path / dest_path).resolve()
                    node.dest = get_static_asset_path(resolved_abs_path)

        if hasattr(node, "children") and isinstance(node.children, list):
            for child in node.children:
                walk(child)

    walk(doc)

    final_md = md.render(doc)
    return final_md


def get_file_meta(path: Path) -> FileMeta:
    if not path.exists():
        raise FileNotFoundError(f"Error: {path} is not existed")

    def fmt(ts: float) -> str:
        return datetime.fromtimestamp(ts).strftime(TIME_FORMAT)

    stat = path.stat()
    return FileMeta(
        path=str(path),
        suffix=path.suffix,
        size=str(stat.st_size),
        mtime=fmt(stat.st_mtime),
        ctime=fmt(stat.st_ctime),
        atime=fmt(stat.st_atime),
    )
