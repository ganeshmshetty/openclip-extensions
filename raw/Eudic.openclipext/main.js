// Eudic lookup. Both editions register the eudic:// scheme, so the edition option
// only picks the URL scheme used; add an entry here if an edition uses another one.
var SCHEMES = {
  'Eudic Lite': 'eudic',
  'Eudic Enhanced': 'eudic'
};

function action(selection) {
  var word = (typeof selection === 'string' ? selection : openclip.input.text || '').trim();
  if (!word) return;

  var edition = openclip.option('edition') || 'Eudic Lite';
  var scheme = SCHEMES[edition] || SCHEMES['Eudic Lite'];
  openclip.openURL(scheme + '://dict/' + encodeURIComponent(word));
}

module.exports = action;
module.exports.action = action;
