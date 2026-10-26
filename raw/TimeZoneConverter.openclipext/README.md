# Time Zone Converter

Instantly convert selected times across world time zones directly inline inside the OpenClip popup bar and search palette.

## Features

- **Live Inline Results**: See converted times instantly in the popup bar button before clicking.
- **Smart Time Detection**: Recognizes 12-hour and 24-hour formats with timezone abbreviations (e.g. `3pm ET`, `15:30 UTC`, `9:00 am PT`, `10am CET`, `8:30pm GST`).
- **Curated Top Global Zones**: Covers major regional hubs (`UTC`, `Local`, `ET`, `CT`, `MT`, `PT`, `GMT`, `CET`, `GST`, `IST`, `SGT`, `JST`, `KST`, `AEST`, `NZST`). Automatically handles standard vs daylight savings without confusing duplicate abbreviations.
- **Flexible Options**: Configure your default target time zone, choose between 12h and 24h formats, and optionally display date shift indicators (`+1d`, `Fri`).
- **One-Click Paste or Copy**: Click the inline button to paste the converted time directly into your active app, or right-click / Shift-click to copy it to the clipboard.

## Options

Configure options under *Preferences → Actions → Time Zone Converter*:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Source Time Zone** | Picker | `UTC` | Zone assumed when the selected time names no zone or offset (`UTC`, `ET`, `CT`, `MT`, `PT`, `GMT`, `CET`, `GST`, `IST`, `SGT`, `JST`, `KST`, `AEST`, `NZST`). A zone in the text (`12:00 UTC`, `3 PM EST`, `UTC+5:30`, `Asia/Kolkata`) always wins. |
| **Target Time Zone** | Picker | `Local` | Destination time zone (`Local` = your Mac's zone, shown by its abbreviation such as `IST`, `UTC`, `ET`, `CT`, `MT`, `PT`, `GMT`, `CET`, `GST`, `IST`, `SGT`, `JST`, `KST`, `AEST`, `NZST`). |
| **Time Format** | Picker | `12h` | Display format (`12h` or `24h`). |
| **Include Date Shift** | Toggle | `false` | When enabled, shows weekday or date shift indicators (`+1d`, `Fri`). |

## Usage Examples

- Select `3:00 PM ET` → Displays `7:00 PM UTC`
- Select `15:30 UTC` → Displays `8:30 AM PT`
- Select `10:00 CET` → Displays `4:00 AM ET`
- Select `2:00 PM GST` → Displays `3:30 PM IST`

## Requirements

- OpenClip 1.1.0 or later.

