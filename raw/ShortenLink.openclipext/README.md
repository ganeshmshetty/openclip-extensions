# Shorten Link

Shorten a selected URL using **is.gd** or **v.gd**. Both services work without an account or API key.

Select an HTTP or HTTPS URL anywhere on your Mac and choose **Shorten Link** in OpenClip. The shortened URL is returned using your normal OpenClip action preference.

## Features

- Choose is.gd or v.gd as the preferred service.
- Optionally try the other service after a temporary network or service failure.
- No account or API key required.

is.gd and v.gd are related services and may fail together. Temporary server failures, including HTTP 502 rate-limit responses, trigger fallback to the other service. Invalid-request errors stop fallback and remain visible.

## Options

- **Preferred service** (`domain`): is.gd is selected by default; v.gd is also available.
- **Try other service automatically** (`automaticFallback`): when enabled, OpenClip tries the other service after a retryable failure.

## Requirements

- OpenClip 1.3.0 or later.
- An internet connection.

## Usage

1. Select a URL, such as `https://example.com/very/long/path`.
2. Choose **Shorten Link** in the OpenClip menu.
3. The shortened URL is returned according to your OpenClip action preference.
