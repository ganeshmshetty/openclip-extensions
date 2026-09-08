# Quick Shell

Runs selected text as a shell command silently in the background without opening a terminal window.

Ideal for fast CLI workflows, API queries, quick text pipelines, developer utilities, and AI memory tools (such as `supermemory add`).

## Features

- **Silent Background Execution**: Runs directly via `/bin/zsh` with zero terminal windows opening and zero AppleEvents permission prompts.
- **Visual Loading Spinner**: Displays an animated loading toast while the command is working, which can be clicked to cancel at any time.
- **Native Status Toasts**: Automatically shows a green success toast when the command finishes or a red error toast with the error message if the command fails.
- **Flexible Output Handling**: Paste output directly into your frontmost app, copy to clipboard with a toast, show output as a toast, or discard silently.
- **Full CLI Tool Support**: Automatically finds CLI binaries installed via Homebrew (`/opt/homebrew`), Cargo (`~/.cargo/bin`), Go, pipx, and NVM.
- **Prepend & Append Customization**: Configure command prefixes (e.g. `supermemory add`, `curl -s`, `ollama run llama3`) or suffixes (e.g. `| jq .`).

## Usage Examples

1. **AI Memory & Notes**: Set **Prepend Command** to `supermemory add` and select any text to instantly save it to your AI memory without leaving your app.
2. **Text Transformations**: Select `echo "hello world" | tr '[:lower:]' '[:upper:]'` with **Output Handling** set to *Paste* to replace your selection in place.
3. **Quick Math & Shell Tools**: Select `echo "scale=4; 355/113" | bc` to calculate and paste the result.
4. **Git Operations**: Select `git pull` or `git commit -am "update"` to run tasks silently in the background.

## Configuration

Configure in **OpenClip Preferences ▸ Actions ▸ Quick Shell**:

- **Output Handling**: Choose how to handle command stdout:
  - **Paste** *(default)*: Replaces your selection with the command's stdout (or shows a completion toast if stdout is empty).
  - **Copy**: Copies the output to the clipboard and shows a confirmation toast.
  - **Toast**: Displays the output in a transient toast notification.
  - **Discard**: Discards stdout, only notifying on completion.
- **Prepend Command**: Text inserted before the selected command (optional, e.g. `supermemory add`).
- **Append Command**: Text inserted after the selected command (optional, e.g. `| jq .`).
