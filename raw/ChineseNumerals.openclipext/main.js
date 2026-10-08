// Chinese Numerals
// Converts the selection per the "style" option; shown live as an inline preview.

var convert = require('./lib/convert.js');

function action(selection) {
  var plain = openclip.option('style') === convert.PLAIN_STYLE;
  try {
    return plain ? convert.toNumber(selection) : convert.toAmount(selection);
  } catch (e) {
    openclip.toast(convert.errorMessage(e), 'error');
  }
}

module.exports = action;
