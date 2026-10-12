# Proofread

Fix spelling and grammar, or polish the wording of the selected text, using any Anthropic-compatible `/v1/messages` endpoint: the Claude API directly, or a local gateway that routes to other models.

## Features
- **Click**: fixes errors and polishes the wording, then replaces the selection.
- **Right-click or ⇧-click**: fixes spelling, grammar and punctuation only, with minimal edits; the result is copied to the clipboard.
- Keeps the original language (Chinese, English or mixed), line breaks, Markdown, code, URLs and technical terms.
- Shows a progress indicator while waiting; click it to cancel.

## Configuration
| Option | Default | Notes |
| --- | --- | --- |
| API endpoint | `https://api.anthropic.com/v1/messages` | Full path including `/v1/messages`. Local gateways work on ports 1024 and above. |
| API key | (required) | Stored in OpenClip's secret store, not in the manifest. |
| Model | `claude-haiku-5-5` | Any model name your endpoint accepts. |
| Thinking | On | Claude models only. On = adaptive thinking; off = no up-front thinking. |
| Effort | `low` | Claude models only. `model default` sends no effort and uses the model's own default. |
| Token budget | `4000` | `max_tokens` for each request; thinking counts toward it. Selections longer than about 75% of the budget (in characters) are rejected up front. |

Thinking and effort are sent only when the model name contains `claude`. If the model rejects a combination (for example, a model that cannot turn thinking off), the request is retried once without that setting.

## Usage Examples
- `Their going too recieve the the package tomorow.` → `They're going to receive the package tomorrow.`
- `Plus some keywords examples` → `Plus some keyword examples` (fix only)
