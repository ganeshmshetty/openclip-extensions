// Clean Link — OpenClip Extension
// Strips tracking parameters offline using a bundled ClearURLs rules snapshot
// plus OpenClip host overrides (including X's `a` share token).

var clearurls = require('./clearurls.js');
var parseUrl = clearurls.parseUrl;
var parseQueryParams = clearurls.parseQueryParams;
var stringifyQueryParams = clearurls.stringifyQueryParams;

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

// ClearURLs strips s, t, cn, ref_src, and ref_url on x.com / twitter.com.
// It does not strip `a`, the share token that now sits beside s=20.
var X_SHARE_PARAMS = ['s', 't', 'ref_src', 'ref_url', 'a'];

var SINGLE_URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
var EXTRACT_URL_REGEX = /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

function isXHost(domain) {
  return /(?:^|\.)(twitter|x)\.com$/i.test(domain);
}

function shouldRemoveParam(domain, key, pathname) {
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
  // Twitter / X. /i/redirect uses `t` as a functional flag, so the share-token
  // list (including `a`) does not apply there. ClearURLs has the same exception.
  if (isXHost(domain) && !(pathname && pathname.indexOf('/i/redirect') !== -1)) {
    if (X_SHARE_PARAMS.indexOf(k) !== -1) return true;
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

function cleanSingleUrl(rawUrl, depth) {
  depth = depth || 0;
  if (depth > 8) return rawUrl;
  var trimmed = rawUrl.trim();
  var parsed = parseUrl(trimmed);
  if (!parsed) return rawUrl;

  var current = trimmed;
  if (/^https?:$/i.test(parsed.protocol)) {
    try {
      var cleared = clearurls.applyClearURLs(current);
      if (cleared && cleared !== current) {
        current = cleared;
        parsed = parseUrl(current);
        if (!parsed) return current;
      }
    } catch (e) {
      // Legacy rules below still run if the rules snapshot misbehaves.
    }
  }

  var params = parseQueryParams(parsed.search);

  // Google search redirects are always unwrapped. There is no setting for this.
  if (/(?:^|\.)google\.[a-z.]+/i.test(parsed.hostname) && parsed.pathname === '/url') {
    for (var i = 0; i < params.length; i++) {
      if (params[i].key === 'q' || params[i].key === 'url') {
        var target;
        try {
          target = decodeURIComponent(params[i].value);
        } catch (e) {
          continue;
        }
        if (/^https?:\/\//i.test(target) && target !== current) {
          return cleanSingleUrl(target, depth + 1);
        }
      }
    }
  }

  // Amazon product links are always shortened to /dp/ASIN.
  if (/(?:^|\.)amazon\.[a-z.]+/i.test(parsed.hostname)) {
    var asinMatch = parsed.pathname.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i);
    if (asinMatch) {
      var proto = parsed.protocol ? parsed.protocol + '//' : '';
      return proto + parsed.host + '/dp/' + asinMatch[1].toUpperCase();
    }
  }

  var filteredParams = params.filter(function (p) {
    return !shouldRemoveParam(parsed.hostname, p.key, parsed.pathname);
  });

  var newSearch = stringifyQueryParams(filteredParams);

  var cleanHash = parsed.hash;
  if (cleanHash && /#(?:.*[?&])?(?:utm_|xtor=)/i.test(cleanHash)) {
    cleanHash = '';
  }

  if (newSearch === (parsed.search || '') && cleanHash === (parsed.hash || '')) return current;

  var path = parsed.pathname;
  if (path === '/' && !newSearch && !cleanHash && !/\/$/.test(current)) {
    path = '';
  }

  var prefix = parsed.protocol ? parsed.protocol + '//' : '';
  return prefix + parsed.host + path + newSearch + cleanHash;
}

function cleanText(text) {
  if (!text) return '';
  var trimmed = text.trim();

  if (SINGLE_URL_REGEX.test(trimmed)) {
    return cleanSingleUrl(trimmed);
  }

  return text.replace(EXTRACT_URL_REGEX, function (match) {
    var trailing = '';
    var m = match;
    var punct = /[.,;:!?)]+$/.exec(m);
    if (punct) {
      trailing = punct[0];
      m = m.slice(0, -trailing.length);
    }
    return cleanSingleUrl(m) + trailing;
  });
}

function action(selection, options) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text ? selection.text : String(selection || ''));
  if (!text) return '';
  return cleanText(text);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = action;
  module.exports.action = action;
  module.exports.cleanSingleUrl = cleanSingleUrl;
  module.exports.cleanText = cleanText;
  module.exports.X_SHARE_PARAMS = X_SHARE_PARAMS;
}
