# Image Convert & Compress

Convert or compress an image file right from OpenClip, using the image tools built into macOS.

Select an image **file path** (for example by copying a file in Finder, or selecting a path in a
text field), open OpenClip, and pick a conversion. The new file is written next to the original,
and a native file card appears so you can drag it out, Copy File, Quick Look, or Save it.

## Actions

| Action | What it does |
| :--- | :--- |
| **Convert to JPEG** | Re-encodes as JPEG at 85% quality. |
| **Convert to PNG** | Re-encodes as lossless PNG. |
| **Convert to HEIC** | Re-encodes as HEIC (smaller than JPEG on modern Macs). |
| **Convert to TIFF** | Re-encodes as TIFF. |
| **Resize to 1600 px** | Scales the longest side down to 1600 px, keeping the format. |
| **Compress (JPEG 60%)** | Re-encodes as JPEG at 60% quality for a smaller file. |

Output files are named `<name>-<action>.<ext>` (`photo-compress.jpg`), and a numbered suffix is
added if that name already exists, so nothing is ever overwritten.

## Usage

1. Copy an image file in Finder, or select its path as text.
2. Open the OpenClip popup and choose **Convert Image**.
3. Pick the conversion you want; the converted file lands next to the original.

## Requirements

- OpenClip 1.7.0 or later.
- macOS. Conversions use `sips`, which ships with every Mac — nothing to install.

## Notes

- The selection must look like an image path; the action only appears for text ending in a known
  image extension (`.png`, `.jpg`, `.heic`, `.tiff`, `.webp`, and friends).
- `file://` URLs are accepted, and `~` expands to your home folder.
- WebP can be read but is not a writable output format, so converting *to* WebP is not offered.
