# YouTube Thumbnail Grabber

Download the cover image of any YouTube video straight from OpenClip.

Select a YouTube link (or just the video ID) anywhere on your Mac, open OpenClip, and pick a
resolution. The thumbnail is downloaded and shown as a native file card — drag it out, Copy File,
Quick Look, or Save it. Downloads land in your **Downloads** folder when it exists.

## Actions

| Action | Image | Size |
| :--- | :--- | :--- |
| **Max Resolution** | `maxresdefault` | Up to 1280×720, falls back to HD if the video has no max-res image |
| **HD (720p)** | `hqdefault` | 480×360 |
| **Medium (480p)** | `mqdefault` | 320×180 |

Accepted link formats include `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/embed/…`,
`/live/…`, and a bare 11-character video ID.

## Usage

1. Select or copy a YouTube link.
2. Open the OpenClip popup and choose **YouTube Thumbnail**.
3. Pick **Max Resolution**, **HD**, or **Medium** — the image appears as a file card.

## Requirements

- OpenClip 1.7.0 or later.
- An internet connection. Downloads use `curl`, which ships with every Mac.

## Notes

- Not every video has a max-resolution thumbnail; the action silently falls back to the HD image.
- Existing files are never overwritten — a numbered suffix is added instead.
