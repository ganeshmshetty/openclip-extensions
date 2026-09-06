async function action(selection, options) {
  var fetchFn = openclip.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) {
    throw new Error('Network fetch is not supported in this runtime');
  }
  var service = (openclip.options && openclip.options.domain) || (openclip.option ? openclip.option('domain') : '') || 'TinyURL';
  var text = (selection || openclip.input.text).trim();

  if (service === 'is.gd' || service === 'v.gd') {
    var endpoint = 'https://' + service + '/create.php?format=json&url=' + encodeURIComponent(text);
    var res = await fetchFn(endpoint);
    var body = typeof res.text === 'function' ? res.text() : '';
    try {
      var data = JSON.parse(body);
      if (data && data.shorturl) return data.shorturl;
      if (data && data.errormessage) throw new Error(data.errormessage);
    } catch (e) {
      if (body && body.includes('Error')) throw new Error(service + ' error: ' + body.trim());
    }
  }

  // TinyURL (reliable default)
  var res = await fetchFn('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(text));
  var shortUrl = (typeof res.text === 'function' ? res.text() : '').trim();
  if (shortUrl && shortUrl.startsWith('http')) {
    return shortUrl;
  }
  throw new Error('Failed to shorten URL');
}

module.exports = action;
module.exports.action = action;
