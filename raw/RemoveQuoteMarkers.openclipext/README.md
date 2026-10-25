# Remove Quote Markers

Clean up quoted email text by removing the `>` markers at the start of each line.

## Features

- **Nested quotes**: handles `>>`, `> >` and deeper levels in one go.
- **Keeps the text**: only the leading markers (and the single space after each) are removed; `>` signs elsewhere in a line are left alone.
- Shows up only when the selection has lines starting with `>`.

## Requirements

- OpenClip 1.1.0 or later.
