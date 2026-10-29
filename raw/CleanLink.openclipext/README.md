# Clean Link

Strip tracking parameters, marketing IDs, referral tokens, and privacy-invading query strings from URLs with a single click.

## Features

- **Private and offline.** Cleaning runs on your Mac. Nothing is sent out, and short links such as `t.co` or `bit.ly` are not expanded.
- **ClearURLs rules.** A bundled snapshot of the [ClearURLs](https://github.com/ClearURLs/Rules) ruleset (LGPL-3.0) removes known tracking parameters, path junk, and redirect wrappers. Exceptions in that ruleset are honored, so functional parameters (for example a GitHub `ref`) stay put.
- **X / Twitter.** Removes the share-surface code `s`, the session token `t`, `ref_src`, `ref_url`, and the newer share token `a`. A copied post link such as `https://x.com/name/status/123?a=…&s=20` becomes `https://x.com/name/status/123`. Sign-in and email links under `/i/redirect` are left alone.
- **YouTube.** Strips `si`, `feature`, and embed-referrer parameters. The video id and timestamp (`t`) stay.
- **Spotify.** Removes `si`, `context`, and `nd`.
- **Amazon.** Strips affiliate and search-tracking parameters, and shortens a product link to `/dp/<ASIN>`.
- **Bilibili and LinkedIn.** Removes the usual share and click ids.
- **Google.** Unwraps `google.com/url?q=…` search redirects back to the destination.
- **Everywhere else.** Common tags such as `utm_*`, `fbclid`, `gclid`, `gbraid`, and `mc_eid`, plus the rest of the bundled rules.

These cleanups always run.

## Rules and credit

Parameter rules in `clearurls-rules.js` are a snapshot of ClearURLs data, copyright ClearURLs contributors, under the GNU Lesser General Public License v3.0 (`LICENSE.clearurls-rules`). The rest of this extension is MIT. Details are in `NOTICE`.

## Usage

1. Select a link, or text that contains links.
2. Trigger OpenClip.
3. Click **Clean Link** to paste or copy the cleaned result.
