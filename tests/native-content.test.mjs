import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const validator = fileURLToPath(new URL('../scripts/validate.sh', import.meta.url));
const script = readFileSync(new URL('../raw/OpenLinks.openclipext/main.js', import.meta.url), 'utf8');

function validate(requirements, nested = false) {
  const directory = mkdtempSync(join(tmpdir(), 'openclip-content-'));
  try {
    const action = { type: 'javascript', scriptCode: 'return null;', requirements };
    const manifest = {
      identifier: 'com.test.content', name: 'Content',
      action: nested ? { type: 'group', subActions: [action] } : action,
    };
    writeFileSync(join(directory, 'openclip.json'), JSON.stringify(manifest));
    return spawnSync(validator, [directory], { encoding: 'utf8' });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('content types accept alternatives alongside existing requirements', () => {
  for (const content of [['url'], ['url', 'email'], ['date', 'path', 'phone', 'address']]) {
    const result = validate({ content, input: 'text', apps: ['com.apple.Safari'], requiredOptions: ['account'] });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('invalid content and retired expressions are rejected, including nested actions', () => {
  const cases = [
    { content: [] }, { content: null }, { content: 'url' }, { content: ['unknown'] },
    { content: [[]] }, { content: [42] }, { expression: 'isURL(text)' }, { expression: null },
  ];
  for (const requirements of cases) {
    for (const nested of [false, true]) {
      const result = validate(requirements, nested);
      assert.equal(result.status, 1, JSON.stringify(requirements));
      assert.match(result.stderr, /requirements\.(content|expression)/);
    }
  }
});

test('Open Links opens each distinct native URL in first occurrence order', () => {
  const urls = Object.freeze(['https://github.com', 'https://example.com', 'https://github.com']);
  const opened = [];
  const context = vm.createContext({ openclip: {
    input: { text: 'Links embedded in prose', detected: { urls } },
    openURL(url) { opened.push(url); },
  } });
  vm.runInContext(script + '\naction();', context);
  assert.deepEqual(opened, ['https://github.com', 'https://example.com']);
  assert.equal(urls.length, 3);
});

test('Open Links emits no effects for empty native input', () => {
  const opened = [];
  vm.runInNewContext(script + '\naction();', { openclip: {
    input: { detected: { urls: [] } }, openURL(url) { opened.push(url); },
  } });
  assert.deepEqual(opened, []);
});
