function action(sel) {
  var text = (sel || openclip.input.text).trim();
  if (!/^-?\d+$/.test(text)) return null;
  var num = parseInt(text, 10);
  if (isNaN(num)) return null;

  // Heuristic: values above the 32-bit unsigned seconds ceiling (2106-02-07,
  // 4294967295) are milliseconds; everything else is seconds. This keeps plain
  // 10-digit second timestamps (2001–2106) as seconds while correctly reading
  // 11–13 digit millisecond timestamps.
  var MAX_UINT32 = 4294967295;
  var ms = num > MAX_UINT32 ? num : num * 1000;
  var d = new Date(ms);
  if (isNaN(d.getTime())) return null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var year = d.getUTCFullYear();
  var month = pad(d.getUTCMonth() + 1);
  var day = pad(d.getUTCDate());
  var hours = pad(d.getUTCHours());
  var minutes = pad(d.getUTCMinutes());
  var seconds = pad(d.getUTCSeconds());
  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' UTC';
}

module.exports = action;
module.exports.action = action;
