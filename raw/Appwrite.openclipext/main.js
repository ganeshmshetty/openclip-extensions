// Appwrite — OpenClip extension
// Command: Execute Function
//
// Sends the current selection to a user-chosen Appwrite Function through the
// Executions API and hands the reply back to OpenClip as text, so the user's
// "When an action returns text" preference decides between result card, paste,
// and copy. A secondary click (right-click / ⇧-click) copies the reply instead.
//
// Contract (kept identical to the starter template's README):
//   body     → the selection, verbatim. Sent as application/json when the selection
//              is a JSON object or array, otherwise as text/plain.
//   headers  → x-openclip-version: 1
//              x-openclip-secondary: true | false
//              x-openclip-app: <bundle id of the app the text was selected in>
//   reply    → plain text, or JSON { "text": "..." }, or JSON { "error": "..." }

// Appwrite API version this extension was tested against. Pinning the response
// format keeps the execution object shape stable if Appwrite ships breaking changes.
var RESPONSE_FORMAT = '2.0.0';
var CONTRACT_VERSION = '1';
var SYNC_EXECUTION_LIMIT_SECONDS = 30;

function option(id) {
  var value = typeof openclip.option === 'function'
    ? openclip.option(id)
    : (openclip.options || {})[id];
  return value == null ? '' : String(value).trim();
}

function normalizeEndpoint(raw) {
  var endpoint = raw.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(endpoint)) endpoint = 'https://' + endpoint;
  if (!/\/v1$/i.test(endpoint)) endpoint += '/v1';
  return endpoint;
}

function hostOf(url) {
  var match = /^https?:\/\/([^\/]+)/i.exec(url);
  return match ? match[1] : url;
}

function firstLine(value) {
  var lines = String(value == null ? '' : value).split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim()) return lines[i].trim();
  }
  return '';
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return undefined;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// A selection counts as JSON when it is a well-formed object or array. Bare
// numbers/strings/booleans are deliberately treated as text.
function looksLikeJson(text) {
  var trimmed = text.trim();
  var first = trimmed.charAt(0);
  if (first !== '{' && first !== '[') return false;
  return parseJson(trimmed) !== undefined;
}

function fail(message) {
  openclip.toast(message, 'error');
}

// Map an Appwrite API error ({ message, code, type }) to a readable toast.
function describeApiError(status, data, host) {
  var type = isPlainObject(data) && typeof data.type === 'string' ? data.type : '';
  var message = isPlainObject(data) ? firstLine(data.message) : '';

  if (type === 'project_not_found') {
    return 'Project not found at ' + host + '. Check the project ID and the region in the endpoint.';
  }
  if (type === 'function_not_found' || (status === 404 && !type)) {
    return 'Function not found in this project. Check the function ID and the endpoint region.';
  }
  if (type === 'deployment_not_found' || type === 'build_not_ready') {
    return 'The function has no ready deployment yet. Deploy it in the Appwrite Console first.';
  }
  if (status === 401 || status === 403) {
    return 'Not allowed to execute this function. Check the API key, or set the function’s execute access to Any.';
  }
  if (type === 'function_synchronous_timeout' || status === 408) {
    return 'The function timed out. Synchronous executions must finish within ' + SYNC_EXECUTION_LIMIT_SECONDS + ' seconds.';
  }
  if (status === 429) {
    return 'Appwrite rate-limited this request. Try again in a minute.';
  }
  return 'Appwrite error ' + (status || '') + (message ? ': ' + message : '.');
}

async function action(selection) {
  var input = openclip.input || {};
  var text = typeof selection === 'string' ? selection : (input.text || '');
  var secondary = !!input.isSecondaryClick;
  var sourceApp = input.app && input.app.bundleID ? String(input.app.bundleID) : '';

  var endpoint = option('endpoint');
  var projectId = option('projectId');
  var functionId = option('functionId');
  var apiKey = option('apiKey');

  var missing = [];
  if (!endpoint) missing.push('endpoint');
  if (!projectId) missing.push('projectId');
  if (!functionId) missing.push('functionId');
  if (missing.length) {
    openclip.requireConfiguration({
      reason: 'Enter the Appwrite endpoint, project ID, and function ID to run.',
      missing: missing
    });
    return;
  }

  var base = normalizeEndpoint(endpoint);
  var host = hostOf(base);
  var url = base + '/functions/' + encodeURIComponent(functionId) + '/executions';

  var headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Response-Format': RESPONSE_FORMAT
  };
  if (apiKey) headers['X-Appwrite-Key'] = apiKey;

  var functionHeaders = {
    'content-type': looksLikeJson(text) ? 'application/json' : 'text/plain; charset=utf-8',
    'x-openclip-version': CONTRACT_VERSION,
    'x-openclip-secondary': secondary ? 'true' : 'false'
  };
  if (sourceApp) functionHeaders['x-openclip-app'] = sourceApp;

  var execution = {
    body: text,
    async: false,
    path: '/',
    method: 'POST',
    headers: functionHeaders
  };

  var res;
  try {
    res = await openclip.fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(execution) });
  } catch (e) {
    var reason = e && e.message ? e.message : 'Check your connection and the endpoint.';
    fail('Could not reach ' + host + '. ' + reason);
    return;
  }

  var status = Number(res.status) || 0;
  var ok = typeof res.ok === 'boolean' ? res.ok : (status >= 200 && status < 300);
  var data = parseJson(typeof res.text === 'function' ? res.text() : '');

  if (!ok) {
    fail(describeApiError(status, data, host));
    return;
  }
  if (!isPlainObject(data)) {
    fail('Unexpected reply from Appwrite: not an execution object.');
    return;
  }

  if (data.status === 'failed') {
    var detail = firstLine(data.errors);
    if (detail) {
      fail('Function failed: ' + detail);
    } else if (apiKey) {
      fail('Function execution failed. Check the execution logs in the Appwrite Console.');
    } else {
      fail('Function execution failed. Add an API key to see the error here, or check the logs in the Appwrite Console.');
    }
    return;
  }
  if (data.status !== 'completed') {
    fail('Function did not finish (status: ' + (data.status || 'unknown') + ').');
    return;
  }

  var reply = typeof data.responseBody === 'string' ? data.responseBody : '';
  var code = Number(data.responseStatusCode) || 0;

  var replyJson = parseJson(reply);
  if (isPlainObject(replyJson)) {
    if (replyJson.error != null && replyJson.error !== '') {
      var errorText = typeof replyJson.error === 'string' ? replyJson.error : JSON.stringify(replyJson.error);
      fail(firstLine(errorText));
      return;
    }
    if (typeof replyJson.text === 'string') reply = replyJson.text;
  }

  if (code && (code < 200 || code >= 300)) {
    var snippet = firstLine(reply);
    fail('Function returned HTTP ' + code + (snippet ? ': ' + snippet : '.'));
    return;
  }

  if (!reply.trim()) {
    openclip.toast('Function returned no text', 'success');
    return;
  }

  if (secondary) {
    openclip.copy(reply);
    return;
  }
  return reply;
}

module.exports = action;
module.exports.action = action;
