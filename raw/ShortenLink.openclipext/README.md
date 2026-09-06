# Shorten Link

Shorten any selected URL using **TinyURL**, **is.gd**, or **v.gd**.

Select a URL anywhere on your Mac and choose **Shorten Link** from OpenClip to generate a shortened URL and replace or copy it.

## Features

- **Quick URL Shortening**: Automatically detects and shortens HTTP/HTTPS URLs.
- **Configurable Service**: Choose between TinyURL, is.gd, or v.gd in extension options.
- **Async & Responsive**: Displays a loading indicator while fetching the shortened link from the service API.

## Options

- **Shortening Service** (`domain`):
  - **TinyURL** (default) — [tinyurl.com](https://tinyurl.com)
  - **is.gd** — [is.gd](https://is.gd)
  - **v.gd** — [v.gd](https://v.gd)

## Requirements

- OpenClip 1.1.0 or later.
- Active internet connection.

## Installation

From the root of this repository, run:

```sh
./scripts/install.sh raw/ShortenLink.openclipext
```

## Usage

1. Select a URL (e.g. `https://example.com/very/long/path`).
2. Click **Shorten Link** in the OpenClip menu.
3. The shortened URL is returned and delivered according to your OpenClip action preference (paste or copy).
