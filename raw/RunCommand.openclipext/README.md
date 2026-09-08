# Terminal

Runs the selected text as a command in the active terminal window.

Supports macOS **Terminal**, **iTerm2**, **Warp**, **Ghostty**, **kitty**, and **cmux**.

## Features

- **Active Session Targeting**: Runs commands directly in your current terminal tab and directory.
- **Auto-Detection**: Automatically identifies your active or running terminal emulator.
- **Prepend & Append**: Add prefixes (e.g. `sudo`, `git`) or suffixes (e.g. `| grep error`) to selected commands.
- **New Tab Option**: Optionally open commands in a new tab instead of the current tab.

## Usage Examples

1. **Quick Command Run**: Select `git status` or `npm test` and execute it directly.
2. **Elevated Privileges**: Set **Prepend Command** to `sudo` to run selected commands with administrative privileges.
3. **Output Filtering**: Set **Append Command** to `| grep keyword` to filter command output.
4. **Background / Server Tasks**: Turn on **Use New Tab** when launching servers like `npm run dev` or `docker compose up`.

## Configuration

Configure in **OpenClip Preferences ▸ Actions ▸ Run in Terminal**:

- **Terminal Emulator**: Choose between *Auto-detect*, *Terminal*, *iTerm2*, *Warp*, *Ghostty*, *kitty*, or *cmux*.
- **Prepend Command**: Text to insert before the selected text (optional).
- **Append Command**: Text to insert after the selected text (optional).
- **Use New Tab**: Open the command in a new tab instead of the current tab (default: off).
