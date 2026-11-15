# Color Swatch

Shows a swatch for a hex color in the selected text.

## Features

- Recognizes `#RGB`, `#RGBA`, `#RRGGBB`, and `#RRGGBBAA`.
- Appears only when the selection contains a hex code.
- Expands shorthand values and keeps alpha. Transparent colors show a checkerboard behind the swatch.
- Opening the card leaves the clipboard alone. Copy (hex) and Save are explicit actions.

## Usage examples

| Selection | Result |
| :--- | :--- |
| `#ff8800` | 🟧 `#FF8800` in the card |
| `brand #f80` | 🟧 `#FF8800` in the card |
| `#ff880080` | A translucent swatch labeled `#FF880080` |
| `hello world` | No action for this selection |

## Requirements

OpenClip 1.10.0 or newer, because the extension uses typed inline color results.
