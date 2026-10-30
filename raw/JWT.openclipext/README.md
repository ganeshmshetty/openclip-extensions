# JWT

Decode [JSON Web Tokens](https://datatracker.ietf.org/doc/html/rfc7519)
without leaving the app you are in. Select a token anywhere on your Mac, choose **Decode JWT**, and see
straight away whether it is still valid, who issued it, and what it contains.

Everything runs locally on your Mac. The token is never sent anywhere.

## Usage

Select a token and choose **Decode JWT**. The result card shows one line of expiry status
(`Expires in 52 minutes`, `Expired 3 hours ago`, `Becomes valid in 5 minutes`, or
`No expiry claim`, in your language), then the payload as pretty-printed JSON. Right-click
(or ⇧-click) to copy it instead.

- `Bearer ` or `Authorization:` prefixes, surrounding quotes and missing base64 padding are
  cleaned up automatically.
- The action only appears when the selection looks like a token.
- Encrypted tokens (JWE) are detected and reported instead of producing garbage.

## Privacy

The extension decodes tokens entirely on your Mac using pure JavaScript. It performs no network
requests, keeps no logs and sends no analytics.

## Requirements

- OpenClip 1.7.0 or later.

## Credits

The icon is the `key-round` glyph from [Lucide](https://lucide.dev) (ISC licence), recoloured to
`currentColor` so it follows the OpenClip theme.
