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

// Every case passes sourceZone/targetZone explicitly so results never depend on the machine's
// clock zone. CI runs this under TZ=UTC, TZ=Asia/Kolkata and TZ=America/New_York.
function run(sel, opts) {
  const trimmed = sel.trim();
  const m = trimmed.match(re);
  assert.ok(m, `regex should match ${JSON.stringify(sel)}`);
  const options = Object.assign({ sourceZone: 'UTC', targetZone: 'UTC', timeFormat: '24h' }, opts || {});
  global.openclip = { options, input: { text: sel, matchedText: m[0] } };
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
  // three-part IANA zones must be read in full (Buenos Aires is UTC-3, no DST)
  ['12:00 America/Argentina/Buenos_Aires', '15:00 UTC'],
  ['3 PM America/Argentina/Buenos_Aires', '18:00 UTC'],
  // no-zone selections use the Source Time Zone option
  ['10:00', '10:00 UTC'],
  ['10:00', '04:30 UTC', { sourceZone: 'IST' }],
  ['10:00', '15:30 IST', { targetZone: 'IST' }],
  // explicit zone in the text beats the Source Time Zone option
  ['12:00 UTC', '12:00 UTC', { sourceZone: 'IST' }],
  ['15:00 UTC+5:30', '09:30 UTC', { sourceZone: 'JST' }],
  ['5:30 PM Asia/Kolkata', '12:00 UTC', { sourceZone: 'PST' }],
  // real-world report: dashboard time with a date and no zone, Source=UTC, Target=IST
  ['Oct 26, 2026, 06:47:31', '12:17 PM IST', { targetZone: 'IST', timeFormat: '12h' }],
  ['Oct 26, 2026, 06:47:31', 'Mon 12:17 PM IST', { targetZone: 'IST', timeFormat: '12h', includeDate: true }],
  ['Oct 26, 2026, 20:47:31', '2:17 AM (+1d) IST', { targetZone: 'IST', timeFormat: '12h' }],
  ['Oct 26, 2026, 20:47:31', 'Tue 2:17 AM IST', { targetZone: 'IST', timeFormat: '12h', includeDate: true }],
  // the date sets DST: New York is UTC-4 in July and UTC-5 in January
  ['2026-07-01 12:00', '08:00 ET', { targetZone: 'ET' }],
  ['2026-01-15 12:00', '07:00 ET', { targetZone: 'ET' }],
  ['Jan 15, 2026 12:00', '07:00 ET', { targetZone: 'ET' }],
];

let failed = 0;
for (const [input, want, opts] of cases) {
  let got;
  try { got = run(input, opts); } catch (e) { got = 'THREW: ' + e.message; }
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
// invalid offsets are not honored as zones: they fall back to the Source Time Zone (UTC here)
for (const t of ['15:00 UTC+05:60', '15:00 UTC+15:00', '15:00 +25']) {
  global.openclip = { options: { sourceZone: 'UTC', targetZone: 'UTC', timeFormat: '24h' }, input: { text: t, matchedText: t } };
  const got = action();
  if (got !== '15:00 UTC') { failed++; console.log(`FAIL invalid offset ${JSON.stringify(t)} -> ${JSON.stringify(got)} (want 15:00 UTC)`); }
}
// manifest: Source Time Zone first, default UTC, no Auto, same zone list as target minus Local;
// Target defaults to Local; regex matches 3-part zones in full
{
  const opts = manifest.options;
  const src = opts[0], tgt = opts.find(o => o.identifier === 'targetZone');
  const chk = (c, msg) => { if (!c) { failed++; console.log('FAIL manifest: ' + msg); } };
  chk(src.identifier === 'sourceZone' && src.default === 'UTC', 'sourceZone first, default UTC');
  chk(!src.values.includes('Auto') && !src.values.includes('Local'), 'sourceZone has no Auto/Local');
  chk(tgt.default === 'Local', 'targetZone default Local');
  chk(JSON.stringify(src.values) === JSON.stringify(tgt.values.filter(v => v !== 'Local')), 'same zone list');
  const m = '12:00 America/Argentina/Buenos_Aires'.match(re);
  chk(m && m[0] === '12:00 America/Argentina/Buenos_Aires', 'regex matches 3-part zone fully, got ' + (m && m[0]));
}
// Local target shows a real zone label, never the word "Local"
{
  global.openclip = { options: { sourceZone: 'UTC', targetZone: 'Local', timeFormat: '24h' }, input: { text: '12:00', matchedText: '12:00' } };
  const got = action();
  if (!got || /Local/.test(got)) { failed++; console.log(`FAIL Local label -> ${JSON.stringify(got)}`); }
  if (process.env.TZ === 'Asia/Kolkata' && got !== '17:30 IST') { failed++; console.log(`FAIL Local in Kolkata -> ${got}`); }
}
if (failed) { console.log(`timezone converter: ${failed} failed`); process.exit(1); }
console.log(`timezone converter: all ${cases.length} tests passed`);
