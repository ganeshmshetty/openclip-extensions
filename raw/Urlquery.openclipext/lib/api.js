// Thin client for the urlquery.net public REST API (https://urlquery.net/doc/api/public/v1).
//
// Every endpoint needs an API key in the `x-apikey` header. The key comes from
// the command's "API key" option, which OpenClip keeps in its secret store.
// Errors are surfaced as ApiError with a stable `code` so commands can pick a
// localized message (see lib/format.js).

var BASE = 'https://api.urlquery.net/public/v1';
var WEB = 'https://urlquery.net';
var HOST = 'api.urlquery.net';

function ApiError(code, status, detail) {
  this.name = 'ApiError';
  this.code = code;          // network | unauthorized | forbidden | not-found | rate-limited | invalid | http
  this.status = status || 0; // HTTP status, 0 for network failures
  this.detail = detail || '';
  this.message = code + (status ? ' (' + status + ')' : '') + (detail ? ': ' + detail : '');
}
ApiError.prototype = Object.create(Error.prototype);

function isApiError(error) {
  return !!(error && error.name === 'ApiError');
}

// ---------------------------------------------------------------- options

function option(id) {
  if (typeof openclip === 'undefined' || !openclip) return '';
  var value = typeof openclip.option === 'function'
    ? openclip.option(id)
    : (openclip.options || {})[id];
  return value == null ? '' : String(value).trim();
}

// ---------------------------------------------------------------- transport

function parseJson(text) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch (e) {
    return undefined;
  }
}

function codeFor(status) {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limited';
  if (status === 400 || status === 422) return 'invalid';
  return 'http';
}

// Best-effort human detail from an error body: JSON message fields, or the
// first short line of a plain-text body. HTML error pages yield nothing.
function detailFrom(data, text) {
  if (data && typeof data === 'object') {
    var fields = ['message', 'error', 'detail', 'msg'];
    for (var i = 0; i < fields.length; i++) {
      var value = data[fields[i]];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  }
  var line = String(text || '').split(/\r?\n/)[0].trim();
  if (!line || line.charAt(0) === '<' || line.length > 140) return '';
  return line;
}

async function request(path, init) {
  var fetchFn = (typeof openclip !== 'undefined' && openclip && openclip.fetch) || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) throw new ApiError('network', 0, 'fetch is not available in this runtime');

  var headers = { 'x-apikey': option('apiKey'), 'Accept': 'application/json' };
  var opts = { method: (init && init.method) || 'GET', headers: headers };
  if (init && init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
  }

  var res;
  try {
    res = await fetchFn(BASE + path, opts);
  } catch (e) {
    throw new ApiError('network', 0, e && e.message ? String(e.message) : '');
  }

  var status = Number(res.status) || 0;
  var text = typeof res.text === 'function' ? String(res.text() || '') : '';
  var data = parseJson(text);
  var ok = typeof res.ok === 'boolean' ? res.ok : (status >= 200 && status < 300);
  if (!ok) throw new ApiError(codeFor(status), status, detailFrom(data, text));
  return { status: status, data: data, text: text };
}

// ---------------------------------------------------------------- endpoints

// POST /submit/url → { queue_id, report_id, status, url, ... }
async function submit(url, access) {
  var body = { url: url };
  if (access) body.access = access;
  return (await request('/submit/url', { method: 'POST', body: body })).data || {};
}

// GET /submit/status/{queue_id} → same job object; report_id set once finished.
async function queueStatus(queueId) {
  return (await request('/submit/status/' + encodeURIComponent(queueId))).data || {};
}

// GET /report/{id}/overview → report without transactions and alert details.
async function reportOverview(reportId) {
  return (await request('/report/' + encodeURIComponent(reportId) + '/overview')).data || {};
}

// GET /report/{id} → full report including sensors.{urlquery,ids,analyzer}.
async function report(reportId) {
  return (await request('/report/' + encodeURIComponent(reportId))).data || {};
}

// GET /reputation/check/?query= → { url, verdict }
async function reputation(query) {
  return (await request('/reputation/check/?query=' + encodeURIComponent(query))).data || {};
}

// GET /recent/reports/domain/{domain}?limit= → list of report overviews.
async function recentByDomain(domain, limit) {
  return listFrom((await request('/recent/reports/domain/' + encodeURIComponent(domain) + '?limit=' + (limit || 10))).data);
}

// GET /recent/reports/ip/{ip}?limit= → list of report overviews.
async function recentByIp(ip, limit) {
  return listFrom((await request('/recent/reports/ip/' + encodeURIComponent(ip) + '?limit=' + (limit || 10))).data);
}

// The recent/search endpoints return either a bare array or an envelope
// ({ reports: [...] } like the search endpoint). Accept both.
function listFrom(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.reports)) return data.reports;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
}

// ---------------------------------------------------------------- job status

// The OpenAPI spec says "completed"; the official Go client checks "done".
function isDone(status) {
  var s = String(status || '').toLowerCase();
  return s === 'completed' || s === 'done' || s === 'finished';
}

function isFailed(status) {
  var s = String(status || '').toLowerCase();
  return s === 'failed' || s === 'error' || s === 'cancelled' || s === 'canceled';
}

// ---------------------------------------------------------------- web links

function reportURL(reportId) {
  return WEB + '/report/' + encodeURIComponent(reportId);
}

function queueURL(queueId) {
  return WEB + '/queue/' + encodeURIComponent(queueId);
}

function searchURL(query) {
  return WEB + '/search?q=' + encodeURIComponent(query);
}

// ---------------------------------------------------------------- timing

// Resolves after `ms`. OpenClip's JavaScriptCore host has no timers, so when
// setTimeout is missing this spins on the clock. Callers only wait a few
// seconds between polls for under a minute in total, so the cost is bounded.
function wait(ms) {
  if (typeof setTimeout === 'function') {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
  return new Promise(function (resolve) {
    var until = Date.now() + ms;
    while (Date.now() < until) { /* spin: no timer available */ }
    resolve();
  });
}

module.exports = {
  HOST: HOST,
  ApiError: ApiError,
  isApiError: isApiError,
  option: option,
  request: request,
  submit: submit,
  queueStatus: queueStatus,
  reportOverview: reportOverview,
  report: report,
  reputation: reputation,
  recentByDomain: recentByDomain,
  recentByIp: recentByIp,
  isDone: isDone,
  isFailed: isFailed,
  reportURL: reportURL,
  queueURL: queueURL,
  searchURL: searchURL,
  wait: wait
};
