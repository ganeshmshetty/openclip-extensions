# Zapier

Connect OpenClip to thousands of web apps and automated workflows with [Zapier](https://zapier.com). Select text anywhere on your Mac, click **Send to Zapier**, and instantly dispatch the selection to your automated pipelines.

## Features

- **Universal Bridge**: Send highlighted text to any of the 6,000+ apps supported by Zapier, including Slack, Notion, Google Sheets, Airtable, Jira, HubSpot, and Linear.
- **Context-Aware Payloads**: Sends the selected text along with the name and bundle ID of the source application and an ISO timestamp.
- **Fast & Unobtrusive**: Dispatches requests in the background with spinner and success toasts, keeping your workflow uninterrupted.
- **Secure Configuration**: Supports optional secret tokens for secure webhook verification, stored in OpenClip's encrypted secret store.

## How to Set Up in Zapier

1. Go to [Zapier](https://zapier.com) and click **Create Zap**.
2. For the **Trigger**, search for and select **Webhooks by Zapier**.
3. Choose the **Catch Hook** event and click **Continue**.
4. Copy the generated **Webhook URL** (e.g. `https://hooks.zapier.com/hooks/catch/...`).
5. Set up your downstream action steps (such as *Create Row in Google Sheets*, *Send Channel Message in Slack*, or *Create Task in Asana*).
6. Test and publish your Zap!

## Configuration

In OpenClip (*Preferences → Actions → Zapier*):

| Option | Description |
| :--- | :--- |
| **Webhook URL (Catch Hook)** | The unique Catch Hook URL copied from your Zapier trigger step. |
| **Secret Token (Optional)** | An optional authentication token. If provided, it is sent in the `X-Zapier-Token` and `X-Webhook-Secret` headers so you can filter unauthorized requests in Zapier. Stored in OpenClip's secure store. |

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
