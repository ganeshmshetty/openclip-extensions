# Quick Translate

Translate selected text instantly into your chosen language with automatic source language detection.

## Features

- **Keyless Translation**: No API keys required. Automatically cascades across multiple free translation endpoints (Google gtx, Chrome dictionary, LibreTranslate, SimplyTranslate, and Lingva).
- **Auto Source Detection**: Detects the original language automatically.
- **Second Language**: Right-click or ⇧-click translates into an optional second language.
- **Customizable Target Language**: Choose your translation target from 47 supported languages, listed alphabetically by full name in settings.

## Configuration

Configure in **OpenClip Preferences ▸ Actions ▸ Quick Translate**:

- **Translate to**: Select your desired target language from the alphabetical list (Arabic … Vietnamese, including new additions such as Kannada, Kashmiri (Koshur), Punjabi, Marathi, Filipino and Swahili). Default is `English`.
- **Second Language**: Optional, default `None`. When set, a right-click or ⇧-click translates into this language instead of the main one (if the text is already in the second language, it goes to the main target). With `None`, secondary click works exactly as before.
- **If text is already in target language**: What happens when the selection is already in the chosen target language — **Keep target language** (default: translate into the target as usual), **Translate to English instead** (e.g. Danish text with target Danish comes back as English), or **Translate to second language** (uses the Second Language; does nothing extra if it's `None`).

## Usage Examples

- Select `"Bonjour tout le monde"` → Translates to `"Hello everyone"`.
- Target **Danish**, default option: select English text → Danish; select Danish text → Danish.
- Target **Danish**, with **Translate to English instead**: select Danish text → English.
- Target **English**, Second Language **Hindi**: right-click French text → Hindi; right-click Hindi text → English.
- Target **English**, Second Language **Hindi**, with **Translate to second language**: select English text → Hindi; select Spanish text → English.

Note: "already in target language" detection relies on the Google gtx backend; if it's unavailable and a fallback backend answers, the selection is translated into the chosen language without the swap.
