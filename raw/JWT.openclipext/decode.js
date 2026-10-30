// JWT · Decode JWT
// One line of expiry status ("Expires in 52 minutes"), a blank line, then the
// payload as pretty-printed JSON (raw text when it is not JSON).

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
  var status = fmt.expiryMessage(jwt.status(parsed.payload));
  var body = parsed.payloadIsJson ? JSON.stringify(parsed.payload, null, 2) : parsed.payloadText;
  return status + '\n\n' + body;
}

module.exports = action;
