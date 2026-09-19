# Droppy

Instantly stage links, files, and text notes into [Droppy](https://getdroppy.app) in one click directly from OpenClip without dragging across screens.

Droppy is a macOS productivity utility that adds a drag-and-drop shelf to your MacBook's notch (or Dynamic Island pill) and a floating basket that follows your cursor between spaces and windows.

## Features

- **1-Click Staging**: Highlight anything, click **Droppy**, and it immediately queues into Droppy.
- **Smart Detection**:
  - **Web links (`https://...`)**: Detected automatically and added as clickable links to Droppy.
  - **Local file paths (`/Users/...`)**: Directly loaded into Droppy without opening Finder.
  - **Text & code snippets**: Automatically saved as a clean `.txt` scratch file in `~/.openclip/droppy-snippets/` and passed to Droppy as a ready-to-drag file.
- **Configurable Target**: Select whether items default to the **Notch Shelf** or the **Floating Basket** in OpenClip Preferences.

## Options

- **Target Destination** (`target`):
  - `shelf` (default): Adds to the top notch shelf.
  - `basket`: Adds to the cursor-following floating basket.

## Requirements

- macOS 13 or later.
- [Droppy](https://getdroppy.app) installed on your Mac.
