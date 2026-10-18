const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.join(__dirname, '..');
const source = 'flowchart LR\n A["你好 café 🚀"] --> B[Done]';

function run(options = {}, input = source) {
  const env = { ...process.env };
  for (const key of ['format', 'theme', 'transparent', 'fontSize', 'padding', 'scale']) {
    env['OPENCLIP_OPTION_' + key.toUpperCase()] = options[key] || '';
  }
  const result = spawnSync(path.join(root, 'run.sh'), [], { input, encoding: 'utf8', env, timeout: 15000, maxBuffer: 10 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return JSON.parse(result.stdout);
}

function png(options) {
  const result = run({ format: 'png', ...options });
  assert.equal(result.type, 'file', result.message);
  assert.equal(result.mimeType, 'image/png');
  assert.match(result.filename, /\.png$/);
  const data = Buffer.from(result.data, 'base64');
  assert.deepEqual(data.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { data, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function cornerColor(data) {
  const script = `ObjC.import('AppKit');
    const input = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile;
    const encoded = $.NSString.alloc.initWithDataEncoding(input, $.NSUTF8StringEncoding);
    const bytes = $.NSData.alloc.initWithBase64EncodedStringOptions(encoded, 0);
    const bitmap = $.NSBitmapImageRep.imageRepWithData(bytes);
    const color = bitmap.colorAtXY(0, 0).colorUsingColorSpace($.NSColorSpace.genericRGBColorSpace);
    JSON.stringify({ red: color.redComponent, green: color.greenComponent, blue: color.blueComponent, alpha: color.alphaComponent });`;
  const result = spawnSync('/usr/bin/osascript', ['-l', 'JavaScript', '-e', script], {
    input: data.toString('base64'), encoding: 'utf8', timeout: 15000
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('native exporter runs from another working directory and preserves Unicode SVG', { skip: process.platform !== 'darwin' }, () => {
  const result = run();
  assert.equal(result.type, 'file', result.message);
  assert.equal(result.mimeType, 'image/svg+xml');
  assert.match(Buffer.from(result.data, 'base64').toString('utf8'), /你好 café 🚀/);
});

test('native PNG exporter respects 1×, 2×, and 3× resolution', { skip: process.platform !== 'darwin' }, () => {
  const one = png({ scale: '1' });
  for (const scale of [2, 3]) {
    const output = png({ scale: String(scale) });
    assert.equal(output.width, one.width * scale);
    assert.equal(output.height, one.height * scale);
  }
});

test('native PNG export supports dark themes and transparency', { skip: process.platform !== 'darwin' }, () => {
  for (const transparent of ['true', 'false']) {
    const result = png({ theme: 'dark', transparent });
    assert.ok(result.data.length > 1000);
    const color = cornerColor(result.data);
    if (transparent === 'true') {
      assert.equal(color.alpha, 0);
    } else {
      assert.equal(color.alpha, 1);
      assert.ok(Math.abs(color.red - 16 / 255) < 0.01);
      assert.ok(Math.abs(color.green - 15 / 255) < 0.01);
      assert.ok(Math.abs(color.blue - 15 / 255) < 0.01);
    }
  }
});

test('native PNG export rejects excessive image dimensions before rasterizing', { skip: process.platform !== 'darwin' }, () => {
  const large = 'graph TD\n' + Array.from({ length: 100 }, (_, index) => `n${index} --> n${index + 1}`).join('\n');
  const result = run({ format: 'png', scale: '3' }, large);
  assert.equal(result.type, 'toast');
  assert.match(result.message, /too large for PNG/);
});

test('native exporter reports invalid source as an error without generating a file', { skip: process.platform !== 'darwin' }, () => {
  const result = run({ format: 'png' }, 'not a Mermaid diagram');
  assert.equal(result.type, 'toast');
  assert.equal(result.style, 'error');
});

test('package points to an executable native exporter with format defaults', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'openclip.json')));
  assert.equal(manifest.action.script, 'run.sh');
  assert.equal(manifest.action.type, 'shell');
  assert.equal(fs.statSync(path.join(root, 'run.sh')).mode & 0o111, 0o111);
  assert.equal(manifest.options.find(option => option.identifier === 'format').default, 'svg');
});
