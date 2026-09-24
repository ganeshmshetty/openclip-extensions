function action(sel) {
  var format = (openclip.options && openclip.options.format) || (openclip.option ? openclip.option('format') : '') || 'iso';
  var d = new Date();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  if (format === 'date') {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  } else if (format === 'time') {
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  } else if (format === 'datetime') {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  } else {
    return d.toISOString();
  }
}

module.exports = action;
module.exports.action = action;
