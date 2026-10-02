var PROVIDERS = ['is.gd', 'v.gd'];

function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) {
    return openclip.options[name];
  }
  return openclip.option ? openclip.option(name) : undefined;
}

function redact(value, selectedURL) {
  var result = String(value || '');
  if (selectedURL) {
    result = result.split(selectedURL).join('[selected URL]');
    result = result.split(encodeURIComponent(selectedURL)).join('[selected URL]');
  }
  return result;
}

function providerError(provider, message, retryable) {
  var error = new Error(provider + ': ' + message);
  error.provider = provider;
  error.retryable = retryable;
  return error;
}

async function shortenWith(provider, selectedURL, fetchFn) {
  var endpoint = 'https://' + provider + '/create.php?format=simple&url=' + encodeURIComponent(selectedURL);
  var res;
  try {
    res = await fetchFn(endpoint);
  } catch (error) {
    var requestMessage = error && error.message ? error.message : String(error);
    throw providerError(provider, 'request failed: ' + redact(requestMessage, selectedURL), true);
  }

  var body;
  try {
    body = typeof res.text === 'function' ? await res.text() : '';
  } catch (error) {
    var readMessage = error && error.message ? error.message : String(error);
    throw providerError(provider, 'could not read response: ' + redact(readMessage, selectedURL), true);
  }

  var response = String(body || '').trim();
  var status = Number(res.status) || 0;
  if (status >= 200 && status < 300 && /^https?:\/\/(is\.gd|v\.gd)\/\S+$/i.test(response)) {
    return response;
  }

  var detail;
  if (/^Error:\s*/i.test(response)) {
    detail = redact(response.replace(/^Error:\s*/i, ''), selectedURL);
  } else if (/^\s*</.test(response)) {
    detail = 'received an HTML page instead of an API response';
  } else if (response) {
    detail = 'unexpected response: ' + redact(response, selectedURL).slice(0, 180);
  } else {
    detail = 'received an empty response';
  }

  var retryable = status === 0 || status >= 500;
  // The simple API uses a plain-text Error response with HTTP 200 for service-side errors.
  if (status >= 200 && status < 300 && !/^Error:\s*/i.test(response)) retryable = true;
  throw providerError(provider, 'returned HTTP ' + status + ': ' + detail, retryable);
}

async function action(selection) {
  var fetchFn = openclip.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) throw new Error('Network fetch is not supported in this runtime');

  var primary = String(option('domain') || 'is.gd').toLowerCase();
  // Older settings may still contain a provider removed from this compact version.
  if (PROVIDERS.indexOf(primary) === -1) primary = 'is.gd';

  var selectedURL = (selection || openclip.input.text).trim();
  if (!/^https?:\/\//i.test(selectedURL)) selectedURL = 'https://' + selectedURL;
  var fallbackEnabled = option('automaticFallback');
  fallbackEnabled = fallbackEnabled === true || String(fallbackEnabled).toLowerCase() === 'true';
  var providers = fallbackEnabled
    ? [primary].concat(PROVIDERS.filter(function (provider) { return provider !== primary; }))
    : [primary];
  var failures = [];

  for (var i = 0; i < providers.length; i += 1) {
    var provider = providers[i];
    try {
      var shortURL = await shortenWith(provider, selectedURL, fetchFn);
      if (provider !== primary) {
        openclip.toast('Shortened with ' + provider + ' after the preferred service failed', 'info');
      }
      return shortURL;
    } catch (error) {
      var failureMessage = error && error.message ? error.message : String(error);
      failures.push(failureMessage);
      if (!fallbackEnabled || !error.retryable) throw new Error(failureMessage);
    }
  }

  throw new Error('Could not shorten the URL. ' + failures.join(' | '));
}

module.exports = action;
module.exports.action = action;
