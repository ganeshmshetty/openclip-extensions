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
    '&nbsp;': '\u00a0'
  };

  function codePointToString(code) {
    if (!isFinite(code) || code <= 0 || code > 0x10ffff ||
        (code >= 0xd800 && code <= 0xdfff)) {
      return '\ufffd';
    }
    if (code <= 0xffff) return String.fromCharCode(code);
    var cp = code - 0x10000;
    return String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
  }

  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, function(match) {
    if (map[match]) return map[match];
    if (match.slice(0, 3).toLowerCase() === '&#x') {
      return codePointToString(parseInt(match.slice(3, -1), 16));
    }
    if (match.charAt(1) === '#') {
      return codePointToString(parseInt(match.slice(2, -1), 10));
    }
    return match;
  });
}

module.exports = action;
module.exports.action = action;
