// JWT · Decode Header
// Returns the JOSE header as pretty-printed JSON.

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
  return JSON.stringify(parsed.header, null, 2);
}

module.exports = action;
