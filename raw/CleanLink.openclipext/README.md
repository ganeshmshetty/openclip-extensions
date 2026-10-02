# Clean Link

Strip tracking parameters, marketing IDs, referral tokens, and privacy-invading query strings from URLs with a single click.

## Features

- **Privacy-first & Offline**: Operates 100% locally on your Mac. No URLs are ever sent to an external service.
- **Universal Tracking Stripper**: Automatically strips common analytics and marketing parameters:
  - `utm_*` (Google Analytics / marketing campaigns)
  - `fbclid`, `igshid`, `igsh` (Meta / Facebook / Instagram)
  - `gclid`, `gbraid`, `wbraid`, `gad_source` (Google Ads)
  - `msclkid`, `twclid`, `ttclid` (Bing, X / Twitter, TikTok)
  - `mc_cid`, `mc_eid`, `mkt_tok` (Mailchimp, Marketo, email campaigns)
  - `pk_*`, `piwik_*`, `yclid`, and many more
- **Domain-Specific Optimization**:
  - **YouTube**: Strips `si=`, `feature=`, and tracking parameters while preserving video IDs and timestamps (`t=`).
  - **X / Twitter**: Removes `s=`, `t=`, `ref_src=`.
  - **Spotify**: Cleans `si=` and context trackers.
  - **Amazon**: Cleans referral tags, search tokens, and can simplify product links directly to `/dp/<ASIN>`.
  - **Google Redirects**: Unwraps `google.com/url?q=...` back into the direct destination link.

## Options

- **Simplify Amazon URLs to canonical `/dp/ASIN`**: Strips bloated tracking junk from Amazon product URLs and simplifies them into clean, short product links. Default: `true`.
- **Unwrap Google search redirects**: Automatically extracts and cleans destination URLs hidden behind Google redirect links. Default: `true`.

## Usage

1. Select any link or text containing URLs.
2. Trigger OpenClip.
3. Click **Clean Link** to clean and paste/copy the sanitized link instantly.
