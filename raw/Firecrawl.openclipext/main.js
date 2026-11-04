var messages = {
  "setup": {
    "en": "Add your Firecrawl API key in the extension settings.",
    "zh-Hans": "请在扩展设置中添加 Firecrawl API 密钥。",
    "zh-Hant": "請在擴充功能設定中新增 Firecrawl API 金鑰。",
    "fr": "Ajoutez votre clé API Firecrawl dans les réglages de l'extension.",
    "ja": "拡張機能の設定にFirecrawl APIキーを追加してください。"
  },
  "scheme": {
    "en": "Firecrawl can scrape HTTP or HTTPS URLs only.",
    "zh-Hans": "Firecrawl 只能抓取 HTTP 或 HTTPS 网址。",
    "zh-Hant": "Firecrawl 只能擷取 HTTP 或 HTTPS 網址。",
    "fr": "Firecrawl peut uniquement extraire des URL HTTP ou HTTPS.",
    "ja": "FirecrawlはHTTPまたはHTTPSのURLのみ取得できます。"
  },
  "key": {
    "en": "Firecrawl rejected the API key. Check it in the extension settings.",
    "zh-Hans": "Firecrawl 拒绝了 API 密钥。请在扩展设置中检查。",
    "zh-Hant": "Firecrawl 拒絕了 API 金鑰。請在擴充功能設定中檢查。",
    "fr": "Firecrawl a refusé la clé API. Vérifiez-la dans les réglages de l'extension.",
    "ja": "FirecrawlがAPIキーを拒否しました。拡張機能の設定で確認してください。"
  },
  "credits": {
    "en": "Your Firecrawl account is out of credits.",
    "zh-Hans": "您的 Firecrawl 账户额度已用完。",
    "zh-Hant": "您的 Firecrawl 帳戶額度已用完。",
    "fr": "Votre compte Firecrawl n'a plus de crédits.",
    "ja": "Firecrawlアカウントのクレジットが不足しています。"
  },
  "rate": {
    "en": "Firecrawl rate limit reached. Wait a moment and try again.",
    "zh-Hans": "已达到 Firecrawl 速率限制。请稍后重试。",
    "zh-Hant": "已達到 Firecrawl 速率限制。請稍後重試。",
    "fr": "Limite de requêtes Firecrawl atteinte. Patientez puis réessayez.",
    "ja": "Firecrawlのレート制限に達しました。しばらくしてから再試行してください。"
  },
  "http": {
    "en": "Firecrawl returned HTTP {status}.",
    "zh-Hans": "Firecrawl 返回了 HTTP {status}。",
    "zh-Hant": "Firecrawl 傳回了 HTTP {status}。",
    "fr": "Firecrawl a renvoyé HTTP {status}.",
    "ja": "FirecrawlがHTTP {status}を返しました。"
  },
  "network": {
    "en": "Could not reach Firecrawl. Check your internet connection and try again.",
    "zh-Hans": "无法连接 Firecrawl。请检查网络连接后重试。",
    "zh-Hant": "無法連線至 Firecrawl。請檢查網路連線後重試。",
    "fr": "Impossible de joindre Firecrawl. Vérifiez votre connexion Internet et réessayez.",
    "ja": "Firecrawlに接続できませんでした。インターネット接続を確認して再試行してください。"
  },
  "empty": {
    "en": "Firecrawl returned no content for this page.",
    "zh-Hans": "Firecrawl 未返回此页面的内容。",
    "zh-Hant": "Firecrawl 未傳回此頁面的內容。",
    "fr": "Firecrawl n'a renvoyé aucun contenu pour cette page.",
    "ja": "Firecrawlはこのページの内容を返しませんでした。"
  }
};

function message(key) {
  return openclip.i18n(messages[key]);
}

function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) return openclip.options[name];
  return openclip.option ? openclip.option(name) : undefined;
}

function normalizeURL(input) {
  var url = String(input || '').trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error(message('scheme'));
  return 'https://' + url;
}

async function action(selection) {
  var apiKey = String(option('apiKey') || '').trim();
  if (!apiKey) throw new Error(message('setup'));

  var text = typeof selection === 'string' ? selection : (selection && selection.text) || openclip.input.text;
  var url = normalizeURL(text);

  var response;
  try {
    response = await openclip.fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url: url, formats: ['markdown'] })
    });
  } catch (_) {
    throw new Error(message('network'));
  }

  var data = null;
  try { data = JSON.parse(response.text()); } catch (_) {}

  if (response.status === 401) throw new Error(message('key'));
  if (response.status === 402) throw new Error(message('credits'));
  if (response.status === 429) throw new Error(message('rate'));
  if (response.status < 200 || response.status >= 300) {
    var detail = data && typeof data.error === 'string' ? data.error : '';
    throw new Error(detail || message('http').replace('{status}', String(response.status)));
  }

  var markdown = data && data.data && data.data.markdown;
  if (typeof markdown !== 'string' || !markdown.trim()) throw new Error(message('empty'));
  return markdown.trim();
}

module.exports = action;
module.exports.action = action;
