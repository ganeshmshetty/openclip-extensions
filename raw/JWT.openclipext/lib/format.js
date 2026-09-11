// Human-facing formatting for JWT commands: localized strings, dates, and the
// Inspect report. Falls back to English when openclip.i18n is unavailable.

var jwt = require('./jwt.js');

// ---------------------------------------------------------------- i18n

function t(dict) {
  if (typeof openclip !== 'undefined' && openclip && typeof openclip.i18n === 'function') {
    try {
      var value = openclip.i18n(dict);
      if (typeof value === 'string' && value) return value;
    } catch (e) { /* fall through */ }
  }
  return dict.en;
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return values[key] != null ? String(values[key]) : match;
  });
}

function localeTag() {
  if (typeof openclip === 'undefined' || !openclip) return undefined;
  var tag = openclip.locale || openclip.language;
  if (!tag || typeof tag !== 'string') return undefined;
  return tag.replace(/_/g, '-');
}

var STRINGS = {
  errors: {
    empty: { en: 'Nothing selected', 'zh-Hans': '未选择任何内容', 'zh-Hant': '未選取任何內容', fr: 'Aucune sélection', ja: '何も選択されていません' },
    jwe: { en: 'This is an encrypted JWE token; it cannot be decoded without its key', 'zh-Hans': '这是加密的 JWE 令牌，没有密钥无法解码', 'zh-Hant': '這是加密的 JWE 權杖，沒有金鑰無法解碼', fr: 'Ceci est un jeton JWE chiffré ; impossible de le décoder sans sa clé', ja: 'これは暗号化された JWE トークンです。鍵がないと復号できません' },
    segments: { en: 'Not a JWT: expected three dot-separated parts', 'zh-Hans': '不是 JWT：应包含三个以点分隔的部分', 'zh-Hant': '不是 JWT：應包含三個以點分隔的部分', fr: 'Pas un JWT : trois parties séparées par des points attendues', ja: 'JWT ではありません：ドット区切りの 3 つの部分が必要です' },
    base64: { en: 'Not a JWT: a segment is not valid base64url', 'zh-Hans': '不是 JWT：某个部分不是有效的 base64url', 'zh-Hant': '不是 JWT：某個部分不是有效的 base64url', fr: 'Pas un JWT : un segment n’est pas du base64url valide', ja: 'JWT ではありません：base64url として無効な部分があります' },
    header: { en: 'Not a JWT: the header is not a JSON object', 'zh-Hans': '不是 JWT：头部不是 JSON 对象', 'zh-Hant': '不是 JWT：標頭不是 JSON 物件', fr: 'Pas un JWT : l’en-tête n’est pas un objet JSON', ja: 'JWT ではありません：ヘッダーが JSON オブジェクトではありません' },
    unknown: { en: 'Could not decode this token', 'zh-Hans': '无法解码此令牌', 'zh-Hant': '無法解碼此權杖', fr: 'Impossible de décoder ce jeton', ja: 'このトークンを復号できませんでした' }
  },
  status: {
    valid: { en: 'Valid · expires {rel}', 'zh-Hans': '有效 · {rel}过期', 'zh-Hant': '有效 · {rel}過期', fr: 'Valide · expire {rel}', ja: '有効 · {rel}に期限切れ' },
    expired: { en: 'Expired {rel}', 'zh-Hans': '已过期 · {rel}', 'zh-Hant': '已過期 · {rel}', fr: 'Expiré {rel}', ja: '期限切れ · {rel}' },
    'not-yet': { en: 'Not valid yet · becomes valid {rel}', 'zh-Hans': '尚未生效 · {rel}生效', 'zh-Hant': '尚未生效 · {rel}生效', fr: 'Pas encore valide · valide {rel}', ja: 'まだ有効ではありません · {rel}に有効' },
    'no-exp': { en: 'No expiry claim', 'zh-Hans': '没有过期时间', 'zh-Hant': '沒有過期時間', fr: 'Aucune date d’expiration', ja: '有効期限なし' }
  },
  expiry: {
    valid: { en: 'Expires {rel} · {abs}', 'zh-Hans': '{rel}过期 · {abs}', 'zh-Hant': '{rel}過期 · {abs}', fr: 'Expire {rel} · {abs}', ja: '{rel}に期限切れ · {abs}' },
    expired: { en: 'Expired {rel} · {abs}', 'zh-Hans': '已过期 · {rel} · {abs}', 'zh-Hant': '已過期 · {rel} · {abs}', fr: 'Expiré {rel} · {abs}', ja: '期限切れ · {rel} · {abs}' },
    'not-yet': { en: 'Not valid yet · valid {rel} · {abs}', 'zh-Hans': '尚未生效 · {rel}生效 · {abs}', 'zh-Hant': '尚未生效 · {rel}生效 · {abs}', fr: 'Pas encore valide · valide {rel} · {abs}', ja: 'まだ有効ではありません · {rel}に有効 · {abs}' },
    'no-exp': { en: 'No expiry claim in this token', 'zh-Hans': '此令牌没有过期时间', 'zh-Hant': '此權杖沒有過期時間', fr: 'Ce jeton n’a pas de date d’expiration', ja: 'このトークンには有効期限がありません' }
  },
  header: {
    unsigned: { en: 'unsigned', 'zh-Hans': '未签名', 'zh-Hant': '未簽名', fr: 'non signé', ja: '未署名' },
    nested: { en: 'nested JWT', 'zh-Hans': '嵌套 JWT', 'zh-Hant': '巢狀 JWT', fr: 'JWT imbriqué', ja: 'ネストされた JWT' },
    payloadNotJson: { en: 'Payload is not JSON', 'zh-Hans': '载荷不是 JSON', 'zh-Hant': '載荷不是 JSON', fr: 'La charge utile n’est pas du JSON', ja: 'ペイロードは JSON ではありません' },
    noClaims: { en: 'No claims', 'zh-Hans': '没有声明', 'zh-Hant': '沒有宣告', fr: 'Aucune revendication', ja: 'クレームなし' }
  },
  claims: {
    iss: { en: 'Issuer', 'zh-Hans': '签发者', 'zh-Hant': '簽發者', fr: 'Émetteur', ja: '発行者' },
    sub: { en: 'Subject', 'zh-Hans': '主体', 'zh-Hant': '主體', fr: 'Sujet', ja: 'サブジェクト' },
    aud: { en: 'Audience', 'zh-Hans': '受众', 'zh-Hant': '受眾', fr: 'Audience', ja: '対象者' },
    exp: { en: 'Expires', 'zh-Hans': '过期时间', 'zh-Hant': '過期時間', fr: 'Expire', ja: '有効期限' },
    nbf: { en: 'Not before', 'zh-Hans': '生效时间', 'zh-Hant': '生效時間', fr: 'Pas avant', ja: '有効開始' },
    iat: { en: 'Issued', 'zh-Hans': '签发时间', 'zh-Hant': '簽發時間', fr: 'Émis', ja: '発行日時' },
    jti: { en: 'Token ID', 'zh-Hans': '令牌 ID', 'zh-Hant': '權杖 ID', fr: 'ID du jeton', ja: 'トークン ID' },
    auth_time: { en: 'Authenticated', 'zh-Hans': '认证时间', 'zh-Hant': '認證時間', fr: 'Authentifié', ja: '認証日時' },
    updated_at: { en: 'Profile updated', 'zh-Hans': '资料更新时间', 'zh-Hant': '資料更新時間', fr: 'Profil mis à jour', ja: 'プロフィール更新' },
    azp: { en: 'Authorized party (azp)' },
    nonce: { en: 'Nonce' },
    acr: { en: 'Auth context class (acr)' },
    amr: { en: 'Auth methods (amr)' },
    scope: { en: 'Scope' },
    scp: { en: 'Scope (scp)' },
    client_id: { en: 'Client ID' },
    sid: { en: 'Session ID (sid)' },
    name: { en: 'Name' },
    given_name: { en: 'Given name' },
    family_name: { en: 'Family name' },
    preferred_username: { en: 'Username' },
    email: { en: 'Email' },
    email_verified: { en: 'Email verified' },
    picture: { en: 'Picture' },
    locale: { en: 'Locale' },
    roles: { en: 'Roles' },
    groups: { en: 'Groups' }
  }
};

