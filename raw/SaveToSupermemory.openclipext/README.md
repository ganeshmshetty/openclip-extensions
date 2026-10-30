# Save to Supermemory

Select text in any Mac app, choose **Save to Supermemory**, and it's added to your [Supermemory](https://supermemory.ai) memories.

## Features

- Saves the selection with `POST https://api.supermemory.ai/v3/documents`.
- Tags each memory with `metadata.source = "openclip"` plus the app name and bundle ID it came from.
- Optional container tag to keep OpenClip saves in their own space.
- Shows "Saved to Supermemory" on success, and a clear error for a missing or rejected key or a network problem.

## Configuration

1. Create an API key in the [Supermemory console](https://console.supermemory.ai).
2. Open this extension's settings in OpenClip and paste it into **API Key**. OpenClip stores it as a secret.
3. Optional: set **Container Tag** (letters, numbers, `-`, `_`, `.`; max 100 chars), e.g. `openclip`.

## Requirements

- A Supermemory account and API key.
- OpenClip 1.3.0 or later.

The selected text is sent to Supermemory. Your Supermemory account's limits apply.
