function getOption(id, fallback) {
  var val;
  if (typeof openclip.option === 'function') {
    val = openclip.option(id);
  } else if (openclip.options && openclip.options[id] !== undefined) {
    val = openclip.options[id];
  }
  return (val !== undefined && val !== null && val !== '') ? val : fallback;
}

function action(selection) {
  var text = (typeof selection === 'string'
    ? selection
    : (selection && selection.text) || (openclip.input && openclip.input.text) || ''
  ).trim();

  if (!text) {
    return;
  }

  var when = String(getOption('when', 'inbox')).trim().toLowerCase();
  var splitVal = getOption('splitNotes', false);
  var splitNotes = (splitVal === true || splitVal === 'true');
  var list = String(getOption('list', '')).trim();
  var tags = String(getOption('tags', '')).trim();

  var isSecondary = Boolean(openclip.input && openclip.input.isSecondaryClick);

  var title = text;
  var notes = '';

  if (splitNotes) {
    var lines = text.split(/\r?\n/);
    var firstNonEmpty = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        firstNonEmpty = i;
        break;
      }
    }
    if (firstNonEmpty !== -1) {
      title = lines[firstNonEmpty].trim();
      notes = lines.slice(firstNonEmpty + 1).join('\n').trim();
    }
  }

  var params = [];
  params.push('title=' + encodeURIComponent(title));

  if (notes) {
    params.push('notes=' + encodeURIComponent(notes));
  }

  if (when && when !== 'inbox') {
    params.push('when=' + encodeURIComponent(when));
  }

  if (list) {
    params.push('list=' + encodeURIComponent(list));
  }

  if (tags) {
    params.push('tags=' + encodeURIComponent(tags));
  }

  // Right-click / Shift-click opens Things' Quick Entry HUD pre-populated
  if (isSecondary) {
    params.push('show-quick-entry=true');
  }

  var url = 'things:///add?' + params.join('&');
  openclip.openURL(url);
}

module.exports = action;
module.exports.action = action;
