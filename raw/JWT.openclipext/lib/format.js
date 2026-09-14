// Human-facing formatting for JWT commands: localized strings and relative times.
// Falls back to English when openclip.i18n is unavailable.

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
  expiry: {
    valid: { en: 'Expires {rel}', 'zh-Hans': '{rel}过期', 'zh-Hant': '{rel}過期', fr: 'Expire {rel}', ja: '{rel}に期限切れ' },
    expired: { en: 'Expired {rel}', 'zh-Hans': '已过期 · {rel}', 'zh-Hant': '已過期 · {rel}', fr: 'Expiré {rel}', ja: '期限切れ · {rel}' },
    'not-yet': { en: 'Becomes valid {rel}', 'zh-Hans': '{rel}生效', 'zh-Hant': '{rel}生效', fr: 'Devient valide {rel}', ja: '{rel}に有効になります' },
    'no-exp': { en: 'No expiry claim', 'zh-Hans': '没有过期时间', 'zh-Hant': '沒有過期時間', fr: 'Aucune date d’expiration', ja: '有効期限なし' }
  }
};

// ---------------------------------------------------------------- errors

function errorMessage(error) {
  var code = error && error.code;
  var dict = STRINGS.errors[code] || STRINGS.errors.unknown;
  return t(dict);
}

// ---------------------------------------------------------------- time

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

// Toast-sized expiry message: "Expires in 52 minutes", "Expired 3 hours ago".
function expiryMessage(state) {
  var when = state.kind === 'not-yet' ? state.nbf : state.exp;
  return fill(t(STRINGS.expiry[state.kind]), {
    rel: when !== null ? formatRelative(when, state.now) : ''
  });
}

module.exports = {
  errorMessage: errorMessage,
  formatRelative: formatRelative,
  expiryMessage: expiryMessage
};
