function action(sel) {
  var page = (openclip.options && openclip.options.page) || (openclip.option ? openclip.option('page') : '') || '1';
  var text = sel || openclip.input.text;
  openclip.openURL('tot://' + encodeURIComponent(page) + '/append?text=' + encodeURIComponent(text));
}

module.exports = action;
module.exports.action = action;
