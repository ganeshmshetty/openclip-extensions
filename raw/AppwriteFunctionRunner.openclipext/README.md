# Appwrite Function Runner

Send the selected text to **your own [Appwrite](https://appwrite.io) Function** and use whatever
it replies with. Select text anywhere on your Mac, open the **Appwrite** group, click
**Execute Function**, and the Function's output lands in OpenClip's result card, is pasted, or is
copied — whichever you chose under *Preferences → General → "When an action returns text"*.
A right-click (or ⇧-click) always copies the reply without opening a card.

Any Appwrite Function becomes a text tool: summarise, translate, rewrite with an LLM, look
something up in your database, post to Slack — anything you can write in a Function.

## Setup

1. **Create a Function** in the [Appwrite Console](https://cloud.appwrite.io) (see the starter
   below, or use any Function that reads its request body as text).
2. Either set the Function's **Execute access** to `Any`, **or** create an API key with the
   `execution.write` scope only, dedicated to this extension.
3. Install the extension, then configure **Execute Function** (under **Appwrite** in
   *Preferences → Actions*, or just run it once — OpenClip opens the configuration sheet for the
   missing values):

| Option | Value |
| :--- | :--- |
| **Endpoint** | Your API endpoint, e.g. `https://fra.cloud.appwrite.io/v1` (copy it from *Project → Settings*). Defaults to `https://cloud.appwrite.io/v1`. Self-hosted works the same: `https://appwrite.example.com/v1`. |
| **Project ID** | From *Project → Settings*. |
| **Function ID** | From the Function's *Settings* tab. |
| **API key (optional)** | Only needed if the Function's execute access is not `Any`. Stored in OpenClip's secret store (`~/.openclip/secrets.json`, mode 0600), never in UserDefaults. Also unlocks Appwrite's error output in failure toasts. |

## What your Function receives

The extension creates a **synchronous execution** (`POST /v1/functions/{functionId}/executions`,
`method: POST`, `path: /`). The request body is **the selected text, verbatim** — no wrapper —
so any Function that reads `req.bodyText` works, whether or not it was written with OpenClip in
mind.

- If the selection is a JSON object or array, it is sent as `content-type: application/json`, so
  `req.bodyJson` parses it directly. Anything else is sent as `text/plain; charset=utf-8`.
- Everything OpenClip knows about the run travels in request headers:

| Header | Value |
| :--- | :--- |
| `x-openclip-version` | `1`. Bumped if this contract ever changes. |
| `x-openclip-secondary` | `true` for a right-click / ⇧-click ("copy" run), otherwise `false`. |
| `x-openclip-app` | Bundle ID of the app the text was selected in, e.g. `com.apple.Notes`. |

Your Function may reply with any of:

| Reply | Result |
| :--- | :--- |
| Plain text body | Used verbatim. |
| JSON `{ "text": "..." }` | `text` is used. |
| JSON `{ "error": "..." }` or a non-2xx status | Shown as an error toast. |
| Empty body / `204` | Success toast "Function returned no text". |

## Starter Function (Node.js)

The smallest Function that honours the contract. It trims the selection and Title-Cases it; swap
the transform for a call to your favourite model to make it smart.

```js
export default async ({ req, res, log }) => {
  const text = req.bodyText ?? '';
  const isCopyRun = req.headers['x-openclip-secondary'] === 'true';

  if (!text.trim()) {
    return res.json({ error: 'Nothing selected' }, 400);
  }

  const result = text
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());

  // Make it smart: replace `result` with a model call, e.g.
  //   const reply = await fetch('https://api.anthropic.com/v1/messages', { ... process.env.ANTHROPIC_API_KEY ... });
  // and return res.json({ text: reply });

  return res.json({ text: result });
};
```

Keep the Function's timeout comfortably under 30 seconds: Appwrite hard-limits synchronous
executions to 30 s, and OpenClip's own watchdog cancels the request at 60 s (you can also cancel
by clicking the loading toast).

A ready-made template for the [Appwrite templates gallery](https://github.com/appwrite/templates)
is planned; until then, paste the snippet above into a new Node.js Function.

## Errors you may see

| Toast | Meaning |
| :--- | :--- |
| *Project not found at …* | Wrong project ID, or the endpoint points at a different region than the project lives in. |
| *Function not found in this project* | Wrong function ID (or wrong project/endpoint). |
| *The function has no ready deployment yet* | Deploy the Function first. |
| *Not allowed to execute this function* | Execute access is not `Any` and no valid API key is set, or the key lacks `execution.write`. |
| *Function failed: …* | The Function threw. The first line of its error output is shown when an API key is configured. |
| *The function timed out* | The synchronous execution exceeded Appwrite's 30 s limit. |
| *Could not reach …* | Network / DNS problem, or a mistyped endpoint. |

## Privacy

**The selected text leaves your Mac.** It is sent over HTTPS to the Appwrite project *you*
configured — Appwrite Cloud in the region of your endpoint, or your own self-hosted instance —
and nowhere else, together with the bundle ID of the app it was selected in. The extension keeps
no logs and sends no analytics. The API key is stored in OpenClip's secret store, not in plain
preferences.

## Requirements

- OpenClip 1.1.0 or later.
- An Appwrite project (Cloud or self-hosted 1.4+) with a deployed Function.
- Internet access to your endpoint.

## Installation

From the root of this repository, run:

```sh
./scripts/install.sh raw/AppwriteFunctionRunner.openclipext
```

## Credits

Built by [Matej "Meldiron" Bačo](https://github.com/meldiron). The icon is the Appwrite logomark
from the [appwrite/appwrite](https://github.com/appwrite/appwrite) repository, recoloured to
`currentColor` so it follows the OpenClip theme. Appwrite is a trademark of Appwrite; this
extension is a community integration.
