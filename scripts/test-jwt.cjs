// Edge cases for JWT. Run: node scripts/test-jwt.cjs
const assert = require('node:assert');
const path = require('node:path');
const toasts = [];
global.openclip = { locale: 'en', toast: (m) => toasts.push(m) };
const decode = require(path.join(__dirname, '..', 'raw', 'JWT.openclipext', 'decode.js'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const tok = (p, h = { alg: 'HS256' }) => `${b64(h)}.${b64(p)}.sig`;

let out = decode(`Authorization: Bearer "${tok({ sub: 'a', exp: now + 3120 })}"`);
assert.match(out, /^Expires in 52 minutes\n\n\{\n  "sub": "a"/);
assert.match(decode(tok({ exp: now - 10800 })), /^Expired 3 hours ago\n\n/);
assert.match(decode(tok({ nbf: now + 300, exp: now + 900 })), /^Becomes valid in 5 minutes\n\n/);
assert.match(decode(tok({ nbf: now + 300, exp: now - 60 })), /^Expired 1 minute ago\n\n/);
assert.match(decode(tok({ sub: 'x' })), /^No expiry claim\n\n/);
assert.strictEqual(decode(tok({}, { alg: 'dir', enc: 'A256GCM' })), undefined);
assert.match(toasts.pop(), /JWE/);
assert.strictEqual(decode('a.b.c.d.e'), undefined);
assert.match(toasts.pop(), /JWE/);
console.log('jwt: all tests passed');
