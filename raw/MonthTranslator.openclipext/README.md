# Month Translator

Select a month name written in any language and see it in your own language, right inside the OpenClip popup. Works fully offline and instantly.

## Features

- **Live Inline Results**: The popup bar button shows the translation as soon as you select, for example `srpna` → **`August`**, no click needed.
- **Any Language, Any Dialect**: Month names for 665 locales from Unicode CLDR, including regional variants such as Austrian `Jänner` or Brazilian Portuguese, and scripts from Cyrillic to Chinese (`八月`, `8月`).
- **Every Word Form**: Understands inflected and derived forms, not just the dictionary entry: `srpen`, `srpna`, `v srpnu`, `srpnový`, `w sierpniu`, `sierpniowy`, `в августе`, `августовский`, `tammikuussa`.
- **Forgiving Matching**: Casing, missing diacritics and surrounding punctuation are ignored, so `Unora`, `ZÁŘÍ`, `pazdziernik` and `„březen“` all work. Standard abbreviations (`Dez.`, `janv.`, `ago.`, `srp`) are recognised too.
- **Dates and Ranges**: A short date such as `5. srpna 2024` resolves to its month, and `srpen únor` shows `August / February`.
- **Smart Disambiguation**: A word that names different months in different languages (`listopad` is October in Croatian and November in Czech or Polish) resolves to your app language when it is a candidate, otherwise all candidates are listed.
- **Copy or Paste**: Click to paste the translation into your current app, or right-click to copy it to your clipboard.

## Examples

- Select `ve srpnu` → Displays **`August`** inline.
- Select `sierpniowy` → Displays **`August`** inline.
- Select `Jänner` → Displays **`January`** inline.
- Select `八月` → Displays **`August`** inline.
- With target language `de-AT`, select `leden` → Displays **`Jänner`** inline.

## Configuration

- **Target language**: A BCP-47 language tag such as `en`, `de-AT`, `pt-BR` or `zh-Hans`. Leave empty to use the OpenClip app language.
- **Source languages**: Optional comma-separated language codes (for example `cs, sk`) to only recognise months from those languages. Leave empty to detect any language.

## Notes

- The button appears for selections of up to four words. Very short words that happen to be month abbreviations in some language (for example `may`, `mar` or the Czech `pro`) are recognised as months as well.
- Month data comes from Unicode CLDR 48 and is bundled with the extension, so nothing is sent anywhere.
