var messages = {
  empty: { en: 'Select some text to use as the issue summary.', 'zh-Hans': '请选择要用作事务摘要的文本。', 'zh-Hant': '請選取要用作問題摘要的文字。', fr: 'Sélectionnez du texte pour le résumé du ticket.', ja: '課題の要約にするテキストを選択してください。' },
  setup: { en: 'Set your Jira site URL in the extension settings.', 'zh-Hans': '请在扩展设置中填写 Jira 站点网址。', 'zh-Hant': '請在擴充功能設定中填寫 Jira 網站網址。', fr: 'Indiquez l’URL de votre site Jira dans les réglages.', ja: '拡張機能の設定でJiraのサイトURLを設定してください。' },
  missing: { en: 'Set your Jira email and project key to create issues with the API token.', 'zh-Hans': '请填写 Jira 电子邮件和项目键以使用 API 令牌创建事务。', 'zh-Hant': '請填寫 Jira 電子郵件和專案鍵以使用 API 權杖建立問題。', fr: 'Indiquez votre e-mail et la clé du projet Jira pour utiliser le jeton API.', ja: 'APIトークンで作成するにはメールアドレスとプロジェクトキーを設定してください。' },
  network: { en: 'Could not reach Jira. Check the site URL and your connection.', 'zh-Hans': '无法连接 Jira。请检查站点网址和网络。', 'zh-Hant': '無法連線 Jira。請檢查網站網址和網路。', fr: 'Impossible de joindre Jira. Vérifiez l’URL et la connexion.', ja: 'Jiraに接続できません。URLと接続を確認してください。' },
  auth: { en: 'Jira rejected the email or API token.', 'zh-Hans': 'Jira 拒绝了电子邮件或 API 令牌。', 'zh-Hant': 'Jira 拒絕了電子郵件或 API 權杖。', fr: 'Jira a refusé l’e-mail ou le jeton API.', ja: 'Jiraがメールアドレスまたはトークンを拒否しました。' },
  failed: { en: 'Jira could not create the issue: {error}', 'zh-Hans': 'Jira 无法创建事务：{error}', 'zh-Hant': 'Jira 無法建立問題：{error}', fr: 'Jira n’a pas pu créer le ticket : {error}', ja: 'Jiraで課題を作成できませんでした：{error}' },
  created: { en: 'Created {id}, link copied', 'zh-Hans': '已创建 {id}，链接已复制', 'zh-Hant': '已建立 {id}，連結已複製', fr: '{id} créé, lien copié', ja: '{id} を作成しリンクをコピーしました' },
  opened: { en: 'Add an API token to create issues directly. Opened Jira instead.', 'zh-Hans': '添加 API 令牌即可直接创建事务。已改为打开 Jira。', 'zh-Hant': '新增 API 權杖即可直接建立問題。已改為開啟 Jira。', fr: 'Ajoutez un jeton API pour créer directement. Jira a été ouvert.', ja: 'APIトークンを追加すると直接作成できます。代わりにJiraを開きました。' }
};

function message(key, vars) {
  var dict = messages[key];
  var text = openclip.i18n ? openclip.i18n(dict) : dict.en;
  Object.keys(vars || {}).forEach(function (k) { text = text.replace('{' + k + '}', vars[k]); });
  return text;
}

function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) return openclip.options[name];
  return openclip.option ? openclip.option(name) : undefined;
}

function splitSelection(text) {
  var lines = String(text || '').replace(/\r\n?/g, '\n').trim().split('\n');
  var summary = (lines.shift() || '').trim().slice(0, 255);
  return { summary: summary, description: lines.join('\n').trim() };
}

function normalizeSite(url) {
  var site = String(url || '').trim().replace(/\/+$/, '');
  if (!site || /your-domain\.atlassian\.net/i.test(site)) return '';
  if (!/^https?:\/\//i.test(site)) site = 'https://' + site;
  return site;
}

// Atlassian Document Format: one paragraph per blank-line-separated block, hardBreak between lines.
function toADF(text) {
  var blocks = String(text || '').split(/\n\s*\n/).filter(function (b) { return b.trim(); });
  return {
    type: 'doc',
    version: 1,
    content: blocks.map(function (block) {
      var content = [];
      block.split('\n').forEach(function (line, i) {
        if (i > 0) content.push({ type: 'hardBreak' });
        if (line) content.push({ type: 'text', text: line });
      });
      return { type: 'paragraph', content: content };
    })
  };
}

function base64(str) {
  var bytes = unescape(encodeURIComponent(str));
  if (typeof btoa === 'function') return btoa(bytes);
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var out = '';
  for (var i = 0; i < bytes.length; i += 3) {
    var a = bytes.charCodeAt(i), b = bytes.charCodeAt(i + 1), c = bytes.charCodeAt(i + 2);
    var n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] +
      (i + 1 < bytes.length ? chars[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? chars[n & 63] : '=');
  }
  return out;
}

function fallbackURL(site, issue) {
  var url = site + '/secure/CreateIssueDetails!init.jspa?summary=' + encodeURIComponent(issue.summary);
  if (issue.description) url += '&description=' + encodeURIComponent(issue.description);
  return url;
}

function errorText(data, status) {
  if (data) {
    if (data.errorMessages && data.errorMessages.length) return data.errorMessages.join(' ');
    if (data.errors) {
      var parts = Object.keys(data.errors).map(function (k) { return k + ': ' + data.errors[k]; });
      if (parts.length) return parts.join('; ');
    }
  }
  return 'HTTP ' + status;
}

async function action(selection) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text) || openclip.input.text;
  var issue = splitSelection(text);
  if (!issue.summary) throw new Error(message('empty'));

  var site = normalizeSite(option('siteUrl'));
  if (!site) throw new Error(message('setup'));

  var token = String(option('apiToken') || '').trim();
  if (!token) {
    openclip.openURL(fallbackURL(site, issue));
    openclip.toast(message('opened'), 'info');
    return;
  }

  var email = String(option('email') || '').trim();
  var projectKey = String(option('projectKey') || '').trim().toUpperCase();
  var issueType = String(option('issueType') || '').trim() || 'Task';
  if (!email || !projectKey) throw new Error(message('missing'));

  var fields = { project: { key: projectKey }, summary: issue.summary, issuetype: { name: issueType } };
  if (issue.description) fields.description = toADF(issue.description);

  var response;
  try {
    response = await openclip.fetch(site + '/rest/api/3/issue', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + base64(email + ':' + token),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fields })
    });
  } catch (_) {
    throw new Error(message('network'));
  }

  var data = null;
  try { data = JSON.parse(response.text()); } catch (_) { data = null; }
  if (response.status === 401 || response.status === 403) throw new Error(message('auth'));
  if (response.status < 200 || response.status >= 300 || !data || !data.key) {
    throw new Error(message('failed', { error: errorText(data, response.status) }));
  }

  openclip.copy(site + '/browse/' + data.key);
  openclip.toast(message('created', { id: data.key }), 'success');
}

module.exports = action;
module.exports.action = action;
module.exports._test = { splitSelection: splitSelection, toADF: toADF, base64: base64, fallbackURL: fallbackURL, normalizeSite: normalizeSite };
