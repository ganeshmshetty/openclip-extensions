# TickTick

Capture the text you are reading as a task in [TickTick](https://ticktick.com) without breaking focus. Select a phrase, sentence, or paragraph anywhere on your Mac and trigger **Add to TickTick**. The task is created through TickTick's native URL scheme, so there is nothing to sign in to or configure inside OpenClip.

## Features

- **One-click capture**: Turn the selected text into a TickTick task from Mail, Slack, Safari, or any other app.
- **List, tags, and priority**: File the task in the right list and attach tags and a priority automatically.
- **All-day date**: Optionally schedule the task for today or tomorrow.
- **Title and notes**: Keep the whole selection as the title, or use the first line as the title and put the rest in the task's notes.

## Usage

Select text and run **Add to TickTick**. TickTick opens with the task already added.

TickTick accepts relative dates in task titles. Selecting `Call mom tomorrow 3pm` creates a timed task for tomorrow at 3pm, even when the Date option is set to None.

## Configuration

Configure the extension under *OpenClip Settings → Actions → TickTick*:

| Option | Default | Description |
| :--- | :--- | :--- |
| **List** | *(empty)* | Exact name of an existing TickTick list, for example `Work`. Leave empty to file the task in the Inbox. |
| **Tags** | *(empty)* | Comma-separated tags, for example `follow-up, waiting`. |
| **Priority** | `none` | `none`, `low`, `medium`, or `high`. |
| **Date** | `none` | `none`, `today`, or `tomorrow`. Adds an all-day date to the task. |
| **First line as title** | Off | When on, the first non-empty line becomes the task title and the remaining lines become the task notes. |

## Examples

- Highlight **"Review Q3 marketing budget"** in an email and add it to the `Work` list with high priority and the `finance` tag.
- Select a meeting note paragraph, turn on *First line as title*, and keep the details in the task notes.
- Select **"Draft launch email"** and schedule it for tomorrow with the Date option.

## How It Works

The extension uses TickTick's `ticktick://x-callback-url/v1/add_task` URL scheme. Everything happens between OpenClip and the local TickTick app; no account credentials, API tokens, or network requests are involved. Your selection is never sent anywhere except to TickTick itself.

## Requirements

- macOS with [TickTick for Mac](https://ticktick.com/download) installed and signed in. The web app alone does not register the `ticktick://` URL scheme.
- OpenClip 1.1.0 or later.

## Troubleshooting

- **Nothing happens on click**: Make sure the TickTick desktop app is installed. If macOS asks whether to allow OpenClip to open TickTick, choose **Allow**.
- **The task lands in the Inbox**: Check that the List option matches the exact name of a list in TickTick.
- **The date is off by a day**: TickTick renders dates in your TickTick account's time zone. Set the account time zone to match your Mac if they differ.

## Credits

Icon from [Simple Icons](https://simpleicons.org/) (`simple-icons:ticktick`), recoloured to `currentColor` for OpenClip themes. TickTick is a trademark of its respective owner.
