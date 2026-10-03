# Bitly URL Shortener

Shorten a selected HTTP or HTTPS URL with Bitly. A scheme-less domain such as `www.youtube.com` is treated as HTTPS.

## Features

- Shorten HTTP and HTTPS URLs, including domains without a scheme.
- Return the short link using your preferred OpenClip output setting.
- Store your access token securely in OpenClip's secret storage.
- Your Group GUID is fetched automatically — no manual lookup needed.

## Usage Examples

Select `https://example.com/a-long-page` or `www.example.com`, then choose **Shorten with Bitly**. OpenClip pastes, copies, or previews the returned short link according to your action settings.

## Configuration

1. Log in to your Bitly account and go to **Settings → Developer settings → Generic Access Token**.
2. Enter your account password and click **Generate token**. Copy it immediately.
3. Open the Bitly extension's settings in OpenClip and paste the token.

That's it — OpenClip automatically looks up your default Bitly group.

- **Access Token** — your Bitly generic access token. OpenClip stores it as a secret.

## Requirements

- A free Bitly account (1,000 API requests/month included).
- A generic access token from Bitly's developer settings.
- OpenClip 1.3.0 or later.

The selected URL is sent to Bitly to create the short link. Your Bitly account's limits and permissions apply.
