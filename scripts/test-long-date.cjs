// Edge cases for Long Date. Run: node scripts/test-long-date.cjs
const assert = require('node:assert');
const path = require('node:path');
global.openclip = { options: {}, input: { text: '' } };
const mod = require(path.join(__dirname, '..', 'raw', 'LongDate.openclipext', 'main.js'));
const d = new Date(2026, 9, 25, 12, 0, 0);

assert.strictEqual(mod.formatLongDate(d, 'en_GB'), 'Sunday, 25 October 2026');
assert.strictEqual(mod.formatLongDate(d, 'en_US'), 'Sunday, October 25, 2026');
assert.match(mod.formatLongDate(d, 'fr_FR'), /dimanche 25 octobre 2026/);
assert.match(mod.formatLongDate(d, 'ja_JP'), /2026年10月25日/);
assert.match(mod.formatLongDate(d, 'zh_CN'), /2026年10月25日/);
assert.strictEqual(mod.formatLongDate(d, ''), mod.formatLongDate(d, undefined));
assert.strictEqual(mod.formatLongDate(d, 'not a locale!!'), 'Sunday, 25 October 2026');
assert.strictEqual(mod.fallback(d), 'Sunday, 25 October 2026');
global.openclip = { locale: 'en_GB' };
assert.strictEqual(typeof mod(''), 'string');
assert.ok(mod('').length > 10);
console.log('long date: all tests passed');
