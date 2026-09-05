# Leafy

Adds four actions for [Leafy](https://leafyapp.uk), a vocabulary app for macOS.

Select a word anywhere on your Mac and OpenClip offers:

- **Look up** — look the word up and show the definition in place
- **Translate** — translate the selection into your chosen language
- **Save** — save it straight to your Leafy library without opening a window
- **Add to Anki** — save it and make an Anki card from it

The Anki action needs Leafy connected to Anki first (Leafy › Settings › Anki).
If Anki is closed when you use it, the card is made the next time you open Anki.

Leafy reads the sentence around the word rather than the word on its own, so the
meaning you get is the one that fits where you found it. Everything is saved to a
searchable library on your Mac.

## How it works

Each action runs `/usr/bin/open -g` on a `leafy://` URL, which hands the selected
text to the Leafy app running on the same machine. Nothing is sent anywhere, and
no network call is made.

The `-g` flag matters: it opens the URL without bringing Leafy to the front.
Leafy reads the surrounding sentence from whichever app is frontmost at that
moment, so activating Leafy first would lose the context the definition is
based on.

## Requirements

Leafy must be installed. Free while in beta, macOS 14 or later. Download it from
[leafyapp.uk](https://leafyapp.uk).

Leafy has a selection bar of its own. If you leave it on, two floating bars appear
when you select text. Turn Leafy's off under Settings › Selection toolbar › Show toolbar.

## Author

Jtobin, <https://leafyapp.uk>
