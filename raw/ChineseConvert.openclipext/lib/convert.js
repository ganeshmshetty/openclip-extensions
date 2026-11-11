// Simplified <-> Traditional Chinese conversion (OpenCC dictionaries, see data.js).
// Longest-phrase match first, then single characters. Pure JavaScript, no host APIs.

var data = require('./data.js');

var STANDARD = 'Standard 通用繁體';
var TAIWAN = 'Taiwan 台灣繁體';
var TAIWAN_PHRASES = 'Taiwan + local phrases 台灣慣用詞';

function charMap(pair) {
  var keys = Array.from(pair[0]);
  var vals = Array.from(pair[1]);
  var map = {};
  for (var i = 0; i < keys.length; i++) map[keys[i]] = vals[i];
  return map;
}

function phraseMap(list) {
  var map = {};
  if (!list) return map;
  var items = list.split(',');
  for (var i = 0; i < items.length; i++) {
    var p = items[i].indexOf('|');
    if (p > 0) map[items[i].slice(0, p)] = items[i].slice(p + 1);
  }
  return map;
}

// A stage is a set of phrase lists plus char tables applied together in one pass.
function stage(phraseLists, charPairs) {
  var phrases = {};
  var maxLen = 1;
  phraseLists.forEach(function (list) {
    var m = phraseMap(list);
    for (var k in m) {
      phrases[k] = m[k];
      if (k.length > maxLen) maxLen = k.length;
    }
  });
  var chars = {};
  charPairs.forEach(function (pair) {
    var m = charMap(pair);
    for (var c in m) chars[c] = m[c];
  });
  return { phrases: phrases, chars: chars, maxLen: maxLen };
}

function apply(st, text) {
  var chars = Array.from(text);
  var out = '';
  var i = 0;
  while (i < chars.length) {
    var hit = false;
    for (var len = Math.min(st.maxLen, chars.length - i); len >= 2; len--) {
      var key = chars.slice(i, i + len).join('');
      if (Object.prototype.hasOwnProperty.call(st.phrases, key)) {
        out += st.phrases[key];
        i += len;
        hit = true;
        break;
      }
    }
    if (hit) continue;
    var c = chars[i++];
    out += Object.prototype.hasOwnProperty.call(st.chars, c) ? st.chars[c] : c;
  }
  return out;
}

function toTraditional(text, variant) {
  var s = String(text == null ? '' : text);
  s = apply(stage([data.STP], [data.ST]), s);
  if (variant === TAIWAN_PHRASES) s = apply(stage([data.TWP], []), s);
  if (variant === TAIWAN || variant === TAIWAN_PHRASES) s = apply(stage([], [data.TWV]), s);
  return s;
}

function toSimplified(text, variant) {
  var s = String(text == null ? '' : text);
  var rev = [data.TWVRP];
  if (variant === TAIWAN_PHRASES) rev.push(data.TWPR);
  s = apply(stage(rev, [data.TWVR]), s);
  return apply(stage([data.TSP], [data.TS]), s);
}

module.exports = {
  STANDARD: STANDARD,
  TAIWAN: TAIWAN,
  TAIWAN_PHRASES: TAIWAN_PHRASES,
  toTraditional: toTraditional,
  toSimplified: toSimplified
};
