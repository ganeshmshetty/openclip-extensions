function action(selection) {
  var word = (typeof selection === 'string' ? selection : openclip.input.text || '').trim();
  if (!word) return;

  openclip.openURL('eudic://dict/' + encodeURIComponent(word));
}

module.exports = action;
module.exports.action = action;
