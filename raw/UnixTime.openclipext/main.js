function action(sel) {
  var text = (sel || openclip.input.text).trim();
  var num = parseInt(text, 10);
  if (isNaN(num)) return null;
  var ms = text.length <= 10 ? num * 1000 : num;
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
