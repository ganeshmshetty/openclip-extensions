// Edge cases for Trim Lines modes. Run: node scripts/test-trim-lines.cjs
const assert = require('node:assert');
const path = require('node:path');
const file = path.join(__dirname, '..', 'raw', 'TrimLines.openclipext', 'main.js');
function run(text, mode) {
  global.openclip = { options: mode ? { mode } : {}, option: (k) => (mode && k === 'mode' ? mode : '') };
  delete require.cache[require.resolve(file)];
  return require(file)(text);
}
const s = '  a  \n\tb\t\r\n   \n c ';
assert.strictEqual(run(s), 'a\nb\n\nc');
assert.strictEqual(run(s, 'Both'), 'a\nb\n\nc');
assert.strictEqual(run(s, 'Start only'), 'a  \nb\t\n\nc ');
assert.strictEqual(run(s, 'End only'), '  a\n\tb\n\n c');
assert.strictEqual(run(s, 'bogus'), 'a\nb\n\nc');
assert.strictEqual(run(''), '');
assert.strictEqual(run('  日本  \n  café', 'Start only'), '日本  \ncafé');
assert.strictEqual(run('done', 'End only'), 'done');
console.log('trim lines: all tests passed');
