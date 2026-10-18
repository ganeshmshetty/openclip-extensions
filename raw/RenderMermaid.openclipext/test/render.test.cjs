const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const bundle = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

function run(selection, secondary = false, options = {}) {
  const effects = [];
  const context = vm.createContext({
    module: { exports: {} },
    openclip: {
      input: { isSecondaryClick: secondary },
      file: payload => effects.push({ type: 'file', ...payload }),
      toast: (message, style) => effects.push({ type: 'toast', message, style }),
      i18n: translations => translations.en
    }
  });
  vm.runInContext(bundle, context);
  context.selection = selection;
  context.options = options;
  vm.runInContext('module.exports(selection, options)', context, { timeout: 5000 });
  return effects;
}

function diagram(selection, secondary, options) {
  const effects = run(selection, secondary, options);
  assert.equal(effects.length, 1);
  assert.equal(effects[0].type, 'file', effects[0].message);
  assert.equal(effects[0].mimeType, 'image/svg+xml');
  return { payload: effects[0], svg: Buffer.from(effects[0].data, 'base64').toString('utf8') };
}

test('renders raw source without browser or Node globals and exports literal colors', () => {
  const { payload, svg } = diagram('flowchart LR\n A[Start] --> B[Done]');
  assert.equal(payload.filename, 'mermaid-flowchart.svg');
  assert.equal(payload.action, undefined);
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /fill="#fff"/);
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  assert.ok(svg.includes(`<rect width="${viewBox[1]}" height="${viewBox[2]}" fill="#fff"/>`));
  assert.match(svg, /fill="#f3f3f3"/);
  assert.doesNotMatch(svg, /var\(/);
});

test('accepts backtick and tilde fences with Windows line endings', () => {
  for (const fence of ['```', '~~~~']) {
    const { svg } = diagram(`${fence}mermaid\r\nsequenceDiagram\r\nAlice->>Bob: Hi\r\n${fence}`);
    assert.match(svg, /pele-sequence/);
  }
});

test('preserves Unicode labels and CSS-looking label text', () => {
  const { svg } = diagram('flowchart LR\n A["你好 café 🚀 var(--_fg)"] --> B["終わり"]');
  assert.match(svg, /你好 café 🚀 var\(--_fg\)/);
  assert.match(svg, /終わり/);
});

test('secondary click copies the SVG file', () => {
  assert.equal(diagram('graph TD\n A --> B', true).payload.action, 'copy');
});

test('renders pie chart series colors', () => {
  const { svg } = diagram('pie title Fruit\n "Apple" : 30\n "Pear" : 70');
  assert.match(svg, /#4c78a8/);
  assert.match(svg, /#f58518/);
  assert.doesNotMatch(svg, /var\(/);
});

test('rejects empty, unsupported, malformed, and oversized input without file effects', () => {
  for (const source of ['', '   ', '```mermaid\n\n```', 'hello world', 'flowchart TD\n A[broken', 'x'.repeat(50001)]) {
    const effects = run(source);
    assert.equal(effects.length, 1);
    assert.equal(effects[0].type, 'toast');
    assert.equal(effects[0].style, 'error');
    assert.ok(effects[0].message.length > 0);
  }
});

test('does not export diagram navigation links', () => {
  const { svg } = diagram('flowchart LR\n A[Example]\n click A "https://example.com"');
  assert.doesNotMatch(svg, /href=|<script\b|onclick=/);
});

test('applies the dark theme without unresolved CSS variables', () => {
  const { svg } = diagram('flowchart LR\n A --> B', false, { theme: 'dark' });
  assert.match(svg, /fill="#100f0f"/);
  assert.match(svg, /fill="#cecdc3"/);
  assert.match(svg, /stroke="#575653"/);
  assert.doesNotMatch(svg, /var\(/);
});

test('transparent exports omit only the full background rectangle', () => {
  const { svg } = diagram('flowchart LR\n A --> B', false, { transparent: 'true' });
  assert.doesNotMatch(svg, /^<svg\b[^>]*><rect/);
  assert.match(svg, /pele-nodes/);
});

test('font size and padding affect output dimensions, with safe defaults for invalid values', () => {
  const source = 'flowchart LR\n A[Label] --> B[Another label]';
  const normal = diagram(source).svg;
  const large = diagram(source, false, { fontSize: '24', padding: '32' }).svg;
  assert.match(large, /font:24px/);
  const dimensions = svg => svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
  assert.ok(dimensions(large)[0] > dimensions(normal)[0]);
  assert.ok(dimensions(large)[1] > dimensions(normal)[1]);
  assert.equal(diagram(source, false, { fontSize: 'Infinity', padding: '-1' }).svg, normal);
});
