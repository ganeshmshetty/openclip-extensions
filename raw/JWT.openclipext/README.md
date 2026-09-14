# JWT

Decode [JSON Web Tokens](https://datatracker.ietf.org/doc/html/rfc7519)
without leaving the app you are in. Select a token anywhere on your Mac, open **JWT**, and see
straight away whether it is still valid, who issued it, and what it contains.

Everything runs locally on your Mac. The token is never sent anywhere.

## Commands

| Command | What it does |
| :--- | :--- |
| **Decode Payload** | The payload as pretty-printed JSON. |
| **Decode Header** | The JOSE header as pretty-printed JSON. |
| **Check Expiry** | A one-line toast: `Expires in 52 minutes`, `Expired 3 hours ago`, `Becomes valid in 5 minutes`, or `No expiry claim`. |

**Decode Payload** and **Decode Header** return text, so they follow your
*Preferences → General → "When an action returns text"* setting: show it in the result card, paste
it, or copy it. By default a left-click pastes and a right-click (or ⇧-click) copies.
**Check Expiry** shows a toast; right-click to copy the message instead.

## What it understands

- Tokens with a `Bearer ` prefix, an `Authorization:` prefix, surrounding quotes, or missing base64
  padding are cleaned up automatically.
- The **JWT** group only appears when the selection looks like a token (three base64url segments
  separated by dots), so it stays out of the way otherwise.
- **Check Expiry** reports relative time such as *in 52 minutes* or *3 hours ago*, formatted for
  your language.
- Encrypted tokens (JWE, five segments or an `enc` header) are detected and reported instead of
  producing garbage.

## Usage Examples

- **Debugging an API call**: select the token from an `Authorization: Bearer …` header in your
  terminal or HTTP client and choose **Check Expiry** to learn whether a `401` is just an expired
  token.
- **Reviewing a login**: select an ID token from a browser dev-tools panel and choose
  **Decode Payload** to see the issuer, audience and email claims.
- **Copying claims into a bug report**: right-click **Decode Payload** to copy the pretty-printed
  JSON.

## Privacy

The extension decodes tokens entirely on your Mac using pure JavaScript. It performs no network
requests, keeps no logs and sends no analytics.

## Requirements

- OpenClip 1.1.0 or later.

## Credits

The icon is the `key-round` glyph from [Lucide](https://lucide.dev) (ISC licence), recoloured to
`currentColor` so it follows the OpenClip theme.
