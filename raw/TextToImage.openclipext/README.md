# Text to Image

Turn any selection into a clean, shareable image — perfect for code snippets, quotes, config
values, or anything you want to drop into a chat, slide, or doc.

Select text or code anywhere, open OpenClip, and choose **Text to Image**. A PNG card is rendered
and shown as a native file card, so you can drag it out, Copy File, Quick Look, or Save it.

## Actions

| Action | Look |
| :--- | :--- |
| **Dark Card** | Dark background with a subtle three-dot window bar. |
| **Light Card** | White background with a light three-dot window bar. |

Text is shown in a monospaced font with wrapping, so long lines stay inside the card. The image is
rendered at retina resolution.

## Usage

1. Select the text or code you want to share.
2. Open the OpenClip popup and choose **Text to Image**.
3. Pick **Dark Card** or **Light Card**; the image appears as a file card.

## Requirements

- OpenClip 1.7.0 or later.
- macOS. Rendering uses WebKit, which ships with every Mac — nothing to install.

## Notes

- The card is generated at 480 pt wide and grows to fit the content height.
- No text is modified — it is rendered exactly as selected.
