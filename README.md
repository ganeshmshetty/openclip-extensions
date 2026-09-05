# OpenClip Extensions

Guidelines and standards for authoring official and community extensions for [OpenClip](https://www.getopenclip.app).

> To browse or install extensions, visit the [Web Store](https://www.getopenclip.app/extensions) or open **OpenClip -> Preferences -> Store** in the app.

Refer to AGENTS.md for proper guidance on creating new extensions.
---

## Design Principles

Every OpenClip extension should feel like a first-class, native macOS feature:

1. **Focused & Single-Purpose**: Do one text action exceptionally well. Complex multi-step operations should be split into distinct actions or a grouped submenu (`type: "group"`).
2. **Instant & Non-Blocking**: Text transformations must execute in under 50ms. Any asynchronous or network-dependent action must declare `"async": true` and `"loading": true` with a clear progress message so the popup never freezes.
3. **Privacy by Default**: Selected text belongs to the user. Do not collect analytics, track usage, or transmit user selection data to third-party endpoints unless explicitly required by the action (e.g. translation or URL shortening).
4. **Native macOS Look & Feel**: Use Apple SF Symbols wherever possible. Match standard macOS typography and concise action titles.

---

## Quality & Manifest Guidelines

Extensions live in `raw/<Name>.openclipext/` with an `openclip.json` manifest. All extensions must adhere to the following standards:

### 1. Identity & Versioning
- **Identifier**: Must use a lowercase reverse-DNS format (e.g. `com.openclip.rot13` or `com.author.packagename`).
- **Semantic Versioning**: Start at `1.0.0`. Every PR modifying an existing extension must bump the version number (`1.0.1`, `1.1.0`, etc.).
- **Compatibility**: If using modern host APIs (like `openclip.pasteboard`), declare `"minOpenClipVersion": "1.3.0"`.

### 2. Localization
To provide a great experience worldwide, localize user-facing strings (`name`, `description`, action `title`, option labels) using language dictionary objects:
- Supported language tags: `en` (required baseline), `zh-Hans`, `zh-Hant`, `fr`, `ja`.
- Keep descriptions under 120 characters, focusing on what the action does to the selection.

### 3. Icon Standards
- **Preferred**: Standard Apple SF Symbol name (e.g. `"wand.and.stars"`, `"text.alignleft"`, `"character.bubble"`).
- **Custom SVG**: If an SF Symbol does not fit, provide an `icon.svg` inside the package folder. SVGs must be monochrome, clean vector paths, with a square viewBox (`16x16` or `32x32`).

### 4. Choosing the Right Runtime
- **`url`**: Best for search engines, map lookups, web translation, and URL schemes. Requires zero code.
- **`javascript`**: Best for text transformations, regex formatting, REST APIs (`openclip.fetch`), and clipboard manipulation (`openclip.pasteboard`). Runs in macOS JavaScriptCore.
- **`shell`**: Best for Unix CLI pipes, formatters, and scripts (`jq`, `curl`, `python3`). Runs without TCC automation prompts.
- **`applescript`**: Use only when controlling external macOS applications (e.g. Apple Notes, Reminders, Finder). Note that app automation may trigger macOS Automation (TCC) permission dialogs.

### 5. Security & Isolation
- Network requests in JavaScript must use `openclip.fetch(url, options)`. Requests to private networks, loopback addresses, and link-local IPs (SSRF protection) are blocked by the host.
- Script paths must stay strictly within the extension folder (no absolute paths or `../` path traversal).

---

## Tooling & Validation

Use the repository scripts under `scripts/` to create, test, and validate extensions:

```bash
# Scaffold a new extension
./scripts/create.sh Action --type js

# Test live in OpenClip (copies to ~/.openclip/extensions with ~2s hot reload)
./scripts/install.sh raw/Action.openclipext

# Validate manifest schema, script paths, and icons
./scripts/validate.sh raw/Action.openclipext

# Verify entire catalog
./scripts/validate.sh --all
```

---

## Submitting Extensions

1. Fork this repository.
2. Add your extension folder under `raw/<Name>.openclipext/`.
3. Verify that `./scripts/validate.sh raw/<Name>.openclipext` passes with zero errors.
4. Test that the action works as expected in OpenClip via `./scripts/install.sh`.
5. Open a Pull Request.

All pull requests run automated CI validation (`validate-pr.yml`). Once merged, your extension is automatically built, released, and published to the live OpenClip store.
