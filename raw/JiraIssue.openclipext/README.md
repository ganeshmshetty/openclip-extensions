# Jira Issue

Turn selected text into a Jira issue. The first line becomes the summary and everything after it becomes the description.

## Features

- Creates the issue through the Jira Cloud REST API, copies the issue link, and shows the issue key (like `PROJ-42`).
- No API token? It opens Jira's create-issue page with the summary and description filled in, so you can pick the project and submit.

## Configuration

- **Site URL**: your Jira site, like `https://your-team.atlassian.net`.
- **Email**: the email of your Atlassian account.
- **API Token**: create one at **id.atlassian.com → Security → API tokens**. Stored as a secret.
- **Project Key**: the project to create issues in, like `PROJ`.
- **Issue Type**: defaults to `Task`. Use any type your project has, like `Bug` or `Story`.

## Requirements

- A Jira Cloud site.
- OpenClip 1.3.0 or later.

The selected text is sent to your Jira site to create the issue.
