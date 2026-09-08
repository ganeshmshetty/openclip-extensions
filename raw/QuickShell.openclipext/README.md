# Quick Shell

Runs selected text as a shell command silently in the background without opening a terminal window.

Ideal for fast CLI workflows, developer utilities, and AI tools (such as `supermemory add`).

## Features

- **Silent Background Execution**: Runs directly via `/bin/zsh` with zero terminal windows opening.
- **Adaptive Visual Feedback**: Displays an animated loading spinner toast while working, with an adaptive minimum display timer that eliminates visual flicker on fast commands.
- **Prepend & Append Customization**: Configure command prefixes (e.g. `supermemory add`, `curl -s`, `ollama run llama3`) or suffixes (e.g. `| jq .`).
- **Full CLI Tool Support**: Automatically finds CLI binaries installed via Homebrew (`/opt/homebrew`), Cargo (`~/.cargo/bin`), Go, pipx, and NVM.

## Usage Examples

1. **AI Memory & Notes**: Set **Prepend Command** to `supermemory add` and select any text to instantly save it to your AI memory without leaving your app.
2. **Quick Math & Evaluation**: Select `scale=4; 355/113` with **Prepend Command** set to `bc -l <<<` to calculate results on the fly.
3. **Pipelining**: Set **Append Command** to `| tr '[:lower:]' '[:upper:]'` to transform command output.

## Configuration

Configure in **OpenClip Preferences ▸ Actions ▸ Quick Shell**:

- **Prepend Command**: Text inserted before the selected command (optional, e.g. `supermemory add`).
- **Append Command**: Text inserted after the selected command (optional, e.g. `| jq .`).
