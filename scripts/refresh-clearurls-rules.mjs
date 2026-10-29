#!/usr/bin/env node
// Refresh the offline ClearURLs rules snapshot used by Clean Link.
// Run by hand at release time:
//   node scripts/refresh-clearurls-rules.mjs
//
// The snapshot stays under LGPL-3.0 (ClearURLs/Rules). This script only
// downloads and wraps it; it does not relicense the data.

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://rules2.clearurls.xyz/data.minify.json';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'raw', 'CleanLink.openclipext', 'clearurls-rules.js');

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error('Failed to download rules: HTTP ' + response.status);
  process.exit(1);
}

let text = (await response.text()).trim();
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
if (/[\u2028\u2029]/.test(text)) text = JSON.stringify(JSON.parse(text));

let data;
try {
  data = JSON.parse(text);
} catch (error) {
  console.error('Rules payload is not JSON: ' + error.message);
  process.exit(1);
}
if (!data || typeof data.providers !== 'object' || Array.isArray(data.providers)) {
  console.error('Rules payload has no providers object');
  process.exit(1);
}

const names = Object.keys(data.providers);
if (names.length < 50) {
  console.error('Refusing to write a snapshot with only ' + names.length + ' providers');
  process.exit(1);
}

let ruleCount = 0;
const failures = [];
for (let i = 0; i < names.length; i++) {
  const provider = data.providers[names[i]] || {};
  const lists = [
    ['urlPattern', provider.urlPattern ? [provider.urlPattern] : [], 'i', false],
    ['exceptions', provider.exceptions || [], 'i', false],
    ['redirections', provider.redirections || [], 'i', false],
    ['rawRules', provider.rawRules || [], 'gi', false],
    ['rules', provider.rules || [], 'i', true],
    ['referralMarketing', provider.referralMarketing || [], 'i', true]
  ];
  if (provider.completeProvider) lists.push(['complete', ['.*'], 'i', true]);
  for (let l = 0; l < lists.length; l++) {
    const kind = lists[l][0];
    const items = lists[l][1];
    const flags = lists[l][2];
    const anchor = lists[l][3];
    for (let r = 0; r < items.length; r++) {
      const src = anchor ? '^' + items[r] + '$' : items[r];
      try {
        RegExp(src, flags);
        if (kind === 'rules' || kind === 'referralMarketing' || kind === 'complete') ruleCount++;
      } catch (error) {
        failures.push(names[i] + ' ' + kind + ': ' + error.message);
      }
    }
  }
}
if (failures.length) {
  console.error('Refusing to write a snapshot with invalid patterns:');
  failures.slice(0, 20).forEach(function (line) { console.error('  ' + line); });
  process.exit(1);
}

const xRules = (data.providers.x && data.providers.x.rules) || [];
const stripsA = xRules.some(function (rule) {
  return new RegExp('^' + rule + '$', 'i').test('a');
});

const sha = createHash('sha256').update(text).digest('hex');
const header = [
  '/*',
  ' * ClearURLs rules snapshot. Do not edit by hand.',
  ' * Source: ' + SOURCE,
  ' * Project: https://github.com/ClearURLs/Rules',
  ' * Copyright ClearURLs contributors',
  ' * License: GNU LGPL-3.0 (see LICENSE.clearurls-rules). This file is not MIT.',
  ' * Retrieved: ' + new Date().toISOString().slice(0, 10),
  ' * SHA-256: ' + sha,
  ' * Providers: ' + names.length,
  ' * Regenerate: node scripts/refresh-clearurls-rules.mjs',
  ' */',
  ''
].join('\n');

writeFileSync(outPath, header + 'module.exports = ' + text + ';\n');

const require = createRequire(import.meta.url);
const loaded = require(outPath);
if (!loaded.providers || Object.keys(loaded.providers).length !== names.length) {
  console.error('Wrote the snapshot but node could not load it back');
  process.exit(1);
}

const bytes = Buffer.byteLength(header + 'module.exports = ' + text + ';\n');
console.log('Wrote ' + outPath);
console.log('providers=' + names.length + ' anchoredRules=' + ruleCount + ' bytes=' + bytes);
console.log('sha256=' + sha);
if (stripsA) {
  console.log('note: upstream x rules now match `a`; the OpenClip override is redundant');
} else {
  console.log('note: upstream x rules still do not match `a`; keep the OpenClip override');
}
