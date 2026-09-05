function getSeparator(options) {
  var opt = (options && options.separator) || openclip.option('separator') || 'newline';
  if (opt === 'space') return ' ';
  if (opt === 'comma') return ', ';
  if (opt === 'none') return '';
  return '\n';
}

function action(text, options) {
  if (!text) return;
  var current = openclip.pasteboard.text || '';
  var isSecondary = Boolean(openclip.input && openclip.input.isSecondaryClick);

  if (!current) {
    openclip.pasteboard.text = text;
  } else {
    var sep = getSeparator(options);
    if (isSecondary) {
      openclip.pasteboard.text = text + sep + current;
    } else {
      openclip.pasteboard.text = current + sep + text;
    }
  }
}
