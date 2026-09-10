// URL, domain and IP normalisation shared by every Urlquery command.
//
// Accepts what people actually select: a full URL, a bare domain, an IPv4
// address, something wrapped in quotes or angle brackets, or a defanged
// indicator such as `hxxps://example[.]com` from a threat report. Returns a
// normalised description of the selection, or null when it is not a URL.

// Bare "name.ext" selections that are almost certainly filenames, not domains.
// The manifest regex excludes the same list so the group stays hidden for them.
var FILE_EXTENSIONS = /\.(?:js|mjs|cjs|ts|tsx|jsx|md|txt|png|jpe?g|gif|svg|webp|ico|css|html?|json|ya?ml|xml|csv|pdf|zip|gz|tar|py|rb|go|rs|java|swift|kt|sh|mp3|mp4|mov|exe|dmg|pkg|log|lock|toml|ini|env)$/i;

// Common second-level public suffixes so `www.example.co.uk` maps to
// `example.co.uk` rather than `co.uk`. Not exhaustive; good enough for search
// and history lookups, which urlquery matches on its own `url.domain` field.
var TWO_LEVEL_SUFFIXES = {};
[
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au', 'asn.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'school.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp', 'ad.jp', 'ed.jp', 'gr.jp', 'lg.jp',
  'co.kr', 'or.kr', 'ne.kr', 'go.kr', 'ac.kr', 're.kr',
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  'com.mx', 'org.mx', 'gob.mx', 'edu.mx',
  'com.ar', 'org.ar', 'gob.ar', 'edu.ar',
  'com.tr', 'org.tr', 'net.tr', 'gov.tr', 'edu.tr',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn',
  'com.tw', 'org.tw', 'net.tw', 'gov.tw', 'edu.tw',
  'com.hk', 'org.hk', 'net.hk', 'gov.hk', 'edu.hk',
  'com.sg', 'org.sg', 'net.sg', 'gov.sg', 'edu.sg',
  'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in', 'firm.in', 'gen.in', 'ind.in',
  'co.za', 'org.za', 'net.za', 'gov.za', 'ac.za', 'web.za',
  'co.id', 'or.id', 'go.id', 'ac.id', 'web.id',
  'com.my', 'org.my', 'net.my', 'gov.my', 'edu.my',
  'com.ph', 'org.ph', 'net.ph', 'gov.ph', 'edu.ph',
  'com.vn', 'org.vn', 'net.vn', 'gov.vn', 'edu.vn',
  'com.ua', 'org.ua', 'net.ua', 'gov.ua', 'edu.ua', 'in.ua',
  'com.pl', 'org.pl', 'net.pl', 'edu.pl', 'gov.pl',
  'com.ru', 'org.ru', 'net.ru', 'msk.ru', 'spb.ru',
  'com.co', 'org.co', 'net.co', 'gov.co', 'edu.co',
  'com.pe', 'org.pe', 'net.pe', 'gob.pe', 'edu.pe',
  'com.ve', 'com.ec', 'com.uy', 'com.py', 'com.bo', 'com.do', 'com.gt', 'com.sv', 'com.ni', 'com.hn', 'com.pa',
  'com.eg', 'com.sa', 'com.ng', 'com.gh', 'com.ke', 'co.ke', 'co.tz', 'co.ug', 'co.zw', 'co.bw', 'co.mz',
  'co.il', 'org.il', 'ac.il', 'gov.il', 'net.il',
  'co.th', 'in.th', 'or.th', 'go.th', 'ac.th',
  'com.pk', 'org.pk', 'net.pk', 'gov.pk', 'edu.pk',
  'com.bd', 'com.np', 'com.lk', 'com.kh', 'com.mm',
  'com.es', 'org.es', 'nom.es', 'gob.es', 'edu.es',
  'com.pt', 'org.pt', 'edu.pt', 'gov.pt',
  'com.fr', 'asso.fr', 'gouv.fr', 'nom.fr', 'prd.fr', 'tm.fr',
  'co.it', 'edu.it', 'gov.it',
  'co.at', 'or.at', 'ac.at', 'gv.at',
  'com.de', 'co.de',
  'co.no', 'com.se', 'org.se',
  'com.gr', 'org.gr', 'net.gr', 'edu.gr', 'gov.gr',
  'com.ro', 'org.ro', 'nt.ro', 'tm.ro',
  'com.hr', 'com.mt', 'com.cy', 'org.cy', 'com.lb', 'com.jo', 'com.kw', 'com.qa', 'com.bh', 'com.om', 'com.ae', 'co.ae', 'ac.ae',
  'com.ge', 'com.az', 'com.kz', 'com.uz', 'com.by',
  'com.ee', 'com.lv', 'com.lt',
  'co.cr', 'co.cz', 'com.cz'
].forEach(function (suffix) { TWO_LEVEL_SUFFIXES[suffix] = true; });

