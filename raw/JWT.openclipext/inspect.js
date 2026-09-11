// JWT · Inspect
// Returns a human-readable report: token status first, then algorithm, then
// every claim with standard names and humanized timestamps. Delivered as text,
// so OpenClip's "when an action returns text" preference decides between the
// result card, paste, and copy.

var jwt = require('./lib/jwt.js');
var fmt = require('./lib/format.js');

function action(selection) {
  var parsed;
  try {
    parsed = jwt.parse(selection);
  } catch (e) {
    openclip.toast(fmt.errorMessage(e), 'error');
    return;
  }
  return fmt.inspectReport(parsed);
}

module.exports = action;
