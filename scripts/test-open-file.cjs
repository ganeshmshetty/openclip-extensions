#!/usr/bin/env node
// Shell integration tests; macOS application launching/package lookup are stubbed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'open-file-'));
const script = path.resolve(__dirname, '../raw/OpenFile.openclipext/main.sh');
try {
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'open'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'osascript'), `#!/bin/sh
[ "$1" = -l ] && [ "$2" = JavaScript ] && [ "$3" = - ] || exit 1
cat >/dev/null
[ "$4" = "$TEST_PACKAGE" ] && echo true || echo false
`, { mode: 0o755 });
  const file = path.join(root, 'My File.txt');
  const backslash = path.join(root, 'literal\\ name.txt');
  const escape = path.join(root, 'literal\\n.txt');
  const colon = path.join(root, 'literal:12:3');
  for (const name of [file, backslash, escape, colon]) fs.writeFileSync(name, '');
  const pkg = path.join(root, 'report.pages');
  const folder = path.join(root, 'project.v1');
  fs.mkdirSync(pkg);
  fs.mkdirSync(folder);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, HOME: root,
    TEST_PACKAGE: pkg, OPENCLIP_LANGUAGE: 'en' };
  let count = 0;
  function check(input, expected) {
    const result = spawnSync('zsh', [script], { env: { ...env, OPENCLIP_TEXT: input }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trimEnd(), expected, input);
    count++;
  }
  const opened = (name) => `--\n${name}`;
  const missing = '{"type":"toast","message":"File not found","style":"error"}';
  const isFolder = '{"type":"toast","message":"That path is a folder","style":"error"}';
  check('', '');
  check(`  "${file}"  `, opened(file));
  check(file.replace(' ', '\\ '), opened(file));
  check('~/My File.txt', opened(file));
  check(`file://${file.replace(' ', '%20')}`, opened(file));
  check(`file://localhost${file.replace(' ', '%20')}`, opened(file));
  check(`file://remote${file}`, missing);
  check('file://remote', missing);
  check(`file://${backslash.replace('\\', '%5C').replace(' ', '%20')}`, opened(backslash));
  check(`file://${backslash.replace(' ', '%20')}`, opened(backslash));
  check(`file://${escape}`, opened(escape));
  check(`${file}:12`, opened(file));
  check(`${file}:12:3`, opened(file));
  check(`file://${file.replace(' ', '%20')}:12:3`, opened(file));
  check(colon, opened(colon));
  check(`${pkg}///`, opened(pkg));
  check(`file://${pkg}/`, opened(pkg));
  check(folder, isFolder);
  check(`${folder}/`, isFolder);
  check('/', isFolder);
  check(path.join(root, 'missing'), missing);
  console.log(`Passed ${count} Open File cases`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
