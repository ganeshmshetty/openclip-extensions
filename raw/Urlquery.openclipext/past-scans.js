// Urlquery · Past Scans
// Lists reports urlquery already has for the selection's domain (or IP), newest
// first, without submitting a new scan. Delivered as text, so OpenClip's "when
// an action returns text" preference decides between the result card, paste,
// and copy. A secondary click (right-click / ⇧-click) opens the domain search
// on urlquery.net instead.

var api = require('./lib/api.js');
var urls = require('./lib/url.js');
var fmt = require('./lib/format.js');

var LIMIT = 10;

async function action(selection) {
  var parsed = urls.parse(typeof selection === 'string' ? selection : (openclip.input && openclip.input.text));
  if (!parsed) {
    openclip.toast(fmt.t(fmt.STRINGS.errors.notUrl), 'error');
    return;
  }
  var searchLink = api.searchURL(urls.searchQuery(parsed));
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.openURL(searchLink);
    return;
  }

  var reports;
  try {
    reports = parsed.kind === 'ip'
      ? await api.recentByIp(parsed.host, LIMIT)
      : await api.recentByDomain(parsed.domain, LIMIT);
  } catch (e) {
    if (api.isApiError(e) && e.code === 'not-found') {
      reports = [];
    } else if (api.isApiError(e) && e.code === 'unauthorized') {
      openclip.requireConfiguration({ reason: fmt.errorMessage(e), missing: ['apiKey'] });
      return;
    } else {
      openclip.toast(fmt.errorMessage(e), 'error');
      return;
    }
  }

  if (!reports.length) {
    openclip.toast(fmt.fill(fmt.t(fmt.STRINGS.history.none), { domain: parsed.domain }), 'info');
    return;
  }
  return fmt.historyReport(parsed.domain, reports, searchLink);
}

module.exports = action;
