// Offline ClearURLs applicator.
// The rules file is LGPL-3.0 data from ClearURLs. This applicator is original
// MIT code: it follows the published pass order (exception, redirect capture,
// rawRules, then anchored parameter and hash rules, referral rules included)
// without copying the addon's source.

var data = require('./clearurls-rules.js');

var compileFailures = 0;
var ruleCount = 0;

function compileOne(source, flags) {
  try {
    return new RegExp(source, flags);
  } catch (e) {
    compileFailures++;
    return null;
  }
}

function compilePatternList(list, flags) {
  var out = [];
  if (!list || !list.length) return out;
  for (var i = 0; i < list.length; i++) {
    var re = compileOne(list[i], flags);
    if (re) out.push(re);
  }
  return out;
}

function compileAnchored(list) {
  var out = [];
  if (!list || !list.length) return list ? out : out;
  for (var i = 0; i < list.length; i++) {
    var re = compileOne('^' + list[i] + '$', 'i');
    if (re) {
      out.push(re);
      ruleCount++;
    }
  }
  return out;
}

function compileProviders(providers) {
  var compiled = [];
  if (!providers) return compiled;
  for (var name in providers) {
    if (!Object.prototype.hasOwnProperty.call(providers, name)) continue;
    var provider = providers[name] || {};
    if (!provider.urlPattern) continue;
    var urlPattern = compileOne(provider.urlPattern, 'i');
    if (!urlPattern) continue;
    var rules = compileAnchored(provider.rules).concat(compileAnchored(provider.referralMarketing));
    if (provider.completeProvider) {
      var all = compileOne('^.*$', 'i');
      if (all) {
        rules.push(all);
        ruleCount++;
      }
    }
    var redirections = [];
    var sources = provider.redirections || [];
    for (var i = 0; i < sources.length; i++) {
      var re = compileOne(sources[i], 'i');
      if (re) redirections.push({ src: sources[i], re: re });
    }
    compiled.push({
      name: name,
      urlPattern: urlPattern,
      exceptions: compilePatternList(provider.exceptions, 'i'),
      redirections: redirections,
      rawRules: compilePatternList(provider.rawRules, 'gi'),
      rules: rules
    });
  }
  return compiled;
}

var compiled = compileProviders(data && data.providers);

function matches(re, text) {
  re.lastIndex = 0;
  return re.test(text);
}

function keyMatches(rules, key) {
  if (!key || !rules.length) return false;
  for (var i = 0; i < rules.length; i++) {
    if (matches(rules[i], key)) return true;
  }
  return false;
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
      list.push({ key: decodeURIComponent(k.replace(/\+/g, ' ')), rawKey: k, value: v });
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

function stripQuery(search, rules) {
  var params = parseQueryParams(search);
  var kept = [];
  var changed = false;
  for (var i = 0; i < params.length; i++) {
    var param = params[i];
    if (keyMatches(rules, param.key) || (param.rawKey !== param.key && keyMatches(rules, param.rawKey))) {
      changed = true;
      continue;
    }
    kept.push(param);
  }
  if (!changed) return search || '';
  return stringifyQueryParams(kept);
}

function stripHash(hash, rules) {
  if (!hash || hash.length < 2 || !rules.length) return hash || '';
  var body = hash.charAt(0) === '#' ? hash.slice(1) : hash;
  var parts = body.split('&');
  var kept = [];
  var changed = false;
  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i];
    if (!seg) {
      changed = true;
      continue;
    }
    var eq = seg.indexOf('=');
    var key = eq === -1 ? seg : seg.slice(0, eq);
    if (keyMatches(rules, key)) {
      changed = true;
      continue;
    }
    kept.push(seg);
  }
  if (!changed) return hash;
  if (!kept.length) return '';
  return '#' + kept.join('&');
}

function rebuild(original, search, hash) {
  var parsed = parseUrl(original);
  if (!parsed) return original;
  var path = parsed.pathname;
  if (path === '/' && !search && !hash && !/\/$/.test(original)) path = '';
  var prefix = parsed.protocol ? parsed.protocol + '//' : '';
  return prefix + parsed.host + path + (search || '') + (hash || '');
}

function applyRaw(url, rawRules) {
  var next = url;
  for (var i = 0; i < rawRules.length; i++) {
    rawRules[i].lastIndex = 0;
    next = next.replace(rawRules[i], '');
  }
  if (next !== url) next = next.replace(/\?&/g, '?').replace(/#&/g, '#');
  return next;
}

function decodeRedirect(raw) {
  if (!raw) return null;
  var value = String(raw).trim();
  for (var i = 0; i < 4; i++) {
    var next;
    try {
      next = decodeURIComponent(value);
    } catch (e) {
      break;
    }
    if (next === value) break;
    value = next;
  }
  value = value.trim();
  if (/^https?:\/\//i.test(value)) return value;
  // ClearURLs prepends a scheme when the capture is only a host/path (AMP).
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#]|$)/i.test(value)) return 'http://' + value;
  return null;
}

function applyProvider(url, provider) {
  if (!matches(provider.urlPattern, url)) return { url: url, redirect: false };
  for (var e = 0; e < provider.exceptions.length; e++) {
    if (matches(provider.exceptions[e], url)) return { url: url, redirect: false };
  }
  for (var r = 0; r < provider.redirections.length; r++) {
    var red = provider.redirections[r];
    red.re.lastIndex = 0;
    var found = red.re.exec(url);
    if (found && found.length > 1 && found[1]) {
      var dest = decodeRedirect(found[1]);
      if (dest && dest !== url) return { url: dest, redirect: true };
    }
  }
  var rawed = applyRaw(url, provider.rawRules);
  if (!provider.rules.length) return { url: rawed, redirect: false };
  var parsed = parseUrl(rawed);
  if (!parsed) return { url: rawed, redirect: false };
  var search = stripQuery(parsed.search, provider.rules);
  var hash = stripHash(parsed.hash, provider.rules);
  if (search === (parsed.search || '') && hash === (parsed.hash || '')) return { url: rawed, redirect: false };
  return { url: rebuild(rawed, search, hash), redirect: false };
}

function cleaningPass(url) {
  var current = url;
  for (var i = 0; i < compiled.length; i++) {
    var step = applyProvider(current, compiled[i]);
    if (step.redirect) return step;
    current = step.url;
  }
  return { url: current, redirect: false };
}

function applyClearURLs(url) {
  if (!url || compiled.length === 0) return url;
  var current = url;
  var seen = Object.create(null);
  for (var i = 0; i < 8; i++) {
    if (seen[current]) return current;
    seen[current] = true;
    var result = cleaningPass(current);
    if (result.redirect) {
      if (!result.url || result.url === current) return current;
      current = result.url;
      continue;
    }
    if (result.url === current) return current;
    current = result.url;
  }
  return current;
}

function providerRemovesKey(name, key) {
  for (var i = 0; i < compiled.length; i++) {
    if (compiled[i].name !== name) continue;
    return keyMatches(compiled[i].rules, key);
  }
  return false;
}

module.exports = {
  applyClearURLs: applyClearURLs,
  parseUrl: parseUrl,
  parseQueryParams: parseQueryParams,
  stringifyQueryParams: stringifyQueryParams,
  providerRemovesKey: providerRemovesKey,
  providerCount: compiled.length,
  ruleCount: ruleCount,
  compileFailures: compileFailures
};
