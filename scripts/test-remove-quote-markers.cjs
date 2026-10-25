// Edge cases for Remove Quote Markers. Run: node scripts/test-remove-quote-markers.cjs
const assert = require('node:assert');
const path = require('node:path');
global.openclip = { options: {}, input: { text: '' } };
const strip = require(path.join(__dirname, '..', 'raw', 'RemoveQuoteMarkers.openclipext', 'main.js'));

assert.strictEqual(strip(''), '');
assert.strictEqual(strip('> hello\n> world'), 'hello\nworld');
assert.strictEqual(strip('>> nested\n> > spaced\n>>>deep\n  > indented'), 'nested\nspaced\ndeep\nindented');
assert.strictEqual(strip('> a\r\n>\r\n> b'), 'a\n\nb');
assert.strictEqual(strip('> 日本語 café'), '日本語 café');
assert.strictEqual(strip('no markers\n1 > 0 stays'), 'no markers\n1 > 0 stays');
assert.strictEqual(strip('>    code indent'), '   code indent');
console.log('remove quote markers: all tests passed');