var WRAPPERS = { '<': '>', '"': '"', "'": "'", '(': ')', '[': ']', '`': '`', '“': '”', '‘': '’', '«': '»' };

// ---------------------------------------------------------------- normalise

// Removes matching quotes/brackets around the selection and trailing sentence
// punctuation, leaving the bare indicator.
function unwrap(text) {
  var t = text;
  var first = t.charAt(0);
  var close = WRAPPERS[first];
  if (close) {
    if (t.charAt(t.length - 1) === close) t = t.slice(1, -1);
    else if (first !== '[' && first !== '(') t = t.slice(1);
  }
  t = t.replace(/[>"'`”’»]+$/, '');
  t = t.replace(/[.,;:!?]+$/, '');
  // Drop unbalanced closing parentheses, e.g. "(see https://example.com/a)".
  while (/\)$/.test(t) && (t.match(/\(/g) || []).length < (t.match(/\)/g) || []).length) {
    t = t.slice(0, -1);
  }
  return t;
}

// Reverses the common "defang" conventions used to share malicious indicators
// safely: hxxp → http, [.] / (.) / {.} / [dot] → ., [:] → :, [://] → ://.
function refang(text) {
  var t = text;
  t = t.replace(/\[(?:\.|dot)\]|\((?:\.|dot)\)|\{(?:\.|dot)\}/gi, '.');
  t = t.replace(/\[:\/\/\]|\[\/\/\]|\[\/\]\//g, '//');
  t = t.replace(/\[:\]/g, ':');
  t = t.replace(/^hxxp(s?):/i, 'http$1:');
  t = t.replace(/^h\[tt\]p(s?):/i, 'http$1:');
  t = t.replace(/^(https?):\/\/\/+/i, '$1://');
  return t;
}

function normalize(text) {
  var t = String(text == null ? '' : text).trim();
  if (!t) return '';
  t = unwrap(t);
  // A URL is a single token; anything with internal whitespace is prose.
  if (/\s/.test(t)) return '';
  t = refang(t);
  t = unwrap(t);
  return t;
}

// ---------------------------------------------------------------- classify

var HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
var URL_SHAPE = /^(?:([a-z][a-z0-9+.-]*):\/\/)?([^\/?#:]+)(?::(\d{1,5}))?([\/?#].*)?$/i;

function isIPv4(host) {
  var parts = host.split('.');
  if (parts.length !== 4) return false;
  for (var i = 0; i < parts.length; i++) {
    if (!/^\d{1,3}$/.test(parts[i]) || Number(parts[i]) > 255) return false;
  }
  return true;
}

// `www.example.co.uk` → `example.co.uk`; `1.2.3.4` → `1.2.3.4`.
function registrableDomain(host) {
  if (isIPv4(host)) return host;
  var labels = host.split('.');
  if (labels.length <= 2) return host;
  var lastTwo = labels.slice(-2).join('.');
  if (TWO_LEVEL_SUFFIXES[lastTwo] && labels.length >= 3) return labels.slice(-3).join('.');
  return lastTwo;
}

// Parses the selection. Returns null when it does not look like a URL, domain
// or IPv4 address. Result:
//   input   normalised text exactly as it will be sent to urlquery
//   kind    'url' | 'domain' | 'ip'
//   scheme  'http' | 'https' | 'ftp' | ''
//   host    lowercase hostname or IP, no port
//   port    port string or ''
//   path    everything from the first / ? or # onwards, or ''
//   domain  registrable domain (or the IP), used for history and search
//   display host plus port, for toasts
function parse(text) {
  var input = normalize(text);
  if (!input) return null;
  var m = URL_SHAPE.exec(input);
  if (!m) return null;
  var scheme = m[1] ? m[1].toLowerCase() : '';
  var host = m[2].toLowerCase().replace(/\.$/, '');
  var port = m[3] || '';
  var path = m[4] || '';
  if (scheme && scheme !== 'http' && scheme !== 'https' && scheme !== 'ftp') return null;

  var kind;
  if (isIPv4(host)) {
    kind = 'ip';
  } else if (HOSTNAME.test(host)) {
    kind = (scheme || port || path) ? 'url' : 'domain';
    if (kind === 'domain' && FILE_EXTENSIONS.test(host)) return null;
  } else {
    return null;
  }

  return {
    input: input,
    kind: kind,
    scheme: scheme,
    host: host,
    port: port,
    path: path,
    domain: registrableDomain(host),
    display: host + (port ? ':' + port : '')
  };
}

// urlquery search query for a parsed selection: IPs by `ip.addr`, everything
// else by registrable `url.domain`.
function searchQuery(parsed) {
  if (parsed.kind === 'ip') return 'ip.addr:' + parsed.host;
  return 'url.domain:' + parsed.domain;
}

module.exports = {
  normalize: normalize,
  refang: refang,
  parse: parse,
  isIPv4: isIPv4,
  registrableDomain: registrableDomain,
  searchQuery: searchQuery
};
