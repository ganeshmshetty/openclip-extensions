// Edge cases for Smart Quotes. Run: node scripts/test-smart-quotes.cjs
const assert = require('node:assert');
const path = require('node:path');
global.openclip = { options: {}, input: { text: '' } };
const dir = path.join(__dirname, '..', 'raw', 'SmartQuotes.openclipext');
const curl = require(path.join(dir, 'curl.js'));
const straighten = require(path.join(dir, 'straighten.js'));

assert.strictEqual(curl(''), '');
assert.strictEqual(straighten(''), '');
assert.strictEqual(curl('He said "hi" and \'bye\'.'), 'He said \u201chi\u201d and \u2018bye\u2019.');
assert.strictEqual(curl("don't it's rock 'n' roll"), 'don\u2019t it\u2019s rock \u2018n\u2019 roll');
assert.strictEqual(curl("back in '90s"), 'back in \u201990s');
assert.strictEqual(curl('"Start"\r\n("paren") [\'x\'] \u2014"dash"'), '\u201cStart\u201d\r\n(\u201cparen\u201d) [\u2018x\u2019] \u2014\u201cdash\u201d');
assert.strictEqual(curl('"日本語" "café"'), '\u201c日本語\u201d \u201ccafé\u201d');
assert.strictEqual(curl('\u201calready\u201d'), '\u201calready\u201d');
assert.strictEqual(straighten('\u201cHi\u201d \u2018there\u2019 don\u2019t \u201elow\u201f \u2032 \u2033'), '"Hi" \'there\' don\'t "low" \' "');
assert.strictEqual(straighten('plain "text"\r\n'), 'plain "text"\r\n');
assert.strictEqual(straighten(curl('Mix "a" \'b\' it\'s')), 'Mix "a" \'b\' it\'s');
console.log('smart quotes: all tests passed');
