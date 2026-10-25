// Edge cases for Unwrap Paragraphs. Run: node scripts/test-unwrap-paragraphs.cjs
const assert = require('node:assert');
const path = require('node:path');
global.openclip = { options: {}, input: { text: '' } };
const unwrap = require(path.join(__dirname, '..', 'raw', 'UnwrapParagraphs.openclipext', 'main.js'));

assert.strictEqual(unwrap(''), '');
assert.strictEqual(unwrap('one line'), 'one line');
assert.strictEqual(unwrap('This is a\nhard wrapped\nparagraph.\n\nSecond one\nhere.'), 'This is a hard wrapped paragraph.\n\nSecond one here.');
assert.strictEqual(unwrap('Win\r\nlines\r\n\r\nNext'), 'Win lines\n\nNext');
assert.strictEqual(unwrap('a\n\n\n\nb'), 'a\n\nb');
assert.strictEqual(unwrap('List:\n- one\n  continues\n- two\n* three\n• four\n1. five\n2) six\n   more'),
  'List:\n- one continues\n- two\n* three\n• four\n1. five\n2) six more');
assert.strictEqual(unwrap('  trailing   \n  spaces  '), 'trailing spaces');
assert.strictEqual(unwrap('日本語の\n文章です\n\nCafé\nau lait'), '日本語の 文章です\n\nCafé au lait');
assert.strictEqual(unwrap('Already one line.\n\nAnother.'), 'Already one line.\n\nAnother.');
assert.strictEqual(unwrap('\n\nlead\n\n'), 'lead');
console.log('unwrap paragraphs: all tests passed');
