// Clean Link — OpenClip Extension
// Strips tracking parameters, affiliate tags, and marketing junk from URLs.

var TRACKING_PARAMS = [
  // UTM parameters
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_name', 'utm_cid', 'utm_reader', 'utm_viz_id', 'utm_pubreferrer', 'utm_swu',

  // Facebook / Meta / Instagram
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_ref', 'fb_source',
  'action_object_map', 'action_type_map', 'action_ref_map',
  'igshid', 'igsh',

  // Google
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'gad_source',
  '_ga', '_gl', 'gcl_aw', 'gcl_dc',

  // Microsoft / Bing
  'msclkid',

  // Twitter / X
  'twclid', 'ref_src', 'ref_url',

  // TikTok
  'ttclid', '_r',

  // Pinterest
  'epik',

  // Reddit
  'rdt_cid', 'share_id',

  // HubSpot & Marketo & Mailchimp
  '_hsenc', '_hsmi', 'mkt_tok', 'mc_cid', 'mc_eid',

  // Matomo / Piwik
  'pk_campaign', 'pk_kwd', 'pk_source', 'pk_medium', 'pk_content',
  'piwik_campaign', 'piwik_kwd',

  // Yandex & Yahoo
  'yclid', 'ymclid', 'soc_src', 'soc_trk',

  // Analytics & Tracking tags
  'wickedid', 'vero_id', 'vero_conv'
];

var TRACKING_PREFIXES = [
  'utm_',
  'ga_',
  'hsa_',
  'pk_',
  'piwik_',
  'matomo_',
  'vero_',
  'wicked_',
  'campaign_'
];

var SINGLE_URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
var EXTRACT_URL_REGEX = /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

function getOption(id, defaultValue) {
  var val;
  if (typeof openclip !== 'undefined') {
    if (typeof openclip.option === 'function') {
      val = openclip.option(id);
    } else if (openclip.options && openclip.options[id] !== undefined) {
      val = openclip.options[id];
    }
  }
  if (val === undefined || val === null || val === '') {
    return defaultValue;
  }
  return val;
}

function getBoolOption(id, defaultValue) {
  var val = getOption(id, defaultValue);
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    var lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  return Boolean(val);
}

