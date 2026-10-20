// Run with: node scripts/test-eudic.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pkg = path.join(__dirname, '../raw/Eudic.openclipext');
const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'openclip.json'), 'utf8'));
assert.ok(!(manifest.options || []).some(option => option.identifier === 'edition'));

const opened = [];
const context = {
  module: { exports: {} },
  openclip: {
    input: { text: ' fallback phrase ' },
    option() { throw new Error('Lookup must not read the removed edition option'); },
    openURL(url) { opened.push(url); }
  }
};
vm.runInNewContext(fs.readFileSync(path.join(pkg, manifest.action.script), 'utf8'), context);
const action = context.module.exports;
assert.equal(action.action, action);
action('  hello  ');
action('中文 / test?x=1#词');
action();
action(' \t\n ');
context.openclip.input.text = '';
action();
assert.deepEqual(opened, [
  'eudic://dict/hello',
  'eudic://dict/%E4%B8%AD%E6%96%87%20%2F%20test%3Fx%3D1%23%E8%AF%8D',
  'eudic://dict/fallback%20phrase'
]);
console.log('Eudic lookup checks passed');
