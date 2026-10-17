// Urlquery · Open on urlquery.net
// Opens the urlquery.net search for the selection's domain (or IP) in the
// browser. Needs no API key, so it works before anything is configured.
// A secondary click (right-click / ⇧-click) copies the search link instead.

var api = require('./lib/api.js');
var urls = require('./lib/url.js');
var fmt = require('./lib/format.js');

function action(selection) {
  var parsed = urls.parse(typeof selection === 'string' ? selection : (openclip.input && openclip.input.text));
  if (!parsed) {
    openclip.toast(fmt.t(fmt.STRINGS.errors.notUrl), 'error');
    return;
  }
  var link = api.searchURL(urls.searchQuery(parsed));
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.copy(link);
    return;
  }
  openclip.openURL(link);
}

module.exports = action;
