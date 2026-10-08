# Zapier

Connect OpenClip to thousands of web apps and automated workflows with [Zapier](https://zapier.com). Select text anywhere on your Mac, click **Send to Zapier**, and instantly dispatch the selection to your automated pipelines.

## Features

- **Universal Bridge**: Send highlighted text to any of the 6,000+ apps supported by Zapier, including Slack, Notion, Google Sheets, Airtable, Jira, HubSpot, and Linear.
- **Context-Aware Payloads**: Sends the selected text along with the name and bundle ID of the source application and an ISO timestamp.
- **Fast & Unobtrusive**: Dispatches requests in the background with spinner and success toasts, keeping your workflow uninterrupted.
- **Optional Secret Token**: Supports an optional secret token, stored in OpenClip's encrypted secret store, that is forwarded as a custom header so a downstream Zap step can filter requests.
- **HTTPS Only**: Requests are refused unless the webhook URL uses `https://`, so the selected text and token are never transmitted in cleartext.

## How to Set Up in Zapier

1. Go to [Zapier](https://zapier.com) and click **Create Zap**.
2. For the **Trigger**, search for and select **Webhooks by Zapier**.
3. Choose the **Catch Raw Hook** event and click **Continue**.
   *(Use Catch Raw Hook instead of Catch Hook when you want to validate the secret token: only Catch Raw Hook exposes the incoming request headers. If you don't need the token, the standard Catch Hook works too and parses the JSON payload for you.)*
4. Copy the generated **Webhook URL** (e.g. `https://hooks.zapier.com/hooks/catch/...`).
5. If you are using the secret token, add a **Filter** or **Code by Zapier** step right after the trigger that continues only when the `X-Zapier-Token` (or `X-Webhook-Secret`) header equals your expected value. A Code step can also parse the raw JSON body into fields when using Catch Raw Hook.
6. Set up your downstream action steps (such as *Create Row in Google Sheets*, *Send Channel Message in Slack*, or *Create Task in Asana*).
7. Test and publish your Zap!

## Configuration

In OpenClip (*Preferences → Actions → Zapier*):

| Option | Description |
| :--- | :--- |
| **Webhook URL (Catch Raw Hook)** | The unique webhook URL copied from your Zapier trigger step. Must be an `https://` URL. |
| **Secret Token (Optional)** | An optional secret token. If provided, it is sent in the `X-Zapier-Token` and `X-Webhook-Secret` headers. This lets a downstream Zap step filter requests — it is *not* ingress authentication: the request still reaches Zapier, so treat the webhook URL itself as the credential. Stored in OpenClip's secure store. To reject requests before they reach Zapier, route through a validating intermediary that returns `401` for a missing or wrong token. |

## What Zapier Receives

When triggered, OpenClip sends an HTTP `POST` request with a JSON payload structured as follows:

```json
{
  "text": "The text you highlighted on your Mac",
  "sourceApp": "Safari",
  "bundleId": "com.apple.Safari",
  "timestamp": "2026-09-10T01:45:00.000Z",
  "isSecondaryClick": false
}
```

In your Zapier actions, map the `text` variable into your target fields (e.g., ticket description, spreadsheet cell, or chat message).

## Popular Use Cases

- **Task Capture**: Highlight an email, bug report, or Slack snippet to create a ticket in Jira, Linear, ClickUp, or Asana.
- **CRM Quick Lead**: Highlight contact info or a customer inquiry to add or update records in Salesforce, HubSpot, or Pipedrive.
- **Knowledge Base Logging**: Highlight research quotes or notes to append rows to Notion databases, Airtable, or Google Sheets.
- **Team Sharing**: Push important text or error messages directly to a dedicated Slack or Discord channel.
- **AI Processing**: Pass text into Zapier's OpenAI or Claude actions to summarize, translate, or format before routing.

## Requirements

- OpenClip 1.1.0 or later.
- A Zapier account with access to Webhooks by Zapier (available on Zapier Pro and trial plans).
- An active internet connection.
