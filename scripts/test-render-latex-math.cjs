// Edge cases for Render LaTeX Math (MathJax -> SVG image). Run: node scripts/test-render-latex-math.cjs
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dir = path.join(__dirname, '..', 'raw', 'RenderLaTeXMath.openclipext');
const code = fs.readFileSync(path.join(dir, 'dist', 'main.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'openclip.json'), 'utf8'));

// App runtime: JavaScriptCore with a console that only has log (OpenClipJSHost.swift); no document/window/Buffer.
function load(consoleObj = { log() {} }) {
  const out = [];
  const ctx = {
    module: { exports: {} },
    openclip: { input: { isSecondaryClick: false }, options: {}, i18n: s => s.en,
      file: p => out.push({ type: 'file', ...p }), toast: (m, s) => out.push({ type: 'toast', message: m, style: s }) }
  };
  if (consoleObj) ctx.console = consoleObj;
  vm.createContext(ctx);
  const mod = vm.runInContext(code + '\n;module.exports', ctx);
  return {
    mod, ctx,
    run(text, options = {}, secondary = false) {
      out.length = 0;
      ctx.openclip.options = options;
      ctx.openclip.input.isSecondaryClick = secondary;
      mod(text);
      return out[0];
    }
  };
}
const svgOf = r => Buffer.from(r.data, 'base64').toString('utf8');
const app = load();
const { stripDelimiters: strip, parseMacros, renderSVG } = app.mod;
const plain = x => JSON.parse(JSON.stringify(x));

// Delimiters and default mode
assert.deepStrictEqual(plain(strip('$x^2$')), { source: 'x^2', display: false });
assert.deepStrictEqual(plain(strip('  $$\\frac{a}{b}$$ ')), { source: '\\frac{a}{b}', display: true });
assert.deepStrictEqual(plain(strip('\\(a_1\\)')), { source: 'a_1', display: false });
assert.deepStrictEqual(plain(strip('\\[\n\\sum_i i\n\\]')), { source: '\\sum_i i', display: true });
assert.deepStrictEqual(plain(strip('$5 and $6')), { source: '$5 and $6', display: true });
assert.deepStrictEqual(plain(strip('x^2', 'Inline')), { source: 'x^2', display: false });
assert.deepStrictEqual(plain(strip('$$x^2$$', 'Inline')), { source: 'x^2', display: true });
assert.deepStrictEqual(plain(strip('\\(x\\)', 'Display')), { source: 'x', display: false });
assert.deepStrictEqual(plain(strip('a\u200b+\u2009b\ufeff')), { source: 'a+ b', display: true });

// Macros
assert.deepStrictEqual(plain(parseMacros('\\R = \\mathbb{R}\n\\N: \\mathbb{N}; \\eps=\\varepsilon\nbad line\n= x\n\\Z =')),
  { macros: { R: '\\mathbb{R}', N: '\\mathbb{N}', eps: '\\varepsilon' }, invalid: ['bad line', '= x', '\\Z ='] });
assert.deepStrictEqual(plain(parseMacros(undefined)), { macros: {}, invalid: [] });

// Output is a self-contained SVG image (glyphs as paths, no fonts, no foreignObject, no network)
const quad = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
let r = app.run(quad);
assert.strictEqual(r.type, 'file', r.message);
assert.strictEqual(r.mimeType, 'image/svg+xml');
assert.match(r.filename, /\.svg$/);
let svg = svgOf(r);
assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
assert.match(svg, /<path /);
assert.doesNotMatch(svg, /<use |foreignObject|@font-face|https?:\/\/(?!www\.w3\.org)|katex|data-mml-node="merror"/);
assert.match(svg, /^<svg[^>]*width="\d+(\.\d+)?" height="\d+(\.\d+)?"/);
assert.strictEqual(app.run(quad, {}, true).action, 'copy');

// Size, theme
const widthOf = s => Number(s.match(/^<svg[^>]*width="([\d.]+)"/)[1]);
const sizes = ['Small', 'Medium', 'Large'].map(size => widthOf(renderSVG('x^2', true, { size })));
assert.ok(sizes[0] < sizes[1] && sizes[1] < sizes[2], sizes.join());
assert.strictEqual(widthOf(renderSVG('x^2', true, {})), sizes[1]);
assert.match(renderSVG('x', true, { theme: 'Light' }), /<rect [^>]*fill="#fff"/);
assert.match(renderSVG('x', true, { theme: 'Light' }), /fill="#000"/);
assert.match(renderSVG('x', true, { theme: 'Dark' }), /<rect [^>]*fill="#1e1e1e"/);
assert.match(renderSVG('x', true, { theme: 'Dark' }), /fill="#f0f0f0"/);
assert.match(renderSVG('x', true, {}), /prefers-color-scheme:\s*dark/);
assert.doesNotMatch(renderSVG('x', true, { theme: 'Dark' }), /prefers-color-scheme/);

// Accented letters in \text are drawn as font paths, not as <text> with a guessed width
assert.doesNotMatch(renderSVG('\\text{café, naïve, déjà vu, señor, Šimon, Hồ}', true, {}), /<text/);

// Macro used in rendering; inline vs display differ
assert.doesNotMatch(renderSVG('x \\in \\R', true, { macros: '\\R = \\mathbb{R}; junk' }), /merror|\\R/);
assert.notStrictEqual(renderSVG('\\sum_{i=1}^n i', true, {}), renderSVG('\\sum_{i=1}^n i', false, {}));

// Errors: parse error, unknown command, empty, full document
for (const [text, pattern] of [['\\frac{1}{', /Missing|close|brace|argument/i], ['\\notacommand x', /Undefined control sequence/i], ['   ', /Select/], ['\\documentclass{article}', /not full documents/]]) {
  r = app.run(text);
  assert.strictEqual(r.type, 'toast', text);
  assert.strictEqual(r.style, 'error');
  assert.match(r.message, pattern);
}

// Real samples in stripped-down runtimes (no console, log-only, warn not a function)
const samples = [quad, quad.replace(/ /g, '\u200b'), quad.replace(/ /g, '\u2009') + '\ufeff', '\u00a0' + quad,
  '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', '\\text{café 你好 😀}', '\\sum_{n=1}^\\infty \\frac{1}{n^2}', '\\int_0^1 x\\,dx',
  '\\begin{aligned}a&=b\\\\c&=d\\end{aligned}', 'a +\u2028b', '\\mathcal{L} + \\mathbb{R} + \\mathfrak{g}'];
for (const consoleObj of [undefined, { log() {} }, { log() {}, warn: 5 }]) {
  const env = load(consoleObj);
  for (const sample of samples) {
    const res = env.run(sample, { theme: 'Dark', size: 'Large' });
    assert.strictEqual(res.type, 'file', JSON.stringify(sample) + ' -> ' + (res.message || ''));
    assert.doesNotMatch(svgOf(res), /merror/);
  }
}

// Visibility regex
const re = new RegExp(manifest.action.requirements.regex);
for (const yes of ['\\frac{a}{b}', 'x^2 + y^2', '$a_1$', 'E = mc^2', '\\[x\\]', 'x_1', 'a_12', 'x_i + y_j', '(a_n)']) assert.ok(re.test(yes), yes);
for (const no of ['hello world', 'snake_case_name', 'https://example.com/a_b', 'C:\\Users\\me', 'price is $5', 'my_var_1', 'foo_bar', 'file_name_2', 'see https://x.com/a_1']) assert.ok(!re.test(no), no);
for (const [k, v] of Object.entries(manifest.description)) assert.ok(v.length <= 120, k);
assert.strictEqual(manifest.version, '1.0.0');
console.log('render latex math: all tests passed');
