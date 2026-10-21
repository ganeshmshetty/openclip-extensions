// Run with: node scripts/test-quick-translate.cjs
// Mocks openclip.fetch with a fake gtx backend; no network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pkg = path.join(__dirname, '../raw/QuickTranslate.openclipext');
const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'openclip.json'), 'utf8'));
const src = fs.readFileSync(path.join(pkg, manifest.action.script), 'utf8');
const second = manifest.options.find(o => o.identifier === 'secondLang');
assert.equal(second.default, 'None');
assert.deepEqual(second.values.slice(1), manifest.options.find(o => o.identifier === 'targetLang').values);
assert.ok(manifest.options.find(o => o.identifier === 'alreadyTarget').values.includes('Translate to second language'));

async function run({ text, detected, options, secondary, failGtx }) {
  const calls = [];
  const ctx = {
    console: { log() {} },
    openclip: {
      input: { text, isSecondaryClick: !!secondary },
      option: id => options[id],
      toast() {},
      fetch(url) {
        const tl = /[?&](?:tl|to)=([^&]+)/.exec(url);
        const lang = tl ? decodeURIComponent(tl[1]) : null;
        calls.push({ url, lang });
        if (url.includes('/translate_a/single')) {
          if (failGtx) return Promise.resolve({ ok: false, status: 429 });
          return Promise.resolve({ ok: true, json: () => [[['[' + lang + '] ' + text]], null, detected] });
        }
        if (url.includes('clients5')) return Promise.resolve({ ok: true, json: () => [['<' + lang + '> ' + text, detected]] });
        return Promise.resolve({ ok: false, status: 500 });
      }
    }
  };
  vm.runInNewContext(src, ctx);
  return { out: await vm.runInContext('action()', ctx), calls };
}

(async () => {
  const base = { targetLang: 'English', alreadyTarget: 'Keep target language', secondLang: 'None' };
  // Primary click
  assert.equal((await run({ text: 'Bonjour', detected: 'fr', options: base })).out, '[en] Bonjour');
  // Secondary, no second language → unchanged (main target)
  assert.equal((await run({ text: 'Bonjour', detected: 'fr', options: base, secondary: true })).out, '[en] Bonjour');
  // Secondary, second language set
  const withHi = { ...base, secondLang: 'Hindi' };
  assert.equal((await run({ text: 'Bonjour', detected: 'fr', options: withHi, secondary: true })).out, '[hi] Bonjour');
  // Primary with second language set still uses main target
  assert.equal((await run({ text: 'Bonjour', detected: 'fr', options: withHi })).out, '[en] Bonjour');
  // Secondary, text already in second language → falls back to main target
  assert.equal((await run({ text: 'नमस्ते', detected: 'hi', options: withHi, secondary: true })).out, '[en] नमस्ते');
  // Already in target + "Translate to second language"
  const swap = { ...withHi, alreadyTarget: 'Translate to second language' };
  assert.equal((await run({ text: 'Hello', detected: 'en', options: swap })).out, '[hi] Hello');
  // ...but not when the text isn't in the target
  assert.equal((await run({ text: 'Hola', detected: 'es', options: swap })).out, '[en] Hola');
  // "Translate to second language" with no second language → keep target
  assert.equal((await run({ text: 'Hello', detected: 'en', options: { ...swap, secondLang: 'None' } })).out, '[en] Hello');
  // Existing English-instead still works
  const eng = { ...base, targetLang: 'Danish', alreadyTarget: 'Translate to English instead' };
  assert.equal((await run({ text: 'Hej', detected: 'da', options: eng })).out, '[en] Hej');
  // Fallback backend used when gtx fails, with the secondary language
  const fb = await run({ text: 'Bonjour', detected: 'fr', options: withHi, secondary: true, failGtx: true });
  assert.equal(fb.out, '<hi> Bonjour');
  console.log('Quick Translate checks passed');
})().catch(e => { console.error(e); process.exit(1); });
