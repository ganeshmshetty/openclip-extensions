# Bitly URL Shortener

Shorten a selected HTTP or HTTPS URL with Bitly. A scheme-less domain such as `www.youtube.com` is treated as HTTPS.

## Features

- Shorten HTTP and HTTPS URLs, including domains without a scheme.
- Return the short link using your preferred OpenClip output setting.
- Store your access token securely in OpenClip's secret storage.

## Usage Examples

Select `https://example.com/a-long-page` or `www.example.com`, then choose **Shorten with Bitly**. OpenClip pastes, copies, or previews the returned short link according to your action settings.

## Configuration

1. In your Bitly account, generate a generic access token with permission to create links.
2. Find the GUID of the Bitly group you want to use.
3. Open the Bitly extension's settings in OpenClip and enter both values.

- **Access Token** — your Bitly generic access token. OpenClip stores it as a secret.
- **Group GUID** — the Bitly group used to create the link.

## Requirements

- A Bitly access token with permission to create links in the configured group.
- A Bitly Group GUID.
- OpenClip 1.3.0 or later.

The selected URL is sent to Bitly to create the short link. Your Bitly account's limits and permissions apply.
