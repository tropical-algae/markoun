# Welcome to Markoun

Markoun is a lightweight, self-hosted Markdown editor that works directly with your files.

## Shortcuts and gestures

| Action                  | How                                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| File and folder actions | Right-click it, or tap its three-dot button on a touchscreen.         |
| Move a file or folder   | Drop it onto a folder, or in empty tree space to move it to the root. |
| Upload a local file     | Drop it onto a folder, or choose **Upload file** in the folder menu.  |
| Paste an image          | `Ctrl + V` / `Command + V` in a note uploads it and inserts a link.   |
| Save a note             | `Ctrl + S` / `Command + S` in the editor.                             |

Changes are also saved before switching notes or history revisions, and before logging out.

## Worth knowing

- **Image folders**: Enable **Settings > General > Group Pasted Images** to keep images for `trip.md` in a neighboring `trip/` folder.
- **Links between notes**: In Preview, a relative Markdown link such as `[Packing list](packing.md)` opens a note next to the one you're editing.
- **History branches**: With **File History** enabled, view an older revision in **History**, then edit and save to branch from it. Viewing alone leaves the latest saved version unchanged.
- **More writing space**: Enable **Settings > Appearance > Wide Editor Lines** to remove the text column's width limit. On desktop, panel dividers are draggable.

## MCP support

Let an AI agent work with your notes: open **MCP Keys** in the **Account** panel, create a key, and choose its permissions. Connect using the displayed server URL, **Streamable HTTP**, and `Authorization: Bearer <api-key>`.

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

Customize this page by editing the file at `WELCOME_NOTE_PATH` (`welcome.md` in the mounted directory by default with Docker).

Maintained by: **tropical algae**\
Repository: [tropical-algae/markoun](https://github.com/tropical-algae/markoun.git)
