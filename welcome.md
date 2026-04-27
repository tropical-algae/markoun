# Welcome to Markoun

Markoun is a lightweight, self-hosted, and entirely file-based Markdown editor designed for users who prioritize privacy and simplicity.

> The UI layout of Markoun is inspired by [Haptic](https://github.com/chroxify/haptic) and [Obsidian](https://github.com/obsidianmd) — both excellent Markdown editing tools.

______________________________________________________________________

**Useful shortcuts and gestures**

| Action                     | How                          |
| -------------------------- | ---------------------------- |
| Rename a file or folder    | Long-press its name          |
| Upload into a folder       | Drag a file onto the folder  |
| Paste an image into a note | Press `Ctrl+V` in the editor |

Only Markdown files and supported image files appear in the file tree by default.\
To expose more file types, update `DISPLAYED_FILE_TYPES` in your configuration.

**LaTeX support**

```md
# Example

Inline math: $E = mc^2$

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

______________________________________________________________________

If you deploy with Docker, this page can be replaced by mounting your own `welcome.md`.

Maintained by: **tropical algae**\
Repository: [tropical-algae/markoun](https://github.com/tropical-algae/markoun.git)
