# Refine

Open selected text in [Refine](https://refine.sh) to check grammar or rewrite it in the floating editor. For example, select a draft email and choose **Open in Refine** to review it before sending.

## Requirements

- OpenClip 1.1.0 or later.
- Refine installed, with its initial setup completed and writing features configured.

The extension has no settings. Writing checks and rewrites use your existing Refine configuration.

## Installation

From the root of this repository, run:

```sh
./scripts/install.sh raw/Refine.openclipext
```

Enable the extension in OpenClip when prompted. If the action does not appear, reload extensions in OpenClip or quit and reopen it.

## Usage

1. Select text in an app or on a webpage.
2. Choose **Open in Refine** from OpenClip.
3. Review or rewrite the text in Refine, then use **Copy** or **Paste** when ready.

Opening another selection replaces the current contents of Refine's floating editor. Save or copy any edits you want to keep first.

If Refine was closed, the extension can launch it with the text, but Refine may not return to the original app for Paste. Use Copy, return to the source app, and paste manually. Use Copy for text selected on a webpage or another read-only surface too.

OpenClip can use clipboard text when invoked without a live selection. The action is unavailable for empty or whitespace-only input. Clicking the action opens Refine for review; replacing text is a separate step you control.

## Development

This is a URL action using Refine's existing editor link. OpenClip encodes the selected text for the URL. No build step or script runtime is required.

Validate the package from the repository root:

```sh
./scripts/validate.sh raw/Refine.openclipext
```
