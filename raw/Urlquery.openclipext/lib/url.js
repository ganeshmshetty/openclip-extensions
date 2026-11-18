// URL, domain and IP normalisation shared by every Urlquery command.
//
// Accepts what people actually select: a full URL, a bare domain, an IPv4
// address, something wrapped in quotes or angle brackets, or a defanged
// indicator such as `hxxps://example[.]com` from a threat report. Returns a
// normalised description of the selection, or null when it is not a URL.

// Bare "name.ext" selections that are almost certainly filenames, not domains.
// The manifest regex excludes the same list so the group stays hidden for them.
var FILE_EXTENSIONS = /\.(?:js|mjs|cjs|ts|tsx|jsx|md|txt|png|jpe?g|gif|svg|webp|ico|css|html?|json|ya?ml|xml|csv|pdf|zip|gz|tar|py|rb|go|rs|java|swift|kt|sh|mp3|mp4|mov|exe|dmg|pkg|log|lock|toml|ini|env)$/i;

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

// Parses the selection. Returns null when it does not look like a URL, domain
// or IPv4 address. Result:
//   input   normalised text exactly as it will be sent to urlquery
//   kind    'url' | 'domain' | 'ip'
//   scheme  'http' | 'https' | 'ftp' | ''
//   host    lowercase hostname or IP, no port
//   port    port string or ''
//   path    everything from the first / ? or # onwards, or ''
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
    display: host + (port ? ':' + port : '')
  };
}

// urlquery search query for a parsed selection. Hosts are matched on
// `url.fqdn`, the full hostname, never on `url.domain`, which holds only the
// registrable domain: on a hosting platform such as appwrite.network or
// vercel.app every subdomain is a different site with a different owner, so
// collapsing `animal-tracker.appwrite.network` to `appwrite.network` would
// report on the whole platform instead of the selected site.
//
// The path is deliberately not part of the query. `url.fqdn` already matches
// every scan of that host, including the exact page, and each result is listed
// with its full URL. Narrowing to the path would hide host-level history and
// report "no scans" for a host that has plenty.
function searchQuery(parsed) {
  if (parsed.kind === 'ip') return 'ip.addr:' + parsed.host;
  return 'url.fqdn:' + parsed.host;
}

module.exports = {
  normalize: normalize,
  refang: refang,
  parse: parse,
  isIPv4: isIPv4,
  searchQuery: searchQuery
};
