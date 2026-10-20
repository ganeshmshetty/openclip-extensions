var messages = {
  empty: { en: 'Select some text to use as the issue title.', 'zh-Hans': '请选择要用作议题标题的文本。', 'zh-Hant': '請選取要用作議題標題的文字。', fr: 'Sélectionnez du texte pour le titre du ticket.', ja: 'イシューのタイトルにするテキストを選択してください。' },
  network: { en: 'Could not reach Linear. Check your connection.', 'zh-Hans': '无法连接 Linear。请检查网络。', 'zh-Hant': '無法連線 Linear。請檢查網路。', fr: 'Impossible de joindre Linear. Vérifiez votre connexion.', ja: 'Linearに接続できません。接続を確認してください。' },
  auth: { en: 'Linear rejected the API key. Check it in the extension settings.', 'zh-Hans': 'Linear 拒绝了 API 密钥。请在扩展设置中检查。', 'zh-Hant': 'Linear 拒絕了 API 金鑰。請在擴充功能設定中檢查。', fr: 'Linear a refusé la clé API. Vérifiez-la dans les réglages.', ja: 'LinearがAPIキーを拒否しました。設定を確認してください。' },
  team: { en: 'No Linear team found with key "{key}".', 'zh-Hans': '找不到标识为 "{key}" 的 Linear 团队。', 'zh-Hant': '找不到標識為 "{key}" 的 Linear 團隊。', fr: 'Aucune équipe Linear avec la clé « {key} ».', ja: 'キー「{key}」のLinearチームが見つかりません。' },
  noTeams: { en: 'Your Linear account has no teams.', 'zh-Hans': '您的 Linear 账户没有团队。', 'zh-Hant': '您的 Linear 帳戶沒有團隊。', fr: "Votre compte Linear n'a aucune équipe.", ja: 'Linearアカウントにチームがありません。' },
  failed: { en: 'Linear could not create the issue: {error}', 'zh-Hans': 'Linear 无法创建议题：{error}', 'zh-Hant': 'Linear 無法建立議題：{error}', fr: 'Linear n’a pas pu créer le ticket : {error}', ja: 'Linearでイシューを作成できませんでした：{error}' },
  created: { en: 'Created {id}, link copied', 'zh-Hans': '已创建 {id}，链接已复制', 'zh-Hant': '已建立 {id}，連結已複製', fr: '{id} créé, lien copié', ja: '{id} を作成しリンクをコピーしました' },
  opened: { en: 'Add an API key to create issues directly. Opened Linear instead.', 'zh-Hans': '添加 API 密钥即可直接创建议题。已改为打开 Linear。', 'zh-Hant': '新增 API 金鑰即可直接建立議題。已改為開啟 Linear。', fr: 'Ajoutez une clé API pour créer directement. Linear a été ouvert.', ja: 'APIキーを追加すると直接作成できます。代わりにLinearを開きました。' }
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
  var title = (lines.shift() || '').trim().slice(0, 255);
  return { title: title, description: lines.join('\n').trim() };
}

function fallbackURL(teamKey, issue) {
  var base = teamKey ? 'https://linear.app/team/' + encodeURIComponent(teamKey) + '/new' : 'https://linear.app/new';
  var url = base + '?title=' + encodeURIComponent(issue.title);
  if (issue.description) url += '&description=' + encodeURIComponent(issue.description);
  return url;
}

async function graphql(apiKey, query, variables) {
  var response;
  try {
    response = await openclip.fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, variables: variables || {} })
    });
  } catch (_) {
    throw new Error(message('network'));
  }
  if (response.status === 401 || response.status === 403) throw new Error(message('auth'));
  var data = null;
  try { data = JSON.parse(response.text()); } catch (_) { data = null; }
  if (data && data.errors && data.errors.length) {
    var err = data.errors[0];
    var code = err.extensions && err.extensions.code;
    if (code === 'AUTHENTICATION_ERROR') throw new Error(message('auth'));
    throw new Error(message('failed', { error: err.message || 'unknown error' }));
  }
  if (response.status < 200 || response.status >= 300 || !data || !data.data) {
    throw new Error(message('failed', { error: 'HTTP ' + response.status }));
  }
  return data.data;
}

async function resolveTeamId(apiKey, teamKey) {
  if (teamKey) {
    var byKey = await graphql(apiKey,
      'query($key: String!) { teams(filter: { key: { eqIgnoreCase: $key } }) { nodes { id key } } }',
      { key: teamKey });
    var match = byKey.teams && byKey.teams.nodes && byKey.teams.nodes[0];
    if (!match) throw new Error(message('team', { key: teamKey }));
    return match.id;
  }
  var all = await graphql(apiKey, 'query { teams(first: 1) { nodes { id key } } }');
  var first = all.teams && all.teams.nodes && all.teams.nodes[0];
  if (!first) throw new Error(message('noTeams'));
  return first.id;
}

async function action(selection) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text) || openclip.input.text;
  var issue = splitSelection(text);
  if (!issue.title) throw new Error(message('empty'));

  var apiKey = String(option('apiKey') || '').trim();
  var teamKey = String(option('teamKey') || '').trim();

  if (!apiKey) {
    openclip.openURL(fallbackURL(teamKey, issue));
    openclip.toast(message('opened'), 'info');
    return;
  }

  var teamId = await resolveTeamId(apiKey, teamKey);
  var input = { teamId: teamId, title: issue.title };
  if (issue.description) input.description = issue.description;
  var result = await graphql(apiKey,
    'mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }',
    { input: input });
  var created = result.issueCreate && result.issueCreate.issue;
  if (!result.issueCreate || !result.issueCreate.success || !created || !created.url) {
    throw new Error(message('failed', { error: 'no issue returned' }));
  }
  openclip.copy(created.url);
  openclip.toast(message('created', { id: created.identifier }), 'success');
}

module.exports = action;
module.exports.action = action;
module.exports._test = { splitSelection: splitSelection, fallbackURL: fallbackURL };
