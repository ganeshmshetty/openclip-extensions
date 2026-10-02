// Zapier — OpenClip extension
// Command: Send to Zapier
//
// Sends selected text and contextual metadata (source application, bundle ID,
// timestamp) to a user-configured Zapier Catch Hook webhook URL.

function option(id) {
  var value = typeof openclip.option === 'function'
    ? openclip.option(id)
    : (openclip.options || {})[id];
  return value == null ? '' : String(value).trim();
}

function normalizeUrl(raw) {
  var url = String(raw == null ? '' : raw).trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

async function action(selection) {
  var input = openclip.input || {};
  var text = typeof selection === 'string' ? selection : (input.text || '');
  var secondary = !!input.isSecondaryClick;
  var app = input.app || {};
  var appName = app.name ? String(app.name) : '';
  var bundleID = app.bundleID ? String(app.bundleID) : '';

  var rawUrl = option('webhookUrl');
  var secretToken = option('secretHeader');

  if (!rawUrl) {
    openclip.requireConfiguration({
      reason: 'Paste your Zapier Catch Hook URL to trigger automations.',
      missing: ['webhookUrl']
    });
    return;
  }

  var webhookUrl = normalizeUrl(rawUrl);

  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'User-Agent': 'OpenClip-Zapier/1.0'
  };

  if (secretToken) {
    headers['X-Zapier-Token'] = secretToken;
    headers['X-Webhook-Secret'] = secretToken;
  }

  var payload = {
    text: text,
    sourceApp: appName,
    bundleId: bundleID,
    timestamp: new Date().toISOString(),
    isSecondaryClick: secondary
  };

  var res;
  try {
    res = await openclip.fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    var errorMsg = err && err.message ? err.message : 'Network connection failed.';
    openclip.toast('Could not reach Zapier: ' + errorMsg, 'error');
    return;
  }

  var status = Number(res.status) || 0;
  var ok = typeof res.ok === 'boolean' ? res.ok : (status >= 200 && status < 300);

  if (ok) {
    openclip.toast('Sent to Zapier', 'success');
  } else {
    openclip.toast('Zapier returned HTTP ' + status, 'error');
  }
}

module.exports = action;
module.exports.action = action;
