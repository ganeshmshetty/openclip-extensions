// Edge cases for Render LaTeX Math. Run: node scripts/test-render-latex-math.cjs
const assert = require('node:assert');
const path = require('node:path');
let last;
global.openclip = {
  input: { text: '', isSecondaryClick: false },
  i18n: s => s.en,
  file: p => { last = { type: 'file', ...p }; },
  toast: (m, s) => { last = { type: 'toast', message: m, style: s }; }
};
const mod = require(path.join(__dirname, '..', 'raw', 'RenderLaTeXMath.openclipext', 'dist', 'main.js'));
const { stripDelimiters: strip, renderDocument } = mod;

assert.deepStrictEqual(strip('$x^2$'), { source: 'x^2', display: false });
assert.deepStrictEqual(strip('  $$\\frac{a}{b}$$ '), { source: '\\frac{a}{b}', display: true });
assert.deepStrictEqual(strip('\\(a_1\\)'), { source: 'a_1', display: false });
assert.deepStrictEqual(strip('\\[\n\\sum_i i\n\\]'), { source: '\\sum_i i', display: true });
assert.deepStrictEqual(strip('\\alpha + \\beta'), { source: '\\alpha + \\beta', display: true });
assert.deepStrictEqual(strip('$5 and $6'), { source: '$5 and $6', display: true });

for (const s of ['\\frac{1}{2}', '\\sum_{i=1}^{n} i^2', '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}', '\\text{café 你好} = \\alpha']) {
  const html = renderDocument(s, true);
  assert.match(html, /<span class="katex-display"/);
  assert.match(html, /@font-face/);
  assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/);
}
assert.match(renderDocument('\\text{café 你好}', true), /café 你好/);
assert.doesNotMatch(renderDocument("x", false), /<span class="katex-display"/);

const run = text => { last = undefined; openclip.input.text = text; mod(text); return last; };
let r = run('$$\\frac{a}{b}$$');
assert.strictEqual(r.type, 'file'); assert.strictEqual(r.mimeType, 'text/html');
assert.match(Buffer.from(r.data, 'base64').toString('utf8'), /katex/);
r = run('\\frac{1}{');
assert.strictEqual(r.type, 'toast'); assert.strictEqual(r.style, 'error'); assert.match(r.message, /KaTeX parse error|Expected/);
r = run('   ');
assert.strictEqual(r.type, 'toast'); assert.match(r.message, /Select/);
openclip.input.isSecondaryClick = true;
assert.strictEqual(run('x^2').action, 'copy');
openclip.input.isSecondaryClick = false;

const re = new RegExp(require('../raw/RenderLaTeXMath.openclipext/openclip.json').action.requirements.regex);
for (const yes of ['\\frac{a}{b}', 'x^2 + y^2', '$a_1$', 'E = mc^2', '\\[x\\]']) assert.ok(re.test(yes), yes);
for (const no of ['hello world', 'snake_case_name', 'https://example.com/a_b', 'C:\\Users\\me', 'price is $5']) assert.ok(!re.test(no), no);
console.log('render latex math: all tests passed');
