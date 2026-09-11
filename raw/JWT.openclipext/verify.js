// JWT · Verify Signature
// Recomputes the HMAC for HS256 / HS384 / HS512 tokens with the configured
// secret and reports whether the signature matches. Asymmetric algorithms
// (RS*, PS*, ES*, EdDSA) need the issuer's public key and are reported as
// not verifiable here. Everything runs locally; the token never leaves the Mac.

var jwt = require('./lib/jwt.js');
var fmt = require('./lib/format.js');
var sha2 = require('./lib/sha2.js');

var HMAC_ALGS = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };

var STRINGS = {
  needSecret: { en: 'Enter the shared secret used to sign this token.', 'zh-Hans': '请输入用于签名此令牌的共享密钥。', 'zh-Hant': '請輸入用於簽署此權杖的共用密鑰。', fr: 'Saisissez le secret partagé utilisé pour signer ce jeton.', ja: 'このトークンの署名に使った共有シークレットを入力してください。' },
  unsigned: { en: 'Token is unsigned (alg {alg}) · nothing to verify', 'zh-Hans': '令牌未签名（alg {alg}）· 无需验证', 'zh-Hant': '權杖未簽名（alg {alg}）· 無需驗證', fr: 'Jeton non signé (alg {alg}) · rien à vérifier', ja: 'トークンは未署名です（alg {alg}）· 検証対象なし' },
  unsupported: { en: '{alg} needs the issuer’s public key · only HS256/HS384/HS512 can be verified here', 'zh-Hans': '{alg} 需要签发者的公钥 · 此处仅能验证 HS256/HS384/HS512', 'zh-Hant': '{alg} 需要簽發者的公鑰 · 此處僅能驗證 HS256/HS384/HS512', fr: '{alg} nécessite la clé publique de l’émetteur · seuls HS256/HS384/HS512 sont vérifiables ici', ja: '{alg} は発行者の公開鍵が必要です · ここで検証できるのは HS256/HS384/HS512 のみ' },
  badSecret: { en: 'The secret is not valid base64 · turn off “Secret is base64 encoded” or fix the value', 'zh-Hans': '密钥不是有效的 Base64 · 请关闭“密钥为 Base64 编码”或修正该值', 'zh-Hant': '密鑰不是有效的 Base64 · 請關閉「密鑰為 Base64 編碼」或修正該值', fr: 'Le secret n’est pas du base64 valide · désactivez « Secret encodé en base64 » ou corrigez la valeur', ja: 'シークレットが有効な Base64 ではありません · 「Base64 エンコード済み」をオフにするか値を修正してください' },
  valid: { en: 'Signature valid ({alg}) · {status}', 'zh-Hans': '签名有效（{alg}）· {status}', 'zh-Hant': '簽名有效（{alg}）· {status}', fr: 'Signature valide ({alg}) · {status}', ja: '署名は有効です（{alg}）· {status}' },
  invalid: { en: 'Signature invalid ({alg}) · wrong secret or tampered token', 'zh-Hans': '签名无效（{alg}）· 密钥错误或令牌已被篡改', 'zh-Hant': '簽名無效（{alg}）· 密鑰錯誤或權杖已被竄改', fr: 'Signature invalide ({alg}) · mauvais secret ou jeton altéré', ja: '署名が無効です（{alg}）· シークレットが違うかトークンが改ざんされています' }
};

function option(id) {
  var value = typeof openclip.option === 'function'
    ? openclip.option(id)
    : (openclip.options || {})[id];
  return value == null ? '' : String(value);
}

function deliver(message, style) {
  if (openclip.input && openclip.input.isSecondaryClick) {
    openclip.copy(message);
    return;
  }
  openclip.toast(message, style);
}

function action(selection) {
  var parsed;
  try {
    parsed = jwt.parse(selection);
  } catch (e) {
    openclip.toast(fmt.errorMessage(e), 'error');
    return;
  }

  var secret = option('secret');
  if (!secret.trim()) {
    openclip.requireConfiguration({ reason: fmt.t(STRINGS.needSecret), missing: ['secret'] });
    return;
  }

  var alg = typeof parsed.header.alg === 'string' ? parsed.header.alg : 'none';
  if (alg.toLowerCase() === 'none' || !parsed.signature) {
    deliver(fmt.fill(fmt.t(STRINGS.unsigned), { alg: alg }), 'error');
    return;
  }
  var hashName = HMAC_ALGS[alg.toUpperCase()];
  if (!hashName) {
    deliver(fmt.fill(fmt.t(STRINGS.unsupported), { alg: alg }), 'info');
    return;
  }

  var keyBytes;
  if (option('secretIsBase64') === 'true') {
    try {
      keyBytes = jwt.base64UrlDecodeBytes(secret);
    } catch (e) {
      deliver(fmt.t(STRINGS.badSecret), 'error');
      return;
    }
  } else {
    keyBytes = jwt.utf8Encode(secret);
  }

  var expected = sha2.hmac(hashName, keyBytes, jwt.utf8Encode(parsed.signingInput));
  var actual;
  try {
    actual = jwt.base64UrlDecodeBytes(parsed.signature);
  } catch (e) {
    actual = [];
  }

  if (sha2.constantTimeEqual(expected, actual)) {
    var state = jwt.status(parsed.payload);
    var style = state.kind === 'valid' || state.kind === 'no-exp' ? 'success' : 'info';
    deliver(fmt.fill(fmt.t(STRINGS.valid), { alg: alg, status: fmt.statusLine(state) }), style);
  } else {
    deliver(fmt.fill(fmt.t(STRINGS.invalid), { alg: alg }), 'error');
  }
}

module.exports = action;
