# Linear Issue

Turn selected text into a Linear issue. The first line becomes the title and everything after it becomes the description.

## Features

- Creates the issue through Linear's API, copies the issue link, and shows the issue ID (like `ENG-123`).
- No API key? It opens Linear's new-issue page with the title and description already filled in.

## Configuration

- **API Key**: a personal API key from Linear **Settings → Security & access → Personal API keys**. Stored as a secret.
- **Team Key**: the short team key, like `ENG`. Leave empty to use your first team.

## Requirements

- A Linear account.
- OpenClip 1.3.0 or later.

The selected text is sent to Linear to create the issue.
