// Whitespace edge cases for Time Zone Converter. Run: node scripts/test-timezone-converter.cjs
// Runs both the manifest regex (does the action show?) and the script (what does it return?).
const assert = require('node:assert');
const path = require('node:path');
const dir = path.join(__dirname, '..', 'raw', 'TimeZoneConverter.openclipext');
const manifest = require(path.join(dir, 'openclip.json'));
global.openclip = { options: {}, input: { text: '' } };
const action = require(path.join(dir, 'main.js'));
// The app uses NSRegularExpression with .caseInsensitive on the trimmed selection.
const re = new RegExp(manifest.action.requirements.regex, 'i');

function run(sel) {
  const trimmed = sel.trim();
  const m = trimmed.match(re);
  assert.ok(m, `regex should match ${JSON.stringify(sel)}`);
  global.openclip = { options: { targetZone: 'UTC', timeFormat: '24h' }, input: { text: sel, matchedText: m[0] } };
  return action();
}

const cases = [
  // no-space regressions
  ['3PM', '15:00 UTC'], ['3:30pm', '15:30 UTC'], ['10:00AM IST', '04:30 UTC'], ['15:00 UTC', '15:00 UTC'],
  // normal / multiple spaces
  ['3 PM', '15:00 UTC'], ['3:30 pm', '15:30 UTC'], ['3:30   pm', '15:30 UTC'], ['10:00 AM IST', '04:30 UTC'],
  ['10 AM  IST', '04:30 UTC'], ['3 pm PST', /^(22|23):00 UTC$/],
  // leading / trailing whitespace, tabs, newlines
  ['  3:30 PM  ', '15:30 UTC'], ['\t10:00 AM IST\n', '04:30 UTC'], ['3:30\tPM', '15:30 UTC'],
  // non-breaking and thin spaces (macOS writes "3:30\u202fPM")
  ['3:30\u00a0PM', '15:30 UTC'], ['3:30\u202fPM', '15:30 UTC'], ['3:30\u2009PM', '15:30 UTC'],
  ['10:00\u202fAM\u00a0IST', '04:30 UTC'],
  // spaces inside the time itself and dotted meridiems
  ['3:30 p.m.', '15:30 UTC'], ['3:30 P.M. IST', '10:00 UTC'], ['10 a.m. IST', '04:30 UTC'],
  // zone forms with spaces
  ['15:00 UTC+5:30', '09:30 UTC'], ['15:00 UTC +05:30', '09:30 UTC'], ['5:30 PM Asia/Kolkata', '12:00 UTC'],
];

let failed = 0;
for (const [input, want] of cases) {
  let got;
  try { got = run(input); } catch (e) { got = 'THREW: ' + e.message; }
  const ok = want instanceof RegExp ? want.test(String(got)) : got === want;
  if (!ok) { failed++; console.log(`FAIL ${JSON.stringify(input)} -> ${JSON.stringify(got)} (want ${want})`); }
}
// unrelated numbers must not convert
for (const t of ['I ate 3 apples', 'id <@123456789>', 'year 2026', 'chapter 3 amendments']) {
  global.openclip = { options: { targetZone: 'UTC' }, input: { text: t, matchedText: t } };
  assert.strictEqual(action(), null, t);
}
global.openclip = { options: {}, input: { text: '' } };
assert.strictEqual(action(''), null);
if (failed) { console.log(`timezone converter: ${failed}/${cases.length} failed`); process.exit(1); }
console.log(`timezone converter: all ${cases.length} tests passed`);
