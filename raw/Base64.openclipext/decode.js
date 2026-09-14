function action(sel) {
  var str = (sel || openclip.input.text).trim();
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) str += '=';

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var bytes = [];
  for (var i = 0; i < str.length; i += 4) {
    var c0 = chars.indexOf(str[i]);
    var c1 = chars.indexOf(str[i + 1]);
    var c2 = str[i + 2] === '=' ? 0 : chars.indexOf(str[i + 2]);
    var c3 = str[i + 3] === '=' ? 0 : chars.indexOf(str[i + 3]);
    if (c0 < 0 || c1 < 0) break;
    bytes.push((c0 << 2) | (c1 >> 4));
    if (str[i + 2] !== '=') bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (str[i + 3] !== '=') bytes.push(((c2 & 3) << 6) | c3);
  }

  var result = '';
  var j = 0;
  while (j < bytes.length) {
    var b0 = bytes[j++];
    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      var b1 = bytes[j++];
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      var b1 = bytes[j++];
      var b2 = bytes[j++];
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else if (b0 >= 0xf0) {
      var b1 = bytes[j++];
      var b2 = bytes[j++];
      var b3 = bytes[j++];
      var cp = (((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)) - 0x10000;
      result += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return result;
}

module.exports = action;
module.exports.action = action;
