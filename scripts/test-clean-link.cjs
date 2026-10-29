// Clean Link. Run: node scripts/test-clean-link.cjs
const assert = require('node:assert');
const path = require('node:path');

const root = path.join(__dirname, '..', 'raw', 'CleanLink.openclipext');
const clearurls = require(path.join(root, 'clearurls.js'));
const clean = require(path.join(root, 'main.js'));
const cleanSingleUrl = clean.cleanSingleUrl;

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, (label ? label + '\n' : '') + JSON.stringify(actual) + ' !== ' + JSON.stringify(expected));
}

assert.ok(clearurls.providerCount >= 200, 'expected the ClearURLs snapshot to load');
assert.ok(clearurls.ruleCount >= 700, 'expected compiled parameter rules');
assert.strictEqual(clearurls.compileFailures, 0);

// The bundled x/twitter rules do not treat `a` as tracking. This fails if a
// future snapshot starts stripping it on its own.
assert.strictEqual(clearurls.providerRemovesKey('x', 'a'), false);
assert.strictEqual(clearurls.providerRemovesKey('twitter', 'a'), false);
assert.strictEqual(clearurls.providerRemovesKey('x', 's'), true);
assert.strictEqual(clearurls.providerRemovesKey('x', 't'), true);
assert.ok(clean.X_SHARE_PARAMS.indexOf('a') !== -1);

const X_DIRTY = 'https://x.com/Ihyvd014/status/2115226359408828631?a=Z6xVF8Ttr_sjvaP7Xbs&s=20';
const X_CLEAN = 'https://x.com/Ihyvd014/status/2115226359408828631';

// Without the OpenClip `a` override, ClearURLs leaves the share token in place.
const rulesOnly = clearurls.applyClearURLs(X_DIRTY);
eq(rulesOnly, X_CLEAN + '?a=Z6xVF8Ttr_sjvaP7Xbs', 'ClearURLs snapshot alone');
assert.notStrictEqual(rulesOnly, X_CLEAN);

// With the override the same link is fully clean. Removing `a` from
// X_SHARE_PARAMS makes this assertion fail.
eq(cleanSingleUrl(X_DIRTY), X_CLEAN, 'x.com a override');
eq(clean(X_DIRTY), X_CLEAN);
eq(clean('  ' + X_DIRTY + '  '), X_CLEAN);

eq(clean('https://mobile.twitter.com/jack/status/20?s=20&t=abc&a=TOK'), 'https://mobile.twitter.com/jack/status/20');
eq(clean('https://x.com/a/status/1?cn=track&ref_url=https%3A%2F%2Fx.com'), 'https://x.com/a/status/1');
eq(clean('x.com/user/status/1?a=abc&s=20'), 'x.com/user/status/1');

// `s` and `t` are host-scoped. `a` is too.
eq(clean('https://example.com/search?s=20&t=3&a=1'), 'https://example.com/search?s=20&t=3&a=1');

// ClearURLs leaves `t` on Twitter's email redirect. Our override must not put it back.
const redirect = 'https://twitter.com/i/redirect?url=https%3A%2F%2Fexample.com&t=1&cn=abc&s=20';
eq(clean(redirect), redirect, 'twitter /i/redirect exception');

// ClearURLs global rules, plus a parameter our old list still removes (gbraid).
eq(clearurls.applyClearURLs('https://example.com/a?utm_source=x&id=2'), 'https://example.com/a?id=2');
eq(clean('https://example.com/post?fbclid=IwAR1&id=9'), 'https://example.com/post?id=9');
eq(clearurls.applyClearURLs('https://example.com/ad?gbraid=abc&q=1'), 'https://example.com/ad?gbraid=abc&q=1');
eq(clean('https://example.com/ad?gbraid=abc&q=1'), 'https://example.com/ad?q=1');
eq(clean('https://example.com/s?q=a+b&utm_medium=c'), 'https://example.com/s?q=a+b');
eq(clean('https://example.com/?utm_source=x'), 'https://example.com');

// Exception: GitHub `ref` is functional. utm still goes.
eq(clean('https://github.com/org/repo?ref=main&utm_source=x'), 'https://github.com/org/repo?ref=main');

// Redirection unwrapping, then a second cleaning pass on the target.
eq(
  clean('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Fpage%3Futm_source%3Dfb&h=AT'),
  'https://example.com/page'
);
eq(
  clean('https://out.reddit.com/t?url=https%3A%2F%2Fexample.com%2Fa%3Futm_campaign%3Dr'),
  'https://example.com/a'
);

// Existing site rules.
eq(
  clean('https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc&feature=share&t=43&embeds_referring_euri=https%3A%2F%2Fexample.com'),
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=43'
);
eq(clean('https://youtu.be/abcdefghijk?si=aa&t=12'), 'https://youtu.be/abcdefghijk?t=12');
eq(clean('https://open.spotify.com/track/abc?si=def&context=ghi&nd=1'), 'https://open.spotify.com/track/abc');
eq(
  clean('https://www.bilibili.com/video/BV1xx411c7mD?spm_id_from=333.999&from=search&p=1'),
  'https://www.bilibili.com/video/BV1xx411c7mD?p=1'
);
eq(
  clean('https://www.linkedin.com/posts/activity-1?trackingId=abc&trk=public&lipi=xyz&midToken=m'),
  'https://www.linkedin.com/posts/activity-1'
);

eq(
  clean('https://www.amazon.com/Some-Product/dp/B07FZ8S74R/ref=sr_1_1?tag=abc-20&psc=1&keywords=hat'),
  'https://www.amazon.com/dp/B07FZ8S74R'
);
eq(clean('https://www.amazon.com/gp/product/b07fz8s74r?tag=a'), 'https://www.amazon.com/dp/B07FZ8S74R');
eq(clean('https://www.amazon.co.uk/dp/B07FZ8S74R?tag=x-21'), 'https://www.amazon.co.uk/dp/B07FZ8S74R');
eq(
  clean('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage%3Futm_source%3Dnews&sa=D'),
  'https://example.com/page'
);

eq(clean(''), '');
eq(clean('not a link'), 'not a link');
eq(
  clean('See ' + X_DIRTY + ', and https://example.com/z?utm_source=n&id=1.'),
  'See ' + X_CLEAN + ', and https://example.com/z?id=1.'
);

const started = Date.now();
for (var i = 0; i < 400; i++) clean(X_DIRTY);
const elapsed = Date.now() - started;
assert.ok(elapsed < 5000, '400 cleans took ' + elapsed + 'ms');
console.log('clean link: all tests passed (' + elapsed + 'ms for 400 x.com cleans)');
