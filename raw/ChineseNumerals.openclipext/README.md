# Chinese Numerals

Convert a selected number into Chinese uppercase (大写) numerals — the anti-fraud script used on cheques, invoices, and contracts.

## Features

- **Live preview**: The converted text appears right in the popup bar as soon as you select a number.
- **Two styles** (choose in the extension's settings): *RMB amount* (default) uses 元 / 角 / 分 and the closing 整; *Plain number* reads digit by digit with 点 for the decimal point.
- **Exact arithmetic**: Works on the digits as text, so large values never lose precision. Up to 16 integer digits (through 兆).
- **Tolerant input**: Accepts `¥`/`￥`, thousands separators (`,` or `，`), a trailing 元/块/圆, and negative numbers.
- Only appears when the selection looks like a number.

## Usage Examples

Select a number and the result shows inline. Click to paste it, or right-click to copy.

| Selection | RMB amount | Plain number |
| :--- | :--- | :--- |
| `1234.5` | 壹仟贰佰叁拾肆元伍角整 | 壹仟贰佰叁拾肆点伍 |
| `¥100.05` | 壹佰元零伍分 | 壹佰点零伍 |
| `10001` | 壹万零壹元整 | 壹万零壹 |
| `0.55` | 伍角伍分 | 零点伍伍 |
| `-12.3` | 负壹拾贰元叁角整 | 负壹拾贰点叁 |

## Notes

- RMB amount rounds half up to the nearest fen (`1.999` → 贰元整).
- Plain number keeps every decimal digit as typed.
