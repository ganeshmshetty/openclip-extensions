function action(selection) {
  var text = (typeof selection === 'string'
    ? selection
    : (selection && selection.text) || (openclip.input && openclip.input.text) || ''
  ).trim();

  if (!text) {
    return;
  }

  var defaultAction = (openclip.options && openclip.options.defaultAction) ||
                      (openclip.option ? openclip.option('defaultAction') : '') ||
                      'create';

  var isSecondary = Boolean(openclip.input && openclip.input.isSecondaryClick);

  // Left-click (primary) creates note by default; Right-click (secondary) appends to current note
  var shouldAppend = (defaultAction === 'append') ? !isSecondary : isSecondary;

  var endpoint = shouldAppend ? 'appendToCurrent' : 'createNote';
  var url = 'antinote://x-callback-url/' + endpoint + '?content=' + encodeURIComponent(text);

  openclip.openURL(url);
}

module.exports = action;
module.exports.action = action;
