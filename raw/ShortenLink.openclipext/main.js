async function action(selection) {
  var fetchFn = openclip.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) {
    throw new Error('Network fetch is not supported in this runtime');
  }

  var service = (openclip.options && openclip.options.domain)
    || (openclip.option ? openclip.option('domain') : '')
    || 'is.gd';
  // Existing installs may retain the removed TinyURL option in saved settings.
  if (service === 'TinyURL') service = 'is.gd';
  if (service !== 'is.gd' && service !== 'v.gd') {
    throw new Error('Unsupported shortening service: ' + service);
  }

  var text = (selection || openclip.input.text).trim();
  var endpoint = 'https://' + service + '/create.php?format=json&url=' + encodeURIComponent(text);
  var res = await fetchFn(endpoint);
  var body = typeof res.text === 'function' ? await res.text() : '';

  var data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(service + ' returned an invalid response');
  }

  if (data && data.shorturl) return data.shorturl;
  if (data && data.errormessage) {
    throw new Error(service + ': ' + data.errormessage);
  }
  throw new Error('Failed to shorten URL with ' + service);
}

module.exports = action;
module.exports.action = action;
