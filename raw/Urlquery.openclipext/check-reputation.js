// Urlquery · Check Reputation
// One request, one toast: "Flagged as phishing · example.com" (error) or
// "No reputation alerts · example.com" (success). This is a lookup against
// urlquery's reputation data; it does not run a new scan. A secondary click
// (right-click / ⇧-click) copies the message instead of showing it.

var api = require('./lib/api.js');
var urls = require('./lib/url.js');
var fmt = require('./lib/format.js');

var CLEAN_VERDICTS = { '': true, clean: true, none: true, unknown: true, ok: true, safe: true, benign: true };

function deliver(message, style) {
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.copy(message);
    return;
  }
  openclip.toast(message, style);
}

async function action(selection) {
  var parsed = urls.parse(typeof selection === 'string' ? selection : (openclip.input && openclip.input.text));
  if (!parsed) {
    openclip.toast(fmt.t(fmt.STRINGS.errors.notUrl), 'error');
    return;
  }

  var result;
  try {
    result = await api.reputation(parsed.input);
  } catch (e) {
    if (api.isApiError(e) && e.code === 'not-found') {
      deliver(fmt.fill(fmt.t(fmt.STRINGS.reputation.noData), { host: parsed.display }), 'info');
      return;
    }
    if (api.isApiError(e) && e.code === 'unauthorized') {
      openclip.requireConfiguration({ reason: fmt.errorMessage(e), missing: ['apiKey'] });
      return;
    }
    openclip.toast(fmt.errorMessage(e), 'error');
    return;
  }

  var verdict = String(result && result.verdict != null ? result.verdict : '').trim().toLowerCase();
  if (CLEAN_VERDICTS[verdict]) {
    deliver(fmt.fill(fmt.t(fmt.STRINGS.reputation.clean), { host: parsed.display }), 'success');
    return;
  }
  deliver(fmt.fill(fmt.t(fmt.STRINGS.reputation.flagged), { verdict: fmt.verdictLabel(verdict), host: parsed.display }), 'error');
}

module.exports = action;
