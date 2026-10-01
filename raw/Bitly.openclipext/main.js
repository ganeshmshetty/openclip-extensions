function option(name) {
  if (openclip.options && openclip.options[name] !== undefined) {
    return openclip.options[name];
  }
  return openclip.option ? openclip.option(name) : undefined;
}

function responseError(status) {
  if (status === 401) return 'Bitly rejected the access token. Check it in the extension settings.';
  if (status === 403) return 'Bitly denied access. Check the token and Group GUID.';
  if (status === 404) return 'Bitly could not find the configured group. Check the Group GUID.';
  if (status === 422) return 'Bitly could not create that link. Check the selected URL and your Bitly plan.';
  return 'Bitly returned HTTP ' + status + '.';
}

function normalizeURL(input) {
  var url = String(input || '').trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    throw new Error('Bitly can shorten HTTP or HTTPS URLs only.');
  }
  return 'https://' + url;
}

async function action(selection) {
  var accessToken = String(option('accessToken') || '').trim();
  var groupGuid = String(option('groupGuid') || '').trim();
  if (!accessToken || !groupGuid) {
    throw new Error('Add your Bitly access token and Group GUID in the extension settings.');
  }

  var selectedText = typeof selection === 'string'
    ? selection
    : (selection && selection.text) || openclip.input.text;
  var longURL = normalizeURL(selectedText);

  var response;
  try {
    response = await openclip.fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        long_url: longURL,
        group_guid: groupGuid
      })
    });
  } catch (_) {
    throw new Error('Could not reach Bitly. Check your internet connection and try again.');
  }

  var body = '';
  try {
    body = response.text();
  } catch (_) {
    throw new Error('Bitly returned a response that could not be read.');
  }

  var data = null;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch (_) {
      if (response.status >= 200 && response.status < 300) {
        throw new Error('Bitly returned an invalid response.');
      }
    }
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(responseError(response.status));
  }
  if (!data || typeof data.link !== 'string' || !/^https?:\/\//i.test(data.link)) {
    throw new Error('Bitly did not return a shortened URL.');
  }

  return data.link;
}

module.exports = action;
module.exports.action = action;
