// JWT parsing shared by every JWT command.
//
// JavaScriptCore has no atob/btoa or TextDecoder, so base64url and UTF-8 are
// implemented here. Nothing in this file touches the network or the host.

var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
var LOOKUP = (function () {
  var table = {};
  for (var i = 0; i < ALPHABET.length; i++) table[ALPHABET.charAt(i)] = i;
  table['+'] = 62; // tolerate the standard alphabet too
  table['/'] = 63;
  return table;
})();

function JwtError(code, detail) {
  this.name = 'JwtError';
  this.code = code;
  this.detail = detail || '';
  this.message = code + (detail ? ': ' + detail : '');
}
JwtError.prototype = Object.create(Error.prototype);

// ---------------------------------------------------------------- bytes

function base64UrlDecodeBytes(input) {
  var text = String(input == null ? '' : input).replace(/\s+/g, '').replace(/=+$/, '');
  var bytes = [];
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < text.length; i++) {
    var value = LOOKUP[text.charAt(i)];
    if (value === undefined) throw new JwtError('base64', text.charAt(i));
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

function utf8Decode(bytes) {
  var out = '';
  var i = 0;
  while (i < bytes.length) {
    var b0 = bytes[i++];
    var code;
    if (b0 < 0x80) {
      code = b0;
    } else if (b0 >= 0xc2 && b0 < 0xe0 && i < bytes.length) {
      code = ((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if (b0 >= 0xe0 && b0 < 0xf0 && i + 1 < bytes.length) {
      code = ((b0 & 0x0f) << 12) | ((bytes[i] & 0x3f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else if (b0 >= 0xf0 && b0 < 0xf5 && i + 2 < bytes.length) {
      code = ((b0 & 0x07) << 18) | ((bytes[i] & 0x3f) << 12) |
        ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
      i += 3;
    } else {
      code = 0xfffd;
    }
    if (code > 0xffff) {
      code -= 0x10000;
      out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
    } else {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

function base64UrlDecodeText(input) {
  return utf8Decode(base64UrlDecodeBytes(input));
}

// ---------------------------------------------------------------- token

// Accepts what people actually select: "Bearer <token>", a quoted token, or a
// token wrapped across lines in a terminal. Returns the bare compact form.
function normalizeToken(text) {
  var token = String(text == null ? '' : text).trim();
  token = token.replace(/^authorization\s*:\s*/i, '');
  token = token.replace(/^bearer\s+/i, '');
  token = token.replace(/^["'`]+|["'`,;]+$/g, '');
  token = token.replace(/\s+/g, '');
  return token;
}

function parseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, value: undefined };
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Parses a compact JWS. Throws JwtError with one of these codes:
//   empty     nothing selected
//   jwe       five segments or an "enc" header: an encrypted token
//   segments  not three dot-separated parts
//   base64    a segment is not base64url
//   header    the header is not a JSON object
function parse(text) {
  var token = normalizeToken(text);
  if (!token) throw new JwtError('empty');

  var segments = token.split('.');
  if (segments.length === 5) throw new JwtError('jwe');
  if (segments.length !== 3) throw new JwtError('segments', String(segments.length));

  var headerText = base64UrlDecodeText(segments[0]);
  var header = parseJson(headerText);
  if (!header.ok || !isPlainObject(header.value)) throw new JwtError('header');
  if (typeof header.value.enc === 'string') throw new JwtError('jwe');

  var payloadText = base64UrlDecodeText(segments[1]);
  var payload = parseJson(payloadText);
  var payloadIsJson = payload.ok && isPlainObject(payload.value);

  return {
    token: token,
    segments: segments,
    signature: segments[2],
    header: header.value,
    headerText: headerText,
    payload: payloadIsJson ? payload.value : null,
    payloadText: payloadText,
    payloadIsJson: payloadIsJson
  };
}

// Seconds since the epoch for a numeric-date claim, or null when unusable.
function claimSeconds(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) return parseFloat(value);
  return null;
}

// Where the token stands right now, judged from exp and nbf only.
//   { kind: 'not-yet' | 'expired' | 'valid' | 'no-exp', exp, nbf }
function status(payload, nowSeconds) {
  var now = typeof nowSeconds === 'number' ? nowSeconds : Date.now() / 1000;
  var exp = payload ? claimSeconds(payload.exp) : null;
  var nbf = payload ? claimSeconds(payload.nbf) : null;
  var kind;
  if (nbf !== null && nbf > now) kind = 'not-yet';
  else if (exp !== null && exp <= now) kind = 'expired';
  else if (exp !== null) kind = 'valid';
  else kind = 'no-exp';
  return { kind: kind, exp: exp, nbf: nbf, now: now };
}

module.exports = {
  JwtError: JwtError,
  base64UrlDecodeBytes: base64UrlDecodeBytes,
  base64UrlDecodeText: base64UrlDecodeText,
  utf8Decode: utf8Decode,
  normalizeToken: normalizeToken,
  parse: parse,
  claimSeconds: claimSeconds,
  status: status
};
