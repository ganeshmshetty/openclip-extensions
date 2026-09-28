# Quick Decision

Instantly evaluate selected text or links against any question using AI.

Check link safety, content trustworthiness, message urgency, or test any custom binary question directly from your selection. Works with fast cloud decision models (such as Jev AI / TypeSafe AI) or local models on localhost.

## Features

- **Instant Evaluation**: Fast decision making based on selected text without conversational overhead.
- **Custom Questions & Labels**: Configure any evaluation question and customize positive/negative labels (e.g. *Safe / Suspicious*, *Urgent / Normal*, *Yes / No*).
- **Confidence Scoring**: Displays calibrated probability percentages alongside the decision.
- **Local & Cloud Ready**: Connects to cloud endpoints via API key, or to local models (e.g. Python scripts, Ollama, or local classifiers on `localhost:8000`) with zero API key requirement.

## Options

- **Question**: The criteria or question to evaluate against the selected text (default: `"Is this content safe and trustworthy?"`).
- **Positive Label (Yes)**: Label displayed when confidence is positive (default: `"Safe"`).
- **Negative Label (No)**: Label displayed when confidence is negative (default: `"Suspicious"`).
- **Model**: Model identifier to pass to the endpoint (default: `"jev-latest"`).
- **API Key**: API key for cloud providers (can be left blank for local endpoints).
- **Endpoint URL**: The API endpoint to send evaluation requests to (default: `"https://api.typesafe.ai/v1/systemone"`).

## Usage

1. Select text or a link in any application.
2. Trigger OpenClip and choose **Quick Decision**.
3. The result card and toast will display the outcome and confidence score.
