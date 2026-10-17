// Traditional -> Simplified, shown live as an inline preview.

var convert = require('./lib/convert.js');

function action(selection) {
  var result = convert.toSimplified(selection, openclip.option('variant'));
  if (result !== selection) return result;
}

module.exports = action;
