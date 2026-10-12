# Claude Proofread

Fix spelling and grammar, polish wording, or run your own instruction on the selected text, using any Anthropic-compatible Messages API: the Claude API directly, or a gateway that routes to other models.

## Features
- **Click**: fixes errors and polishes the wording, then replaces the selection. If a custom prompt is set, runs that instead.
- **Right-click or ⇧-click**: fixes spelling, grammar and punctuation only, with minimal edits; the result is copied to the clipboard.
- Keeps the original language (Chinese, English or mixed), line breaks, Markdown, code, URLs and technical terms.
- Shows a progress indicator while waiting; click it to cancel.

## Configuration
| Option | Default | Notes |
| --- | --- | --- |
| Anthropic Base URL | `https://api.anthropic.com` | `/v1/messages` is added automatically. Local gateways work on ports 1024 and above. |
| API key | (required) | Stored in OpenClip's secret store. |
| Model | `claude-haiku-5-5` | Any model name your endpoint accepts. |
| Thinking | On | Claude models only. On = adaptive thinking; off = no up-front thinking. |
| Effort | `low` | Claude models only. `model default` uses the model's own default. |
| Token budget | `4000` | `max_tokens` per request; thinking counts toward it. Selections longer than about 75% of the budget (in characters) are rejected up front. |
| Custom prompt | (empty) | Replaces the built-in polish instruction for clicks. The selected text is appended after it. Right-click stays fix-only. |

Thinking and effort are sent only when the model name contains `claude`. If the model rejects a combination, the request is retried once without that setting.

## Usage Examples
- Click: `Their going too recieve the the package tomorow.` → `They're going to receive the package tomorrow.`
- Right-click: `Plus some keywords examples` → `Plus some keyword examples`
- Custom prompt `Translate into Japanese`: `Good morning` → `おはようございます`

---

# Claude 校对

通过任意 Anthropic 兼容的 Messages API（Claude 官方接口，或转发到其他模型的网关）修正选中文本的拼写语法、润色表达，或执行你自己的指令。

## 功能
- **点击**：修正错误并润色，结果替换选中文本。设置了自定义提示词时，改为执行该提示词。
- **右键或 ⇧+点击**：只修拼写、语法、标点，改动最小；结果复制到剪贴板。
- 保留原文语言（中文、英文或混排）、换行、Markdown、代码、链接和专业术语。
- 等待时显示进度提示，点击可取消。

## 配置
| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| Anthropic Base URL | `https://api.anthropic.com` | 自动补齐 `/v1/messages`。本机网关需使用 1024 以上端口。 |
| API key | 必填 | 保存在 OpenClip 的密钥存储中。 |
| 模型名称 | `claude-haiku-5-5` | 接口能识别的任意模型名。 |
| 模型思考 | 开 | 仅对 Claude 模型生效。开 = adaptive 思考；关 = 不做前置思考。 |
| Effort | `low` | 仅对 Claude 模型生效。`model default` 表示使用模型自身默认值。 |
| Token 预算 | `4000` | 每次请求的 `max_tokens`，思考也计入其中。选区字符数超过预算约 75% 时直接提示分段。 |
| 自定义提示词 | 空 | 填写后替换点击时的内置润色指令，选中文本附加在指令之后。右键仍只修错。 |

模型名包含 `claude` 时才发送思考和 effort 参数。如果模型拒绝某个组合，会去掉该参数自动重试一次。

## 示例
- 点击：`Their going too recieve the the package tomorow.` → `They're going to receive the package tomorrow.`
- 右键：`Plus some keywords examples` → `Plus some keyword examples`
- 自定义提示词「翻译成日语」：`Good morning` → `おはようございます`