// Registered claims come first, time claims in chronological order; everything else keeps payload order.
var CLAIM_ORDER = ['iss', 'sub', 'aud', 'iat', 'nbf', 'exp', 'jti'];

// ---------------------------------------------------------------- errors

function errorMessage(error) {
  var code = error && error.code;
  var dict = STRINGS.errors[code] || STRINGS.errors.unknown;
  return t(dict);
}

// ---------------------------------------------------------------- time

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function formatAbsolute(seconds) {
  var date = new Date(seconds * 1000);
  if (isNaN(date.getTime())) return String(seconds);
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat(localeTag(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    }
  } catch (e) { /* fall through */ }
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) +
    ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
}

var UNITS = [
  { name: 'year', seconds: 31536000 },
  { name: 'month', seconds: 2592000 },
  { name: 'day', seconds: 86400 },
  { name: 'hour', seconds: 3600 },
  { name: 'minute', seconds: 60 },
  { name: 'second', seconds: 1 }
];

// "in 14 minutes" / "3 hours ago" for the delta between `seconds` and `now`.
function formatRelative(seconds, now) {
  var delta = seconds - now;
  var magnitude = Math.abs(delta);
  var unit = UNITS[UNITS.length - 1];
  for (var i = 0; i < UNITS.length; i++) {
    if (magnitude >= UNITS[i].seconds) { unit = UNITS[i]; break; }
  }
  var count = Math.round(magnitude / unit.seconds);
  if (count === 0) count = 1;
  var signed = delta < 0 ? -count : count;
  try {
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      return new Intl.RelativeTimeFormat(localeTag(), { numeric: 'always' }).format(signed, unit.name);
    }
  } catch (e) { /* fall through */ }
  var label = count + ' ' + unit.name + (count === 1 ? '' : 's');
  return delta < 0 ? label + ' ago' : 'in ' + label;
}

