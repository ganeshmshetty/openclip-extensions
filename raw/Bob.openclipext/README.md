# Bob for OpenClip

Select text, click **Translate with Bob**, and read the translation in Bob's window near your pointer. Your existing Bob translation services and preferences remain in use.

## Requirements

- macOS with OpenClip **1.3.1 or later**.
- [Bob](https://bobtranslate.com/), Mac App Store edition, installed separately. The `request` interface requires Bob 1.5.0 or later; tested with Bob **1.20.0** and OpenClip **1.3.1**.
- OpenClip's Accessibility permission for text selection. On first use, allow OpenClip to control Bob in the macOS Automation prompt.

## Install

Download `Bob.openclipext.zip` from the [independent project's releases](https://github.com/s010s/openclip-bob/releases). Extract it and copy the entire `Bob.openclipext` directory into `~/.openclip/extensions/`. Reload or restart OpenClip, then enable **Translate with Bob** in Actions. OpenClip's Install File command can also import the ZIP.

If you installed the early local prototype (`local.openclip.bob`), remove that prototype in OpenClip before enabling this release to avoid duplicate buttons. The permanent identifier is `io.github.s010s.openclip.bob`.

## What it does

The AppleScript receives `OPENCLIP_TEXT`, JSON-encodes the text, and calls Bob's documented `translateText` request with `windowLocation: "mouse"`. It returns an empty string so OpenClip does not paste Bob's API response into your document. No build tools or translation API keys are required by the extension.

## Privacy

The extension sends the selected text to the installed Bob app through local Apple Events. It does not make network requests, collect analytics, store selected text, or read/write the clipboard. Bob may send text to the translation services you have configured. Their requirements and charges remain separate.

## Troubleshooting

- **No button:** reload or restart OpenClip and enable the extension in Actions.
- **Automation denied / error -1743:** allow OpenClip to control Bob in System Settings → Privacy & Security → Automation.
- **Bob not found:** install the Mac App Store edition with bundle identifier `com.hezongyidev.Bob`.

## Source and support

[Source, releases, and issues](https://github.com/s010s/openclip-bob) · [Bob integration documentation](https://bobtranslate.com/guide/integration/applescript.html)

The integration code is MIT licensed. The bundled Bob icon is adapted from the official Bob–PopClip integration and distributed under GPL-3.0; see [third-party attribution](THIRD_PARTY_NOTICES.md). No PopClip integration code is copied. This independent integration is not affiliated with or endorsed by Bob or OpenClip.
