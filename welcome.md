# Welcome to Markoun

Markoun is a lightweight, self-hosted Markdown editor that works directly with your files.

## Shortcuts and gestures

| Action                  | How                                                                    |
| ----------------------- | ---------------------------------------------------------------------- |
| Rename a file or folder | Long-press its name                                                    |
| Move a file or folder   | Drag it onto a folder; drop on empty tree space for root               |
| Upload a local file     | Drag it from your device onto a folder                                 |
| Paste an image          | `Ctrl + V` / `Command + V` in a note; a link is inserted automatically |
| Save a note             | `Ctrl + S` / `Command + S` in the editor                               |

Changes are also saved before switching notes or history revisions, and before logging out.

## Worth knowing

- **Image folders**: Enable **Settings > General > Group Pasted Images** to keep images for `trip.md` in a neighboring `trip/` folder.
- **History branches**: With **File History** enabled, view an older revision in **History**, then edit and save to branch from it. Viewing alone leaves the latest saved version unchanged.
- **More writing space**: Enable **Settings > Appearance > Wide Editor Lines** to remove the text column's width limit. On desktop, panel dividers are draggable.

## MCP support

Let an AI agent work with your notes: create a key in **Profile > MCP API Keys** and choose its permissions. Connect using the displayed server URL, **Streamable HTTP**, and `Authorization: Bearer <api-key>`.

The key is shown only once. MCP requires authentication to be enabled.

## LaTeX support

Use `$...$` for inline math and `$$...$$` for display math:

```md
Inline math: $E = mc^2$

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

______________________________________________________________________

Customize this page through `WELCOME_NOTE_PATH`, or edit `welcome.md` in your Docker-mounted directory.

Maintained by: **tropical algae**\
Repository: [tropical-algae/markoun](https://github.com/tropical-algae/markoun.git)
