# Urlquery

Ask [urlquery.net](https://urlquery.net) whether a link is telling the truth. Select a URL, domain
or IP address anywhere on your Mac, open **Urlquery**, and get an instant reputation verdict, run a
fresh sandbox scan, or read the reports that already exist.

urlquery opens the URL in an isolated browser, records what the page really does, and flags
malware, phishing and other suspicious behaviour. This extension brings that to any text field.

## Commands

| Command | What it does |
| :--- | :--- |
| **Check Reputation** | One-second lookup against urlquery's reputation data. Shows a toast: `Flagged as phishing · example.com` or `No reputation alerts · example.com`. No new scan is run. Right-click to copy the message. |
| **Scan** | Submits the URL for a fresh sandbox scan and waits for the report. Returns a summary: alert counts (urlquery, IDS, analyzer), start and final URL, page title, IP with network and country, tags, the top alerts, and the report link. Right-click opens the report in your browser instead. |
| **Past Scans** | Lists reports urlquery already has for the domain (or IP), newest first, with date, alert count, URL and report link. Nothing is submitted. Right-click opens the domain search on urlquery.net. |
| **Open on urlquery.net** | Opens the urlquery.net search for the domain in your browser. Works without an API key. Right-click copies the search link. |

**Scan** and **Past Scans** return text, so they follow your
*Preferences → General → "When an action returns text"* setting: show it in the result card, paste
it, or copy it. **Check Reputation** shows a toast.

A typical flow: **Check Reputation** first because it is instant, **Past Scans** if you want an
existing report, and **Scan** when you need fresh evidence.

## Setup

1. Create a free account at [urlquery.net/user/signup](https://urlquery.net/user/signup) and copy
   your API key from your profile.
2. Run **Check Reputation**, **Scan** or **Past Scans** once. OpenClip opens the configuration
   sheet for the missing key; paste it and save. You can also configure the commands under
   **Urlquery** in *Preferences → Actions*.

OpenClip stores option values per command, so the first run of each of the three API commands
asks for the key. Paste the same key each time.

| Option | Command | Description |
| :--- | :--- | :--- |
| **API key** | Check Reputation, Scan, Past Scans | Your urlquery API key. Stored in OpenClip's secret store (`~/.openclip/secrets.json`, mode 0600), never in plain preferences. |
| **Report visibility** | Scan | `public` (default) lists the report on urlquery.net for everyone, `restricted` hides it from listings but keeps the link shareable, `private` limits it to your account. Pick `restricted` or `private` for internal or sensitive links. |

## What it understands

- Full URLs, bare domains such as `example.com` or `www.example.co.uk/login`, and IPv4 addresses.
- Defanged indicators from threat reports are refanged automatically: `hxxps://example[.]com`,
  `example(.)com`, `1.2.3[.]4`.
- Surrounding quotes, angle brackets or parentheses and trailing punctuation are stripped.
- The **Urlquery** group only appears when the selection looks like a URL, domain or IP, so it stays
  out of the way otherwise. Bare filenames such as `main.js` or `README.md` are ignored.
- **Past Scans** and **Open on urlquery.net** search by registrable domain, so `www.shop.example.com`
  and `example.com/login` both show the history of `example.com`.

## Scan timing

urlquery scans usually take 30 to 90 seconds. OpenClip stops extension scripts after 60, so **Scan**
waits up to about 50 seconds. If the report is not ready by then, a toast says `Still scanning …`
and the queue page opens in your browser; it turns into the report as soon as urlquery finishes.
You can also cancel a running scan by clicking the loading toast.

## Errors you may see

| Toast | Meaning |
| :--- | :--- |
| *urlquery rejected the API key* | The key is wrong or was revoked. The configuration sheet opens so you can fix it. |
| *urlquery rate limit reached* | Too many requests for your account tier. Wait a minute. |
| *urlquery rejected this URL* | The URL could not be queued, for example an unsupported scheme or a private address. |
| *urlquery could not scan …* | The sandbox failed to load the page. Try again later or check the URL. |
| *urlquery refused this request* | The report is restricted or private to another account. |
| *Could not reach api.urlquery.net* | Network or DNS problem. |

## Privacy

**The selected URL leaves your Mac.** It is sent over HTTPS to `api.urlquery.net` and nowhere
else. **Scan** additionally asks urlquery to visit the URL; with the default `public` visibility
the resulting report, including the URL and a screenshot, is listed publicly on urlquery.net. Use
`restricted` or `private` for anything you would not want indexed. **Open on urlquery.net** only
opens a search page in your browser and sends nothing through the API.

The extension keeps no logs and sends no analytics. The API key is stored in OpenClip's secret
store.

## Requirements

- OpenClip 1.1.0 or later.
- A urlquery.net account and API key for **Check Reputation**, **Scan** and **Past Scans**.
- Internet access.

## Credits

urlquery is a service of urlquery.net; this extension is a community integration and is not
affiliated with urlquery. The icon is the `radar` glyph from [Lucide](https://lucide.dev) (ISC
licence), recoloured to `currentColor` so it follows the OpenClip theme.
