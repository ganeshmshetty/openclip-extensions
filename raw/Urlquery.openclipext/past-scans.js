// Urlquery · Past Scans
// Lists reports urlquery already has for the selection's exact hostname (or IP),
// newest first, without submitting a new scan. The full hostname is used, so
// `animal-tracker.appwrite.network` is not collapsed to `appwrite.network`.
// Delivered as text, so OpenClip's "when an action returns text" preference
// decides between the result card, paste, and copy. A secondary click
// (right-click / ⇧-click) opens the same search on urlquery.net instead.

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
  var query = urls.searchQuery(parsed);
  var searchLink = api.searchURL(query);
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.openURL(searchLink);
    return;
  }

  var found;
  try {
    found = await api.search(query, LIMIT);
  } catch (e) {
    if (api.isApiError(e) && e.code === 'not-found') {
      found = { reports: [], totalHits: 0 };
    } else if (api.isApiError(e) && e.code === 'unauthorized') {
      openclip.requireConfiguration({ reason: fmt.errorMessage(e), missing: ['apiKey'] });
      return;
    } else {
      openclip.toast(fmt.errorMessage(e), 'error');
      return;
    }
  }

  if (!found.reports.length) {
    openclip.toast(fmt.fill(fmt.t(fmt.STRINGS.history.none), { target: parsed.host }), 'info');
    return;
  }
  return fmt.historyReport(parsed.host, found.reports, searchLink, found.totalHits);
}

module.exports = action;
