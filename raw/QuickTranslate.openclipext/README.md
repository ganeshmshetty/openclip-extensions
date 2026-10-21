# Quick Translate

Translate selected text instantly into your chosen language with automatic source language detection.

## Features

- **Keyless Translation**: No API keys required. Automatically cascades across multiple free translation endpoints (Google gtx, Chrome dictionary, LibreTranslate, SimplyTranslate, and Lingva).
- **Auto Source Detection**: Detects the original language automatically.
- **Secondary Language (Right-click / ⇧-click)**: Right-click or ⇧-click translates into an optional second language.
- **Customizable Target Language**: Choose your translation target from 47 supported languages, listed alphabetically by full name in settings.

## Configuration

Configure in **OpenClip Preferences ▸ Actions ▸ Quick Translate**:

- **Primary Language (Click)**: Select your desired target language from the alphabetical list (Arabic … Vietnamese, including new additions such as Kannada, Kashmiri (Koshur), Punjabi, Marathi, Filipino and Swahili). Default is `English`.
- **Secondary Language (Right-click / ⇧-click)**: Optional, default `None`. When set, a right-click or ⇧-click translates into this language instead of the main one With `None`, secondary click works exactly as before.
- **If text is already in that language**: Two choices, applied to both clicks:
  - **Keep as is** (default): always translate into the clicked language.
  - **Switch to the other language**: a click on text already in the primary language translates it to the secondary; a right-click/⇧-click on text already in the secondary translates it to the primary. Behaves like Keep as is when Secondary Language is `None`.

  Migration from 1.3.x: `Keep target language` → Keep as is; `Translate to second language` and `Translate to English instead` → Switch to the other language (Keep as is if no Secondary Language is set). To keep the old "Translate to English instead" result, set Secondary Language to English.

## Usage Examples

- Select `"Bonjour tout le monde"` → Translates to `"Hello everyone"`.
- Target **Danish**, default option: select English text → Danish; select Danish text → Danish.
- Target **English**, Secondary Language **Hindi**: right-click French text → Hindi; right-click Hindi text → Hindi (Keep as is).
- Target **English**, Secondary Language **Hindi**, with **Switch to the other language**: click English text → Hindi; right-click Hindi text → English; click Spanish text → English.

Note: "already in target language" detection relies on the Google gtx backend; if it's unavailable and a fallback backend answers, the selection is translated into the chosen language without the swap.
