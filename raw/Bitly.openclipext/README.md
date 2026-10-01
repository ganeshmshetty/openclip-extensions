# Bitly URL Shortener

Shorten a selected HTTP or HTTPS URL with Bitly. A scheme-less domain such as `www.youtube.com` is treated as HTTPS.

Choose **Shorten with Bitly** in OpenClip. It returns the shortened URL as text, which OpenClip delivers using your normal action result settings.

## Settings

- **Access Token** — your Bitly generic access token. OpenClip stores it as a secret.
- **Group GUID** — the Bitly group used to create the link.

## Requirements

- A Bitly access token with permission to create links in the configured group.
- A Bitly Group GUID.
- OpenClip 1.3.0 or later.
