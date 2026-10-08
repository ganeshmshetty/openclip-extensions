# HTML Entities

Encode or decode HTML special character entities.

## Features

- **HTML Encode**: Converts special characters (`&`, `<`, `>`, `"`, `'`) into safe HTML entity equivalents (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).
- **HTML Decode**: Decodes named entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;`) and numeric entities (decimal `&#...;` and hexadecimal `&#x...;`) back to raw characters.
- **Smart Activation**: HTML Decode automatically activates whenever the selected text contains entity strings (`&...;`).
- **Local & Offline**: Runs entirely in OpenClip's native JavaScriptCore engine with zero network calls.

## Usage

1. Select raw text containing characters to escape, or escaped HTML markup.
2. Trigger **HTML Entities** from OpenClip.
3. Choose **HTML Encode** or **HTML Decode** to transform the text in-place.
