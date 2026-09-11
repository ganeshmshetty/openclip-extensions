// JWT · Decode Payload
// Returns the payload as pretty-printed JSON (raw text when it is not JSON).

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
  if (!parsed.payloadIsJson) return parsed.payloadText;
  return JSON.stringify(parsed.payload, null, 2);
}

module.exports = action;
