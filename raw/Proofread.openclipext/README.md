# Claude Proofread

Grammarly-style proofreading for any selected text. It fixes spelling, grammar and punctuation, can polish the wording, and replaces the selection with the result. Requests go to the Claude API or to any Anthropic-compatible endpoint.

## Usage
- Click: fix errors and polish the wording. If a custom prompt is set, it runs instead.
- Right-click or ⇧-click: fix errors only, with minimal edits. The result goes to the clipboard.

The original language, line breaks, Markdown, code and links are kept.

## Configuration
| Option | Default | Notes |
| --- | --- | --- |
| Anthropic Base URL | `https://api.anthropic.com` | `/v1/messages` is appended automatically. |
| API key | required | Kept in OpenClip's secret store. |
| Model | `claude-haiku-5-5` | |
| Thinking | On | Claude models only. |
| Effort | `low` | Claude models only. |
| Token budget | `4000` | `max_tokens` per request, thinking included. |
| Custom prompt | empty | The selected text is appended after it. |

Local gateways have only been tested with magpie.

---

# Claude 校对

类似 Grammarly 的校对工具：修正选中文本的拼写、语法和标点，也可以顺带润色表达，结果直接替换原文。请求发往 Claude API，或任意 Anthropic 兼容接口。

## 用法
- 点击：修正错误并润色。设置了自定义提示词时，改为执行该提示词。
- 右键或 ⇧+点击：只修错，改动最小，结果放进剪贴板。

原文的语言、换行、Markdown、代码和链接会保留。

## 配置
| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| Anthropic Base URL | `https://api.anthropic.com` | 自动补齐 `/v1/messages`。 |
| API key | 必填 | 存在 OpenClip 的密钥存储里。 |
| 模型名称 | `claude-haiku-5-5` | |
| 模型思考 | 开 | 仅对 Claude 模型生效。 |
| Effort | `low` | 仅对 Claude 模型生效。 |
| Token 预算 | `4000` | 每次请求的 `max_tokens`，含思考。 |
| 自定义提示词 | 空 | 选中文本会附加在指令之后。 |

本地网关仅在 magpie 上测试过。
