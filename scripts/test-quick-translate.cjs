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
const already = manifest.options.find(o => o.identifier === 'alreadyTarget');
assert.deepEqual(already.values, ['Keep as is', 'Switch to the other language']);
assert.equal(already.default, 'Keep as is');
assert.equal(manifest.version, '1.4.0');

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
  const base = { targetLang: 'English', alreadyTarget: 'Keep as is', secondLang: 'None' };
  const R = async (text, detected, options, secondary) => (await run({ text, detected, options, secondary })).out;
  assert.equal(await R('Bonjour', 'fr', base), '[en] Bonjour');
  assert.equal(await R('Bonjour', 'fr', base, true), '[en] Bonjour');
  const keep = { ...base, secondLang: 'Hindi' };
  assert.equal(await R('Bonjour', 'fr', keep), '[en] Bonjour');
  assert.equal(await R('Bonjour', 'fr', keep, true), '[hi] Bonjour');
  // Keep as is: no redirect for either click
  assert.equal(await R('Hello', 'en', keep), '[en] Hello');
  assert.equal(await R('नमस्ते', 'hi', keep, true), '[hi] नमस्ते');
  // Switch: both clicks swap
  const sw = { ...keep, alreadyTarget: 'Switch to the other language' };
  assert.equal(await R('Hello', 'en', sw), '[hi] Hello');
  assert.equal(await R('नमस्ते', 'hi', sw, true), '[en] नमस्ते');
  assert.equal(await R('Hola', 'es', sw), '[en] Hola');
  assert.equal(await R('Hola', 'es', sw, true), '[hi] Hola');
  // Switch with secondary None → Keep as is
  const swNone = { ...sw, secondLang: 'None' };
  assert.equal(await R('Hello', 'en', swNone), '[en] Hello');
  assert.equal(await R('Hello', 'en', swNone, true), '[en] Hello');
  // Legacy values
  for (const legacy of ['Translate to second language', 'Translate to English instead']) {
    assert.equal(await R('Hello', 'en', { ...keep, alreadyTarget: legacy }), '[hi] Hello');
    assert.equal(await R('नमस्ते', 'hi', { ...keep, alreadyTarget: legacy }, true), '[en] नमस्ते');
    assert.equal(await R('Hej', 'da', { ...base, targetLang: 'Danish', alreadyTarget: legacy }), '[da] Hej');
  }
  assert.equal(await R('Hello', 'en', { ...keep, alreadyTarget: 'Keep target language' }), '[en] Hello');
  assert.equal(await R('नमस्ते', 'hi', { ...keep, alreadyTarget: 'Keep target language' }, true), '[hi] नमस्ते');
  const withHi = keep;
  // Fallback backend used when gtx fails, with the secondary language
  const fb = await run({ text: 'Bonjour', detected: 'fr', options: withHi, secondary: true, failGtx: true });
  assert.equal(fb.out, '<hi> Bonjour');
  console.log('Quick Translate checks passed');
})().catch(e => { console.error(e); process.exit(1); });