function formatTimeClaim(seconds, now) {
  return formatAbsolute(seconds) + ' (' + formatRelative(seconds, now) + ')';
}

// One line summarising exp/nbf: "Valid · expires in 14 minutes".
function statusLine(state) {
  var rel = '';
  if (state.kind === 'not-yet') rel = formatRelative(state.nbf, state.now);
  else if (state.exp !== null) rel = formatRelative(state.exp, state.now);
  return fill(t(STRINGS.status[state.kind]), { rel: rel });
}

// Toast-sized expiry message with the absolute time appended.
function expiryMessage(state) {
  var when = state.kind === 'not-yet' ? state.nbf : state.exp;
  return fill(t(STRINGS.expiry[state.kind]), {
    rel: when !== null ? formatRelative(when, state.now) : '',
    abs: when !== null ? formatAbsolute(when) : ''
  });
}

// ---------------------------------------------------------------- claims

function claimLabel(name) {
  var dict = STRINGS.claims[name];
  return dict ? t(dict) : name;
}

function formatValue(value) {
  if (value === null || value === undefined) return String(value);
  if (Array.isArray(value)) {
    var simple = value.every(function (v) { return v === null || typeof v !== 'object'; });
    return simple ? value.map(String).join(', ') : JSON.stringify(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function orderedClaimNames(payload) {
  var names = Object.keys(payload);
  var first = CLAIM_ORDER.filter(function (n) { return names.indexOf(n) !== -1; });
  var rest = names.filter(function (n) { return CLAIM_ORDER.indexOf(n) === -1; });
  return first.concat(rest);
}

// "HS256 · JWT · kid 2024-key"
function headerSummary(header) {
  var parts = [];
  var alg = typeof header.alg === 'string' ? header.alg : '';
  if (!alg || alg.toLowerCase() === 'none') {
    parts.push((alg || 'none') + ' (' + t(STRINGS.header.unsigned) + ')');
  } else {
    parts.push(alg);
  }
  if (typeof header.typ === 'string' && header.typ) parts.push(header.typ);
  if (header.kid !== undefined) parts.push('kid ' + formatValue(header.kid));
  if (typeof header.cty === 'string' && /jwt/i.test(header.cty)) parts.push(t(STRINGS.header.nested));
  return parts.join(' · ');
}

// The full Inspect report.
function inspectReport(parsed, nowSeconds) {
  var state = jwt.status(parsed.payload, nowSeconds);
  var lines = [statusLine(state), headerSummary(parsed.header), ''];

  if (!parsed.payloadIsJson) {
    lines.push(t(STRINGS.header.payloadNotJson) + ':');
    lines.push(parsed.payloadText);
    return lines.join('\n');
  }

  var names = orderedClaimNames(parsed.payload);
  if (names.length === 0) {
    lines.push(t(STRINGS.header.noClaims));
    return lines.join('\n');
  }

  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var value = parsed.payload[name];
    var rendered;
    var seconds = jwt.isTimeClaim(name) ? jwt.claimSeconds(value) : null;
    if (seconds !== null) rendered = formatTimeClaim(seconds, state.now);
    else rendered = formatValue(value);
    lines.push(claimLabel(name) + ': ' + rendered);
  }
  return lines.join('\n');
}

module.exports = {
  t: t,
  fill: fill,
  STRINGS: STRINGS,
  errorMessage: errorMessage,
  formatAbsolute: formatAbsolute,
  formatRelative: formatRelative,
  formatTimeClaim: formatTimeClaim,
  statusLine: statusLine,
  expiryMessage: expiryMessage,
  claimLabel: claimLabel,
  formatValue: formatValue,
  headerSummary: headerSummary,
  inspectReport: inspectReport
};
