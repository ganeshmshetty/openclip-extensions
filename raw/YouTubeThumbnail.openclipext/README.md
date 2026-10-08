# YouTube Thumbnail

Download the full-resolution cover image of any YouTube video straight from OpenClip.

Select a YouTube link (or just the video ID) anywhere on your Mac, open OpenClip, and run
**Thumbnail**. The image is downloaded at the highest available resolution (`maxresdefault`,
falling back to HD when the video has no max-resolution image) and shown as a native file card —
drag it out, Copy File, Quick Look, or Save it. Downloads land in your **Downloads** folder when
it exists.

Accepted link formats include `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/embed/…`,
`/live/…`, and a bare 11-character video ID.

## Usage

1. Select or copy a YouTube link.
2. Open the OpenClip popup and run **Thumbnail** — the image appears as a file card.

## Requirements

- OpenClip 1.7.0 or later.
- An internet connection. Downloads use `curl`, which ships with every Mac.

## Notes

- Not every video has a max-resolution thumbnail; the action silently falls back to the HD image.
- Existing files are never overwritten — a numbered suffix is added instead.
