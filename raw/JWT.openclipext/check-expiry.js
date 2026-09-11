// JWT · Check Expiry
// One-line toast: "Expires in 14 minutes · Sep 10, 2026, 22:15" (success),
// "Expired 3 hours ago · …" (error), "Not valid yet …" (info), or a note that
// the token has no exp claim. A secondary click copies the message instead.

var jwt = require('./lib/jwt.js');
var fmt = require('./lib/format.js');

var STYLES = { valid: 'success', expired: 'error', 'not-yet': 'info', 'no-exp': 'info' };

function action(selection) {
  var parsed;
  try {
    parsed = jwt.parse(selection);
  } catch (e) {
    openclip.toast(fmt.errorMessage(e), 'error');
    return;
  }
  var state = jwt.status(parsed.payload);
  var message = fmt.expiryMessage(state);
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.copy(message);
    return;
  }
  openclip.toast(message, STYLES[state.kind] || 'info');
}

module.exports = action;
