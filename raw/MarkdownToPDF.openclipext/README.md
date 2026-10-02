# Markdown & HTML to PDF

Turn selected Markdown or HTML into a clean PDF document, rendered by WebKit — the same engine
behind Safari — so files come out with real, selectable text.

Select your source, open OpenClip, and pick a converter. The PDF appears as a native file card,
ready to drag out, Copy File, Quick Look, or Save.

## Actions

| Action | Input |
| :--- | :--- |
| **Markdown → PDF** | Markdown source: headings, lists, quotes, fenced code, links, images, emphasis, and horizontal rules. |
| **HTML → PDF** | A full HTML document or a fragment. Fragments are wrapped in a readable default stylesheet. |

Headings, ordered and unordered lists, blockquotes, fenced code blocks, inline code, links,
images, strikethrough, and `---` rules are all rendered. Code keeps a monospaced style, and long
lines wrap instead of clipping.

## Usage

1. Select the Markdown or HTML source.
2. Open the OpenClip popup and choose **Convert to PDF**.
3. Pick **Markdown → PDF** or **HTML → PDF**; the PDF appears as a file card.

## Requirements

- OpenClip 1.7.0 or later.
- macOS. Rendering uses WebKit, which ships with every Mac — nothing to install.

## Notes

- The page is a single continuous page sized to the content, so nothing is split across awkward
  page breaks.
- For HTML input, a document containing `<html>` is used as-is; a fragment is wrapped in the
  built-in stylesheet.