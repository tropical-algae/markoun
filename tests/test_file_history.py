# import asyncio
# from pathlib import Path

# import pytest

# from markoun.app.services.history_service import (
#     get_file_history_tree,
#     save_file_history,
# )
# from markoun.app.services.workspace_service import WorkspaceContext
# from markoun.core.file_history import FileHistory, HistoryNotFoundError


# @pytest.fixture
# def history(tmp_path: Path) -> tuple[FileHistory, Path]:
#     workspace = tmp_path / "workspace"
#     repository = tmp_path / "history"
#     workspace.mkdir()
#     return FileHistory(workspace, repository, {".md"}), workspace


# def test_history_creates_branches_and_reuses_matching_child(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     note = workspace / "note.md"
#     note.write_text("A", encoding="utf-8")

#     revision_a = store.save("note.md", "A", operation_id="save-a")
#     revision_b = store.save(
#         "note.md",
#         "B",
#         base_revision_id=revision_a.revision_id,
#         operation_id="save-b",
#     )
#     revision_c = store.save(
#         "note.md",
#         "C",
#         base_revision_id=revision_a.revision_id,
#         operation_id="save-c",
#     )
#     reused_b = store.save(
#         "note.md",
#         "B",
#         base_revision_id=revision_a.revision_id,
#         operation_id="reuse-b",
#     )

#     tree = store.get_tree("note.md")
#     nodes = {node.id: node for node in tree.nodes}

#     assert len(nodes) == 3
#     assert nodes[revision_b.revision_id].parent_id == revision_a.revision_id
#     assert nodes[revision_c.revision_id].parent_id == revision_a.revision_id
#     assert reused_b.revision_id == revision_b.revision_id
#     assert reused_b.reused is True
#     assert tree.default_revision_id == revision_b.revision_id
#     assert note.read_text(encoding="utf-8") == "B"


# def test_unchanged_historical_save_does_not_move_default_revision(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     (workspace / "note.md").write_text("A", encoding="utf-8")
#     revision_a = store.save("note.md", "A")
#     revision_b = store.save(
#         "note.md",
#         "B",
#         base_revision_id=revision_a.revision_id,
#     )

#     unchanged = store.save(
#         "note.md",
#         "A",
#         base_revision_id=revision_a.revision_id,
#     )

#     assert unchanged.revision_id == revision_a.revision_id
#     assert unchanged.default_revision_id == revision_b.revision_id
#     assert store.get_tree("note.md").default_revision_id == revision_b.revision_id


# def test_deleting_default_ancestor_keeps_and_promotes_default_subtree(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     (workspace / "note.md").write_text("A", encoding="utf-8")
#     revision_a = store.save("note.md", "A")
#     store.save("note.md", "B", base_revision_id=revision_a.revision_id)
#     revision_c = store.save(
#         "note.md",
#         "C",
#         base_revision_id=revision_a.revision_id,
#     )
#     revision_d = store.save(
#         "note.md",
#         "D",
#         base_revision_id=revision_c.revision_id,
#     )

#     tree = store.delete_revision("note.md", revision_a.revision_id)
#     nodes = {node.id: node for node in tree.nodes}

#     assert set(nodes) == {revision_c.revision_id, revision_d.revision_id}
#     assert nodes[revision_c.revision_id].parent_id is None
#     assert nodes[revision_d.revision_id].parent_id == revision_c.revision_id
#     assert tree.root_node_id == revision_c.revision_id
#     assert tree.default_revision_id == revision_d.revision_id


# def test_deleting_default_revision_restores_parent_content(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     note = workspace / "note.md"
#     note.write_text("A", encoding="utf-8")
#     revision_a = store.save("note.md", "A")
#     revision_b = store.save(
#         "note.md",
#         "B",
#         base_revision_id=revision_a.revision_id,
#     )

#     tree = store.delete_revision("note.md", revision_b.revision_id)

#     assert tree.default_revision_id == revision_a.revision_id
#     assert note.read_text(encoding="utf-8") == "A"


# def test_move_retained_delete_and_path_purge(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     source = workspace / "notes" / "note.md"
#     source.parent.mkdir()
#     source.write_text("content", encoding="utf-8")
#     store.save("notes/note.md", "content")

#     target = workspace / "archive" / "note.md"
#     target.parent.mkdir()
#     source.rename(target)
#     assert store.move("notes", "archive") == 1

#     assert (
#         store.get_revision(
#             "archive/note.md",
#             store.get_tree("archive/note.md").default_revision_id or "",
#         )
#         == "content"
#     )
#     with pytest.raises(HistoryNotFoundError):
#         store.get_tree("notes/note.md")

#     target.unlink()
#     assert store.mark_deleted("archive/note.md") == 1
#     with pytest.raises(HistoryNotFoundError):
#         store.get_tree("archive/note.md")
#     assert store.purge("archive") == 1


# def test_history_payload_is_stored_as_compressed_binary(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     content = "plain markdown that should not appear directly"
#     (workspace / "note.md").write_text(content, encoding="utf-8")
#     store.save("note.md", content)

#     persisted_data = b"".join(
#         path.read_bytes() for path in store.repository_root.rglob("*.mkv")
#     )

#     assert content.encode() not in persisted_data


# def test_metadata_operations_do_not_create_an_empty_repository(
#     tmp_path: Path,
# ) -> None:
#     workspace = tmp_path / "workspace"
#     repository = workspace / ".markoun" / "history"
#     workspace.mkdir()
#     store = FileHistory(workspace, repository)

#     assert store.move("old.md", "new.md") == 0
#     assert store.mark_deleted("old.md") == 0
#     assert repository.exists() is False


# def test_move_replaces_a_stale_destination_mapping(
#     history: tuple[FileHistory, Path],
# ) -> None:
#     store, workspace = history
#     source = workspace / "source.md"
#     target = workspace / "target.md"
#     source.write_text("source", encoding="utf-8")
#     target.write_text("target", encoding="utf-8")
#     source_revision = store.save("source.md", "source").revision_id
#     store.save("target.md", "target")

#     target.unlink()
#     source.rename(target)
#     assert store.move("source.md", "target.md") == 1

#     tree = store.get_tree("target.md")
#     assert tree.default_revision_id == source_revision
#     assert store.get_revision("target.md", source_revision) == "source"


# def test_history_service_records_workspace_username(tmp_path: Path) -> None:
#     note = tmp_path / "note.md"
#     note.write_text("content", encoding="utf-8")
#     workspace = WorkspaceContext(
#         document_root=tmp_path,
#         root=tmp_path,
#         username="editor",
#     )

#     asyncio.run(save_file_history(workspace, "note.md", "content"))
#     tree = asyncio.run(get_file_history_tree(workspace, "note.md"))

#     assert tree.nodes[0].author == "editor"
