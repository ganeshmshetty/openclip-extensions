# Clean Em Dashes

Tame AI-generated text by replacing excessive em-dashes (`—`) with natural punctuation.

Large language models (such as ChatGPT and Claude) frequently overuse em-dashes in prose, articles, and emails. **Clean Em Dashes** instantly cleans up highlighted text, replacing awkward dashes with fluent commas, parentheses, or hyphens while preserving sentence flow and whitespace.

## Features

- **Intelligent Parenthetical Handling**: Automatically detects paired parenthetical dashes (`— like this —`) and transforms them into natural commas (` , like this, `) or parentheses.
- **Natural Connectors**: Smoothly converts standalone dashes before explanations or afterthoughts into standard commas.
- **Punctuation Collision Prevention**: Automatically cleans up redundant spaces, duplicate commas, and dashes colliding with existing periods or question marks.
- **List Preservation**: Neatly converts lines starting with em-dash bullet points (`— Item`) into standard markdown bullets (`- Item`).
- **Protected Number Ranges**: Safely leaves numeric en-dash ranges (such as `1990–2000` or `pp. 15–20`) untouched.

## Options

Customize transformation behavior under *OpenClip Preferences → Actions → Clean Em Dashes*:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Replacement style** (`style`) | Picker | `commas` | Target punctuation style: `commas`, `parentheses`, `hyphens`, or `remove`. |
| **Clean spaced en-dashes** (`cleanEnDashes`) | Toggle | `true` | When enabled, also cleans spaced en-dashes (` – `) often used as em-dash substitutes. |
| **Clean double hyphens** (`cleanDoubleHyphens`) | Toggle | `true` | When enabled, also cleans raw double hyphens (`--`). |

## Usage Examples

- **Commas (Default)**:
  - *Before*: `The new release — announced yesterday — delivers faster speeds.`
  - *After*: `The new release, announced yesterday, delivers faster speeds.`
- **Parentheses Style**:
  - *Before*: `The team — led by veteran engineers — completed the audit.`
  - *After*: `The team (led by veteran engineers) completed the audit.`
- **Standalone Explanation**:
  - *Before*: `There is only one issue — the build failed.`
  - *After*: `There is only one issue, the build failed.`
- **Bullet Points**:
  - *Before*: `— Feature A\n— Feature B`
  - *After*: `- Feature A\n- Feature B`

## Privacy & Local Execution

- All text transformations run 100% locally on your Mac inside OpenClip's JavaScriptCore runtime.
- No text is uploaded to any server, cloud service, or third party.
