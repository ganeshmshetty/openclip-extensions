# Things 3

Seamlessly capture tasks into [Things 3](https://culturedcode.com/things/) from any selected text on macOS.

Select text in any application, trigger **Things 3**, and instantly file a to-do in your Inbox, schedule it for Today, or pop open the Quick Entry dialog to add tags and projects.

## Actions

| Trigger | Action | Behavior |
| :--- | :--- | :--- |
| **Left-Click** (Primary) | **Quick Add** | Immediately creates a new to-do in your configured destination (*Inbox*, *Today*, *Evening*, *Tomorrow*, or *Someday*) in the background without interrupting your flow. |
| **Right-Click / ⇧-Click** (Secondary) | **Quick Entry** | Launches Things' native Quick Entry dialog pre-filled with the title, notes, and tags, letting you review or adjust details before saving. |

## Options

Configure options under *Preferences → Actions → Things 3*:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Schedule for** (`when`) | Picker | `inbox` | Destination list: `inbox`, `today`, `evening`, `tomorrow`, or `someday`. |
| **First line as title** (`splitNotes`) | Toggle | `false` | When enabled, uses the first line of multi-line selections as the task title and places remaining lines into notes. |
| **Project or Area** (`list`) | String | *(empty)* | Optional target Project or Area title (e.g. `Work` or `Personal`). |
| **Tags** (`tags`) | String | *(empty)* | Optional comma-separated tags to automatically attach (e.g. `Follow-up, OpenClip`). |

## Usage Examples

- **Quick Capture**: Highlight a phrase like "Review Q3 marketing budget" in an email and click **Things 3** to file it into your Inbox.
- **Interactive Review**: Highlight meeting notes or an action item, right-click **Things 3**, and use the Quick Entry popup to assign a project and due date before hitting `⌘ + Return`.
- **Note Splitting**: Turn on "First line as title" to convert structured text (e.g., bug reports or task summaries) into a clean title with full details in the notes field.

## Privacy & Local Execution

- All actions communicate directly with Things 3 on your Mac via the local `things:///` URL scheme.
- No text is uploaded to any server, cloud service, or third party.

## Requirements

- macOS with [Things 3](https://culturedcode.com/things/) installed.
- Ensure Things URLs are enabled in Things (*Things → Settings → General → Enable Things URLs*).
- OpenClip 1.1.0 or later.

## Credits

Icon from [Simple Icons](https://simpleicons.org/) (`simple-icons:things`), recoloured to `currentColor` to adapt to OpenClip light/dark themes. Things is a trademark of Cultured Code GmbH & Co. KG.
