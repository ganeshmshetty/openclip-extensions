# JWT

Decode, inspect and verify [JSON Web Tokens](https://datatracker.ietf.org/doc/html/rfc7519)
without leaving the app you are in. Select a token anywhere on your Mac, open **JWT**, and see
straight away whether it is still valid, who issued it, and what it contains.

Everything runs locally on your Mac. The token is never sent anywhere.

## Commands

| Command | What it does |
| :--- | :--- |
| **Inspect** | A readable report: token status first (`Valid · expires in 14 minutes`), then the algorithm line (`HS256 · JWT · kid 2024-key`), then every claim with its standard name and timestamps as local dates plus relative time. |
| **Decode Payload** | The payload as pretty-printed JSON. |
| **Decode Header** | The JOSE header as pretty-printed JSON. |
| **Check Expiry** | A one-line toast: `Expires in 14 minutes · Sep 10, 2026, 22:15`, `Expired 3 hours ago · …`, `Not valid yet …`, or a note that the token has no `exp` claim. |
| **Verify Signature** | Recomputes the HMAC for `HS256`, `HS384` and `HS512` tokens with your secret and reports whether the signature matches. |

**Inspect**, **Decode Payload** and **Decode Header** return text, so they follow your
*Preferences → General → "When an action returns text"* setting: show it in the result card, paste
it, or copy it. By default a left-click pastes and a right-click (or ⇧-click) copies.
**Check Expiry** and **Verify Signature** show a toast; right-click to copy the message instead.

## What it understands

- Tokens with a `Bearer ` prefix, an `Authorization:` prefix, surrounding quotes, or missing base64
  padding are cleaned up automatically.
- The **JWT** group only appears when the selection looks like a token (three base64url segments
  separated by dots), so it stays out of the way otherwise.
- Time claims `exp`, `nbf`, `iat`, `auth_time` and `updated_at` are shown as local dates with a
  relative delta such as *(in 14 minutes)* or *(3 hours ago)*, formatted for your language.
- Registered claims are labelled by name (`iss` → Issuer, `sub` → Subject, `aud` → Audience, `jti` →
  Token ID) along with common OpenID Connect claims (`email`, `name`, `scope`, `azp`, `nonce`, …).
- Unsigned tokens (`alg: none`) and nested JWTs (`cty: JWT`) are called out in the algorithm line.
- Encrypted tokens (JWE, five segments or an `enc` header) are detected and reported instead of
  producing garbage.

## Verify Signature

Configure the command under **JWT** in *Preferences → Actions*, or just run it once and OpenClip
opens the configuration sheet:

| Option | Description |
| :--- | :--- |
| **Secret** | The shared secret the issuer used to sign the token. Stored in OpenClip's secret store, never in plain preferences. |
| **Secret is base64 encoded** | Turn on when the secret is stored as base64 (as some identity providers do), so it is decoded before use. |

Results:

- `Signature valid (HS256) · Valid · expires in 14 minutes`
- `Signature invalid (HS256) · wrong secret or tampered token`
- `Token is unsigned (alg none) · nothing to verify`
- `RS256 needs the issuer’s public key · only HS256/HS384/HS512 can be verified here`

Asymmetric algorithms (`RS*`, `PS*`, `ES*`, `EdDSA`) cannot be verified by this extension; use
the issuer's JWKS endpoint or a dedicated tool for those.

## Usage Examples

- **Debugging an API call**: select the token from an `Authorization: Bearer …` header in your
  terminal or HTTP client and choose **Check Expiry** to learn whether a `401` is just an expired
  token.
- **Reviewing a login**: select an ID token from a browser dev-tools panel and choose **Inspect** to
  see the issuer, audience, email and authentication time in plain language.
- **Copying claims into a bug report**: right-click **Decode Payload** to copy the pretty-printed
  JSON.
- **Checking a local dev secret**: paste your `HS256` secret into **Verify Signature** once, then
  verify any token your development server issues with a single click.

## Privacy

The extension decodes and verifies tokens entirely on your Mac using pure JavaScript. It performs no
network requests, keeps no logs and sends no analytics. The secret used by **Verify Signature** is
kept in OpenClip's secret store (`~/.openclip/secrets.json`, mode 0600).

## Requirements

- OpenClip 1.1.0 or later.

## Credits

The icon is the `key-round` glyph from [Lucide](https://lucide.dev) (ISC licence), recoloured to
`currentColor` so it follows the OpenClip theme.
