// Firecrawl with a mocked fetch. Run: node scripts/test-firecrawl.cjs
const assert = require('node:assert');
const path = require('node:path');
let reply, sent;
global.openclip = {
  i18n: (m) => m.en,
  options: { apiKey: 'fc-test' },
  input: { text: '' },
  fetch: async (url, init) => { sent = { url, init }; if (reply === 'throw') throw new Error('x'); return { status: reply[0], text: () => reply[1] }; },
};
const scrape = require(path.join(__dirname, '..', 'raw', 'Firecrawl.openclipext', 'main.js'));
(async () => {
  reply = [200, JSON.stringify({ success: true, data: { markdown: '# Hi\n' } })];
  assert.strictEqual(await scrape(' example.com/a '), '# Hi');
  assert.strictEqual(sent.url, 'https://api.firecrawl.dev/v2/scrape');
  assert.strictEqual(sent.init.headers.Authorization, 'Bearer fc-test');
  assert.deepStrictEqual(JSON.parse(sent.init.body), { url: 'https://example.com/a', formats: ['markdown'] });
  const fails = async (r, re, input = 'https://x.com') => { reply = r; await assert.rejects(scrape(input), re); };
  await fails([401, '{}'], /rejected the API key/);
  await fails([402, '{}'], /out of credits/);
  await fails([429, '{}'], /rate limit/);
  await fails([500, '{"error":"Boom"}'], /^Error: Boom$/);
  await fails([503, 'nope'], /HTTP 503/);
  await fails([200, '{"data":{"markdown":"  "}}'], /no content/);
  await fails('throw', /Could not reach/);
  await fails([200, '{}'], /HTTP or HTTPS/, 'ftp://x.com');
  global.openclip.options.apiKey = ' ';
  await fails([200, '{}'], /Add your Firecrawl API key/);
  console.log('firecrawl: all tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
