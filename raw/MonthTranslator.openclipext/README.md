# Month Translator

Select a month name and see it translated between your two languages, right inside the OpenClip popup. Works fully offline and instantly.

## Features

- **Bi-directional**: Pick two languages. A month written in language A shows in language B, and a month written in language B shows in language A. With Czech and English: `srpna` → **`August`**, and `August` → **`srpen`**.
- **Any Other Language Too**: A month from any third language shows in language A, for example Polish `w sierpniu` → **`srpen`** for a Czech user.
- **Live Inline Results**: The popup bar button shows the translation as soon as you select, no click needed.
- **Any Language, Any Dialect**: Month names for 665 locales from Unicode CLDR, including regional variants such as Austrian `Jänner` or Brazilian Portuguese, and scripts from Cyrillic to Chinese (`八月`, `8月`).
- **Every Word Form**: Understands inflected and derived forms, not just the dictionary entry: `srpen`, `srpna`, `v srpnu`, `srpnový`, `w sierpniu`, `sierpniowy`, `в августе`, `августовский`, `tammikuussa`.
- **Forgiving Matching**: Casing, missing diacritics and surrounding punctuation are ignored, so `Unora`, `ZÁŘÍ`, `pazdziernik` and `„březen“` all work. Standard abbreviations (`Dez.`, `janv.`, `ago.`, `Aug`, `srp`) are recognised too.
- **Dates and Ranges**: A short date such as `5. srpna 2024` resolves to its month, and `srpen únor` shows `August / February`.
- **Smart Disambiguation**: A word that names different months in different languages (`listopad` is October in Croatian and November in Czech or Polish) follows your configured languages first.
- **Copy or Paste**: Click to paste the translation into your current app, or right-click to copy it to your clipboard.

## Examples

With language A = `cs` and language B = `en`:

- Select `ve srpnu` → Displays **`August`** inline.
- Select `August` → Displays **`srpen`** inline.
- Select `sierpniowy` → Displays **`srpen`** inline.
- Select `八月` → Displays **`srpen`** inline.

With language A = `cs` and language B = `de-AT`:

- Select `leden` → Displays **`Jänner`** inline.
- Select `Jänner` → Displays **`leden`** inline.

## Configuration

- **Language A**: A BCP-47 language tag such as `cs`, `de-AT`, `pt-BR` or `zh-Hans`. Leave empty to use the OpenClip app language.
- **Language B**: The other language of the pair, default `en`.

## Notes

- The button appears for selections of up to four words. Very short words that happen to be month abbreviations in some language (for example `may`, `mar` or the Czech `pro`) are recognised as months as well.
- Month data comes from Unicode CLDR 48 and is bundled with the extension, so nothing is sent anywhere.
