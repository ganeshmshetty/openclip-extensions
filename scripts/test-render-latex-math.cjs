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

// Settings
const { parseMacros } = mod;
const body = h => h.slice(h.indexOf('<body'));
assert.match(renderDocument('x', true, { size: 'Small' }), /font-size:1\.2em/);
assert.match(renderDocument('x', true, {}), /font-size:1\.6em/);
assert.match(renderDocument('x', true, { size: 'Large' }), /font-size:2\.2em/);
assert.match(renderDocument('x', true, { theme: 'Dark' }), /background:#1e1e1e;color:#f0f0f0/);
assert.doesNotMatch(renderDocument('x', true, { theme: 'Dark' }), /prefers-color-scheme/);
assert.match(renderDocument('x', true, { theme: 'Light' }), /background:#fff;color:#000/);
assert.doesNotMatch(renderDocument('x', true, { theme: 'Light' }), /prefers-color-scheme/);
assert.match(renderDocument('x', true, {}), /@media \(prefers-color-scheme:dark\)\{html,body\{background:#1e1e1e;color:#f0f0f0\}\}/);

assert.deepStrictEqual(parseMacros('\\R = \\mathbb{R}\n\\N: \\mathbb{N}; \\eps=\\varepsilon\nbad line\n= x\n\\Z ='),
  { macros: { '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}', '\\eps': '\\varepsilon' }, invalid: ['bad line', '= x', '\\Z ='] });
assert.deepStrictEqual(parseMacros(''), { macros: {}, invalid: [] });
assert.deepStrictEqual(parseMacros(undefined), { macros: {}, invalid: [] });
const withMacro = renderDocument('x \\in \\R', true, { macros: '\\R = \\mathbb{R}; junk' });
assert.match(body(withMacro), /mathbb/);
assert.doesNotMatch(body(withMacro), /katex-error/);

assert.deepStrictEqual(strip('x^2', 'Inline'), { source: 'x^2', display: false });
assert.deepStrictEqual(strip('x^2', 'Display'), { source: 'x^2', display: true });
assert.deepStrictEqual(strip('$$x^2$$', 'Inline'), { source: 'x^2', display: true });
assert.deepStrictEqual(strip('\\(x\\)', 'Display'), { source: 'x', display: false });

openclip.options = { mode: 'Inline', macros: '\\R = \\mathbb{R}', theme: 'Dark', size: 'Large' };
const html = Buffer.from(run('\\R^2').data, 'base64').toString('utf8');
assert.doesNotMatch(body(html), /<span class="katex-display"/);
assert.match(html, /font-size:2\.2em/); assert.match(html, /#1e1e1e/); assert.match(body(html), /mathbb/);
openclip.options = {};
console.log('render latex math: all tests passed');
