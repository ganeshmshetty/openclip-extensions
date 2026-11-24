// Save to Supermemory: POST the selection to https://api.supermemory.ai/v3/documents
// Docs: https://supermemory.ai/docs/api-reference/manage-documents/add-document
var ENDPOINT = 'https://api.supermemory.ai/v3/documents';
var MAX_CHARS = 100000;

function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) return openclip.options[name];
  return openclip.option ? openclip.option(name) : undefined;
}

// containerTag: max 100 chars, alphanumeric, hyphen, underscore, dot.
function cleanTag(tag) {
  return String(tag || '').trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function buildBody(text, app, containerTag) {
  var metadata = { source: 'openclip', savedAt: new Date().toISOString() };
  if (app && app.name) metadata.app = String(app.name);
  if (app && app.bundleID) metadata.bundleID = String(app.bundleID);
  var body = { content: text, metadata: metadata };
  var tag = cleanTag(containerTag);
  if (tag) body.containerTag = tag;
  return body;
}

function errorDetail(response) {
  try {
    var data = JSON.parse(response.text());
    return (data && (data.error || data.message)) || '';
  } catch (_) { return ''; }
}

async function action(selection) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text) || (openclip.input && openclip.input.text) || '';
  text = String(text).trim();
  if (!text) throw new Error('Select some text to save to Supermemory.');
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  var apiKey = String(option('apiKey') || '').trim();
  if (!apiKey) throw new Error('Add your Supermemory API key in the extension settings.');

  var app = openclip.input && openclip.input.app;
  var response;
  try {
    response = await openclip.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody(text, app, option('containerTag')))
    });
  } catch (_) {
    throw new Error('Could not reach Supermemory. Check your connection.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('Supermemory rejected the API key. Check it in the extension settings.');
  }
  if (response.status < 200 || response.status >= 300) {
    var detail = errorDetail(response);
    throw new Error('Supermemory could not save it (HTTP ' + response.status + (detail ? ': ' + detail : '') + ').');
  }
  openclip.toast('Saved to Supermemory', 'success');
}

module.exports = action;
module.exports.action = action;
module.exports._test = { buildBody: buildBody, cleanTag: cleanTag };
