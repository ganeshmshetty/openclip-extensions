# Open File

Open the selected file path in its default app. Use it when a path is already on screen — in a script, a terminal, or a note — and you want to open that file without switching to Finder first.

This is a companion to the built-in **Reveal in Finder** action. Reveal still shows folders in Finder; Open File is for opening the file itself.

## Features

- **Default app**: Opens the path with the same app macOS would use in Finder.
- **Path-aware**: Appears only when the selection looks like a file path — an absolute path (`/Users/…`), a home path (`~/Documents/…`), or a `file://` URL.
- **Cleans the selection**: Trims whitespace, surrounding quotes, and `~` expansion before opening.

## Usage

1. Select a file path in any app.
2. Click **Open File** in OpenClip.
3. The file opens in its default app.

If the path is a folder, the action does nothing and shows a short error — use **Reveal in Finder** instead. A missing path also shows a short error.
