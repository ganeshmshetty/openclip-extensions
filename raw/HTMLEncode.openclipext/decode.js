function action(sel) {
  var text = sel || openclip.input.text;
  if (!text) return '';
  var map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };
  return text.replace(/&(#?[a-zA-Z0-9]+);/g, function(match) {
    if (map[match]) return map[match];
    if (match.startsWith('&#x') || match.startsWith('&#X')) {
      var code = parseInt(match.slice(3, -1), 16);
      return !isNaN(code) ? String.fromCharCode(code) : match;
    }
    if (match.startsWith('&#')) {
      var code = parseInt(match.slice(2, -1), 10);
      return !isNaN(code) ? String.fromCharCode(code) : match;
    }
    return match;
  });
}

module.exports = action;
module.exports.action = action;