function parseUrl(rawUrl) {
  var str = rawUrl.trim();
  var match = str.match(/^(?:([a-zA-Z][a-zA-Z0-9+.-]*:)\/\/)?([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
  if (!match) return null;
  return {
    protocol: match[1] || '',
    host: match[2] || '',
    hostname: (match[2] || '').split(':')[0].toLowerCase(),
    pathname: match[3] || '/',
    search: match[4] || '',
    hash: match[5] || ''
  };
}

function parseQueryParams(searchStr) {
  if (!searchStr || searchStr === '?') return [];
  var q = searchStr.indexOf('?') === 0 ? searchStr.slice(1) : searchStr;
  var pairs = q.split('&');
  var list = [];
  for (var i = 0; i < pairs.length; i++) {
    var p = pairs[i];
    if (!p) continue;
    var eq = p.indexOf('=');
    var k = eq !== -1 ? p.slice(0, eq) : p;
    var v = eq !== -1 ? p.slice(eq + 1) : '';
    try {
      var decodedKey = decodeURIComponent(k.replace(/\+/g, ' '));
      list.push({ key: decodedKey, rawKey: k, value: v });
    } catch (e) {
      list.push({ key: k, rawKey: k, value: v });
    }
  }
  return list;
}

function stringifyQueryParams(params) {
  if (!params || params.length === 0) return '';
  var parts = [];
  for (var i = 0; i < params.length; i++) {
    var p = params[i];
    parts.push(p.rawKey + (p.value !== '' ? '=' + p.value : ''));
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

function shouldRemoveParam(domain, key) {
  var k = key.toLowerCase();
  if (TRACKING_PARAMS.indexOf(k) !== -1) return true;
  for (var i = 0; i < TRACKING_PREFIXES.length; i++) {
    if (k.indexOf(TRACKING_PREFIXES[i]) === 0) return true;
  }
  if (k.indexOf('ref_') === 0) return true;

  // YouTube
  if (/(?:^|\.)youtube\.com$/i.test(domain) || /(?:^|\.)youtu\.be$/i.test(domain)) {
    if (['si', 'feature', 'pp', 'embeds_referring_euri', 'embeds_referring_origin', 'source_ve_path'].indexOf(k) !== -1) return true;
  }
  // Twitter / X
  if (/(?:^|\.)(twitter|x)\.com$/i.test(domain)) {
    if (['s', 't', 'ref_src', 'ref_url'].indexOf(k) !== -1) return true;
  }
  // Spotify
  if (/(?:^|\.)spotify\.com$/i.test(domain)) {
    if (['si', 'context', 'nd'].indexOf(k) !== -1) return true;
  }
  // Amazon
  if (/(?:^|\.)amazon\./i.test(domain)) {
    if (['tag', 'ref', 'qid', 'sr', 'keywords', 'crid', 'sprefix', 'dib', 'dib_tag', 'th', 'psc'].indexOf(k) !== -1) return true;
    if (/^p[df]_rd_/i.test(k)) return true;
  }
  // Bilibili
  if (/(?:^|\.)bilibili\.com$/i.test(domain)) {
    if (['spm_id_from', 'from_source', 'from', 'seid', 'share_source', 'share_medium', 'share_plat', 'share_session_id', 'share_tag', 'bbid', 'ts'].indexOf(k) !== -1) return true;
  }
  // LinkedIn
  if (/(?:^|\.)linkedin\.com$/i.test(domain)) {
    if (['trackingid', 'refid', 'midtoken', 'trk', 'trkemail', 'lipi'].indexOf(k) !== -1) return true;
  }
  return false;
}

function cleanSingleUrl(rawUrl, options) {
  options = options || {};
  var trimmed = rawUrl.trim();
  var parsed = parseUrl(trimmed);
  if (!parsed) return rawUrl;

  var params = parseQueryParams(parsed.search);

  // Google Search Redirect Unwrapping
  var unwrapRedirects = options.unwrapGoogleRedirects !== undefined ? options.unwrapGoogleRedirects : getBoolOption('unwrapGoogleRedirects', true);
  if (unwrapRedirects && /(?:^|\.)google\.[a-z.]+/i.test(parsed.hostname) && parsed.pathname === '/url') {
    for (var i = 0; i < params.length; i++) {
      if (params[i].key === 'q' || params[i].key === 'url') {
        var target = decodeURIComponent(params[i].value);
        if (/^https?:\/\//i.test(target)) {
          return cleanSingleUrl(target, options);
        }
      }
    }
  }

  // Amazon Product Canonicalization
  var canonicalizeAmazon = options.canonicalizeAmazon !== undefined ? options.canonicalizeAmazon : getBoolOption('canonicalizeAmazon', true);
  if (canonicalizeAmazon && /(?:^|\.)amazon\.[a-z.]+/i.test(parsed.hostname)) {
    var asinMatch = parsed.pathname.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i);
    if (asinMatch) {
      var proto = parsed.protocol ? parsed.protocol + '//' : '';
      return proto + parsed.host + '/dp/' + asinMatch[1].toUpperCase();
    }
  }

  // Filter tracking parameters
  var filteredParams = params.filter(function(p) {
    return !shouldRemoveParam(parsed.hostname, p.key);
  });

  var newSearch = stringifyQueryParams(filteredParams);

  // Clean tracking hash
  var cleanHash = parsed.hash;
  if (cleanHash && /#(?:.*[?&])?(?:utm_|xtor=)/i.test(cleanHash)) {
    cleanHash = '';
  }

  var prefix = parsed.protocol ? parsed.protocol + '//' : '';
  var path = parsed.pathname;
  if (path === '/' && !newSearch && !cleanHash && !/\/$/.test(trimmed)) {
    path = '';
  }

  return prefix + parsed.host + path + newSearch + cleanHash;
}

function cleanText(text, options) {
  if (!text) return '';
  var trimmed = text.trim();

  // If the entire selection is a single URL, clean it directly
  if (SINGLE_URL_REGEX.test(trimmed)) {
    return cleanSingleUrl(trimmed, options);
  }

  // If text contains URLs, clean each one and preserve surrounding text and punctuation
  return text.replace(EXTRACT_URL_REGEX, function(match) {
    var trailing = '';
    var m = match;
    var punct = /[.,;:!?)]+$/.exec(m);
    if (punct) {
      trailing = punct[0];
      m = m.slice(0, -trailing.length);
    }
    return cleanSingleUrl(m, options) + trailing;
  });
}

function action(selection, options) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text ? selection.text : String(selection || ''));
  if (!text) return '';
  return cleanText(text, options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = action;
  module.exports.action = action;
  module.exports.cleanSingleUrl = cleanSingleUrl;
  module.exports.cleanText = cleanText;
}
