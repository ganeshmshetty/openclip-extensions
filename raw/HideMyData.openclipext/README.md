# HideMyData

Redact selected text locally, review the result, and correct missed or unwanted redactions before copying. Requires macOS 14+ and OpenClip 1.3.1+.

## Actions

**Redact personal data** opens a native review window with the original selection and proposed result. It does not edit the source app. Click **Copy redacted text** after reviewing, then paste into your destination.

**Redact entire selection** returns `[REDACTED]` for the entire selection. OpenClip's configured delivery preference determines whether that action previews, pastes or copies its result.

## Review controls

- Select missed text in **Original**, then click **Redact selected text**. The phrase is redacted everywhere in the selection, ignoring case and allowing whitespace differences.
- Enter a phrase under **Custom redaction**, or enable **Regular expression** for an ICU pattern such as `CLIENT-\d{4}`. Enter patterns without JavaScript `/.../` delimiters; custom matching is case-insensitive.
- Enable **Remember this rule** before adding a rule to apply it to future selections. Otherwise it lasts only in the current window. Choose a rule in the dropdown and use **Remove rule** to delete it, including its saved copy.
- Select incorrectly redacted text in **Original**, then click **Restore selected text**. Only the selected occurrence or portion is restored. **Reset restorations** reapplies detection. These overrides are never persisted.
- Toggle detection of names, places and organizations if those matches are unwanted.

## Detection

Uses 43 HideMyData regex patterns, macOS NaturalLanguage entity recognition, system date/address detection, and validated multiline US address blocks. Coverage includes emails, phones, bank details, several national ID formats, street addresses, URLs, network addresses and token formats. Repeated identical values receive consistent placeholders within each result; overlapping ranges are combined before replacement.

Automatic detection can miss personal information and over-redact ordinary text. Review every result. This does not include an OpenMed/MLX model. Name recognition depends on system language support; address detection is not comprehensive worldwide.

Selections are limited to 50,000 UTF-16 code units. Custom rules are limited to 2,000 code units. Invalid, empty-matching or nonmatching custom rules are rejected; slow regex matching is interrupted. A failed detection does not produce a copyable result.

## Privacy and storage

The extension contains no network requests, telemetry, API keys or model downloads. It does not write selected documents to disk or log them. The launcher receives OpenClip's selection through its environment/stdin and transfers it to the review app using a unique named macOS pasteboard, released immediately after the app reads it. The general clipboard changes only when the user copies a result. Original text remains visible in the review window until it is closed.

Only explicitly remembered rules are stored, in `~/Library/Application Support/HideMyData OpenClip/rules.json`. The directory is created with mode 0700 and the file with 0600. The file is plaintext and can contain sensitive phrases; remove remembered rules through the review window when no longer needed. No saved rules or user documents are part of this package. Demo and test fixtures are synthetic. Demo mode neither loads nor saves real rules.

## Native companion and packaging

`redact.sh` launches the included universal `HideMyData Review.app` (Apple Silicon and Intel). It returns after the window launches; the review window runs as a separate app, so the user's review is not held open inside OpenClip's script execution. The companion needs no Accessibility or Automation permission of its own because it copies reviewed output rather than editing another app.

Complete Swift source is included under `Source/`, along with a build script and tests. The checked-in companion is ad-hoc signed, not notarized. The catalog's current Linux publication workflow archives package contents without compiling Swift, so the universal companion is included to make the installed package runnable without developer tools. Maintainers can rebuild it on macOS using the commands below and review native-binary distribution before accepting the extension.

## Build and test

Requires Apple's macOS SDK and command-line tools:

```sh
./script/test.sh
./script/build.sh
open -n 'HideMyData Review.app' --args --demo
```

The build compiles both architectures, embeds generic source paths, stages the app, and applies an ad-hoc signature. Compiler scratch directories are disposable. Tests use temporary rule storage and never read or change real saved rules.

From the catalog root, validate the package with:

```sh
./scripts/validate.sh raw/HideMyData.openclipext
```

## License

GPL-3.0-only; see `LICENSE`. Pattern definitions are derived from the GPL version 3 HideMyData project. The extension engine, native review UI and build/test scripts are provided with full source under the same license.
