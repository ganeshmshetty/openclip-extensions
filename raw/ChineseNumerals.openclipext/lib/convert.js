// Chinese financial (uppercase) numeral conversion shared by both commands.
// Works on decimal strings only, so large values and fractions never touch
// floating point. Pure JavaScript: no host APIs, safe for JavaScriptCore.

var DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
var SMALL_UNITS = ['', '拾', '佰', '仟'];
var BIG_UNITS = ['', '万', '亿', '兆'];
var MAX_INT_DIGITS = 16;

// Parse "¥-1,234.50" style input into { negative, int, frac } digit strings.
function parse(input) {
  var s = String(input == null ? '' : input).replace(/[\s,，]/g, '');
  s = s.replace(/^[¥￥]/, '').replace(/(元|块|圆)$/, '');
  var m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[2] === '' && !m[3])) throw new Error('invalid');
  var int = m[2].replace(/^0+/, '') || '0';
  if (int.length > MAX_INT_DIGITS) throw new Error('toolong');
  return { negative: m[1] === '-', int: int, frac: m[3] || '' };
}

// 0–9999 as uppercase text, e.g. "1050" -> "壹仟零伍拾".
function groupText(n) {
  var text = '';
  var pendingZero = false;
  for (var pos = 3; pos >= 0; pos--) {
    var d = Math.floor(n / Math.pow(10, pos)) % 10;
    if (d === 0) {
      if (text) pendingZero = true;
      continue;
    }
    if (pendingZero) text += DIGITS[0];
    pendingZero = false;
    text += DIGITS[d] + SMALL_UNITS[pos];
  }
  return text;
}

// Non-negative integer digit string -> uppercase text ("0" -> "零").
function integerText(int) {
  if (int === '0') return DIGITS[0];
  while (int.length % 4) int = '0' + int;
  var out = '';
  var needZero = false;
  var groups = int.length / 4;
  for (var g = 0; g < groups; g++) {
    var n = parseInt(int.substr(g * 4, 4), 10);
    var unit = BIG_UNITS[groups - 1 - g];
    if (n === 0) {
      if (out) needZero = true;
      continue;
    }
    if (out && (needZero || n < 1000)) out += DIGITS[0];
    needZero = false;
    out += groupText(n) + unit;
  }
  return out;
}

// Add one to a digit string.
function increment(digits) {
  var a = digits.split('');
  for (var i = a.length - 1; i >= 0; i--) {
    if (a[i] === '9') { a[i] = '0'; } else { a[i] = String(+a[i] + 1); return a.join(''); }
  }
  return '1' + a.join('');
}

// Plain reading: 123.45 -> 壹佰贰拾叁点肆伍.
function toNumber(input) {
  var p = parse(input);
  var out = (p.negative && /[1-9]/.test(p.int + p.frac) ? '负' : '') + integerText(p.int);
  if (p.frac) {
    out += '点';
    for (var i = 0; i < p.frac.length; i++) out += DIGITS[+p.frac.charAt(i)];
  }
  return out;
}

// RMB amount: 1234.5 -> 壹仟贰佰叁拾肆元伍角整. Rounds half up to the fen.
function toAmount(input) {
  var p = parse(input);
  var frac = (p.frac + '00').substr(0, 2);
  var cents = p.int + frac;
  if (p.frac.length > 2 && +p.frac.charAt(2) >= 5) cents = increment(cents);
  cents = cents.replace(/^0+/, '') || '0';
  if (cents.length - 2 > MAX_INT_DIGITS) throw new Error('toolong');
  while (cents.length < 3) cents = '0' + cents;

  var yuan = cents.slice(0, -2).replace(/^0+/, '') || '0';
  var jiao = +cents.charAt(cents.length - 2);
  var fen = +cents.charAt(cents.length - 1);

  var out = '';
  if (yuan !== '0' || (jiao === 0 && fen === 0)) out += integerText(yuan) + '元';
  if (jiao === 0 && fen === 0) return (p.negative && yuan !== '0' ? '负' : '') + out + '整';
  if (jiao > 0) out += DIGITS[jiao] + '角';
  else if (yuan !== '0') out += DIGITS[0];
  if (fen > 0) out += DIGITS[fen] + '分';
  else out += '整';
  return (p.negative ? '负' : '') + out;
}

// Localized error toast text; English fallback when openclip.i18n is missing.
function errorMessage(e) {
  var tooLong = e && e.message === 'toolong';
  var dict = tooLong
    ? { en: 'Number too large (max 16 integer digits)', 'zh-Hans': '数字过大（整数最多 16 位）', 'zh-Hant': '數字過大（整數最多 16 位）', ja: '数値が大きすぎます（整数部は最大16桁）', fr: 'Nombre trop grand (16 chiffres entiers max)' }
    : { en: 'Not a valid number', 'zh-Hans': '不是有效的数字', 'zh-Hant': '不是有效的數字', ja: '有効な数値ではありません', fr: 'Nombre invalide' };
  return typeof openclip !== 'undefined' && openclip.i18n ? openclip.i18n(dict) : dict.en;
}

module.exports = { PLAIN_STYLE: 'Plain number 壹点贰', toNumber: toNumber, toAmount: toAmount, errorMessage: errorMessage };
