# Harper

Proofread the selected text with [Harper](https://writewithharper.com/) — the free, open-source
grammar checker that runs **entirely on your Mac**. Nothing is uploaded, and a check typically
completes in well under a second.

## Actions

| Action | What it does |
| :--- | :--- |
| **Fix Writing** | Applies Harper's top suggestion for every issue and returns the corrected text (paste or copy, per your OpenClip preference). |
| **Check Writing** | Shows a toast with the number of issues Harper found, e.g. `Harper found 3 issues`. |
| **Copy Report** | Copies a detailed report (line, column, category, message, suggestions) to the clipboard. |
| **Add to Dictionary** | Appends the selected word to your Harper user dictionary, so Harper and `harper-ls` stop flagging it. Only offered when a single word is selected. |
| **Remove from Dictionary** | Deletes the selected word from your Harper user dictionary again. Also limited to single-word selections. |

**Fix Writing** understands all three of Harper's suggestion kinds — replace, insert, and remove —
and applies them from the end of the selection backwards, so character offsets stay correct with
multi-line text, accents, and emoji. Issues Harper reports without a suggestion are left untouched.

## Requirements

- OpenClip 1.1.0 or later.
- [Harper](https://writewithharper.com/) — install the CLI with `brew install harper`
  (or `cargo install --locked --git https://github.com/Automattic/harper.git harper-cli`).
  The extension looks for `harper-cli` in `/opt/homebrew/bin`, `/usr/local/bin`, `~/.cargo/bin`,
  and on `PATH`.
- `jq` — bundled with macOS 15 and later, otherwise `brew install jq`.

If either binary is missing, the action shows a toast telling you what to install instead of failing
silently.

## Options

- **English dialect** (`dialect`) — `american` (default), `british`, `canadian`, or `australian`.
  Passed to Harper as `--dialect`, so British spellings such as *colour* are not flagged when you
  pick `british`.

## Privacy

The selection is piped to the local `harper-cli` process on stdin and never leaves your machine.
Harper does no telemetry and needs no network access.

## Installation

From the root of this repository, run:

```sh
./scripts/install.sh raw/Harper.openclipext
```

## Usage

1. Select some prose anywhere on your Mac.
2. Open the OpenClip popup and choose **Harper**.
3. Pick **Fix Writing** to rewrite the selection, or **Check Writing** / **Copy Report** to review
   the issues first.

## Notes

- The user dictionary lives at `~/Library/Application Support/harper-ls/dictionary.txt`, the same
  file `harper-ls` uses in your editor.
- OpenClip decides which actions to show from the selection alone, so **Remove from Dictionary** is
  offered for any single word rather than only for words already in the dictionary. Picking it for a
  word that is not there just reports that, and changes nothing.
- OpenClip stores option values per action, so the dialect is read from the action you configured
  and reused by the other Harper actions.

## Credits

The icon is Harper's own logo, taken from
[`packages/obsidian-plugin/logo.svg`](https://github.com/Automattic/harper/blob/master/packages/obsidian-plugin/logo.svg)
in the [Automattic/harper](https://github.com/Automattic/harper) repository (Apache-2.0), recentred
into a square viewBox and left monochrome so it inherits the OpenClip theme colour.
