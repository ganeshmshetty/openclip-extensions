var messages = {
  "token": {
    "en": "Bitly rejected the access token. Check it in the extension settings.",
    "zh-Hans": "Bitly 拒绝了访问令牌。请在扩展设置中检查。",
    "zh-Hant": "Bitly 拒絕了存取權杖。請在擴充功能設定中檢查。",
    "fr": "Bitly a refusé le jeton d'accès. Vérifiez-le dans les réglages de l'extension.",
    "ja": "Bitlyがアクセストークンを拒否しました。拡張機能の設定で確認してください。"
  },
  "access": {
    "en": "Bitly denied access. Check the access token.",
    "zh-Hans": "Bitly 拒绝了访问。请检查访问令牌。",
    "zh-Hant": "Bitly 拒絕了存取。請檢查存取權杖。",
    "fr": "Bitly a refusé l'accès. Vérifiez le jeton d'accès.",
    "ja": "Bitlyがアクセスを拒否しました。アクセストークンを確認してください。"
  },
  "group": {
    "en": "Bitly could not find your account group. Check the access token.",
    "zh-Hans": "Bitly 找不到您的账户群组。请检查访问令牌。",
    "zh-Hant": "Bitly 找不到您的帳戶群組。請檢查存取權杖。",
    "fr": "Bitly ne trouve pas le groupe de votre compte. Vérifiez le jeton d'accès.",
    "ja": "Bitlyがアカウントグループを見つけられません。アクセストークンを確認してください。"
  },
  "link": {
    "en": "Bitly could not create that link. Check the selected URL and your Bitly plan.",
    "zh-Hans": "Bitly 无法创建链接。请检查所选网址和 Bitly 套餐。",
    "zh-Hant": "Bitly 無法建立連結。請檢查選取的網址和 Bitly 方案。",
    "fr": "Bitly n'a pas pu créer ce lien. Vérifiez l'URL sélectionnée et votre offre Bitly.",
    "ja": "Bitlyがリンクを作成できませんでした。選択したURLとBitlyプランを確認してください。"
  },
  "http": {
    "en": "Bitly returned HTTP {status}.",
    "zh-Hans": "Bitly 返回了 HTTP {status}。",
    "zh-Hant": "Bitly 傳回了 HTTP {status}。",
    "fr": "Bitly a renvoyé HTTP {status}.",
    "ja": "BitlyがHTTP {status}を返しました。"
  },
  "scheme": {
    "en": "Bitly can shorten HTTP or HTTPS URLs only.",
    "zh-Hans": "Bitly 只能缩短 HTTP 或 HTTPS 网址。",
    "zh-Hant": "Bitly 只能縮短 HTTP 或 HTTPS 網址。",
    "fr": "Bitly peut uniquement raccourcir des URL HTTP ou HTTPS.",
    "ja": "BitlyはHTTPまたはHTTPSのURLのみ短縮できます。"
  },
  "setup": {
    "en": "Add your Bitly access token in the extension settings.",
    "zh-Hans": "请在扩展设置中添加 Bitly 访问令牌。",
    "zh-Hant": "請在擴充功能設定中新增 Bitly 存取權杖。",
    "fr": "Ajoutez votre jeton d'accès Bitly dans les réglages de l'extension.",
    "ja": "拡張機能の設定にBitlyアクセストークンを追加してください。"
  },
  "network": {
    "en": "Could not reach Bitly. Check your internet connection and try again.",
    "zh-Hans": "无法连接 Bitly。请检查网络连接后重试。",
    "zh-Hant": "無法連線至 Bitly。請檢查網路連線後重試。",
    "fr": "Impossible de joindre Bitly. Vérifiez votre connexion Internet et réessayez.",
    "ja": "Bitlyに接続できませんでした。インターネット接続を確認して再試行してください。"
  },
  "read": {
    "en": "Bitly returned a response that could not be read.",
    "zh-Hans": "无法读取 Bitly 返回的响应。",
    "zh-Hant": "無法讀取 Bitly 傳回的回應。",
    "fr": "La réponse de Bitly n'a pas pu être lue.",
    "ja": "Bitlyの応答を読み取れませんでした。"
  },
  "invalid": {
    "en": "Bitly returned an invalid response.",
    "zh-Hans": "Bitly 返回了无效响应。",
    "zh-Hant": "Bitly 傳回了無效的回應。",
    "fr": "Bitly a renvoyé une réponse invalide.",
    "ja": "Bitlyが無効な応答を返しました。"
  },
  "missing": {
    "en": "Bitly did not return a shortened URL.",
    "zh-Hans": "Bitly 未返回短链接。",
    "zh-Hant": "Bitly 未傳回短連結。",
    "fr": "Bitly n'a pas renvoyé d'URL raccourcie.",
    "ja": "Bitlyが短縮URLを返しませんでした。"
  }
};

function message(key) {
  return openclip.i18n(messages[key]);
}

function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) {
    return openclip.options[name];
  }
  return openclip.option ? openclip.option(name) : undefined;
}

function responseError(status) {
  if (status === 401) return message('token');
  if (status === 403) return message('access');
  if (status === 404) return message('group');
  if (status === 422) return message('link');
  return message('http').replace('{status}', String(status));
}

function normalizeURL(input) {
  var url = String(input || '').trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    throw new Error(message('scheme'));
  }
  return 'https://' + url;
}

// Fetch the default group GUID from /v4/groups using the access token.
// Every Bitly account has at least one group; we use the first one.
async function fetchGroupGuid(accessToken) {
  var response;
  try {
    response = await openclip.fetch('https://api-ssl.bitly.com/v4/groups', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json'
      }
    });
  } catch (_) {
    throw new Error(message('network'));
  }

  if (response.status === 401) throw new Error(message('token'));
  if (response.status === 403) throw new Error(message('access'));
  if (response.status < 200 || response.status >= 300) {
    throw new Error(responseError(response.status));
  }

  var body = '';
  try { body = response.text(); } catch (_) { throw new Error(message('read')); }

  var data = null;
  try { data = JSON.parse(body); } catch (_) { throw new Error(message('invalid')); }

  var guid = data && data.groups && data.groups[0] && data.groups[0].guid;
  if (!guid) throw new Error(message('group'));
  return guid;
}

async function action(selection) {
  var accessToken = String(option('accessToken') || '').trim();
  if (!accessToken) {
    throw new Error(message('setup'));
  }

  var selectedText = typeof selection === 'string'
    ? selection
    : (selection && selection.text) || openclip.input.text;
  var longURL = normalizeURL(selectedText);

  // Auto-fetch the group GUID from the token — no manual configuration needed.
  var groupGuid = await fetchGroupGuid(accessToken);

  var response;
  try {
    response = await openclip.fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        long_url: longURL,
        group_guid: groupGuid
      })
    });
  } catch (_) {
    throw new Error(message('network'));
  }

  var body = '';
  try {
    body = response.text();
  } catch (_) {
    throw new Error(message('read'));
  }

  var data = null;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch (_) {
      if (response.status >= 200 && response.status < 300) {
        throw new Error(message('invalid'));
      }
    }
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(responseError(response.status));
  }
  if (!data || typeof data.link !== 'string' || !/^https?:\/\//i.test(data.link)) {
    throw new Error(message('missing'));
  }

  return data.link;
}

module.exports = action;
module.exports.action = action;
