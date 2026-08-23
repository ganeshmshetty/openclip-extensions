#!/usr/bin/env node
// build-icons.mjs — generates one canonical web icon per extension into
// published/icons/<identifier>.png during publish (CI or local).
//
// Source priority per package:
//   1. Manifest icon references a packaged .svg/.png file  → rasterize it
//   2. Manifest icon is a bare SF Symbol name              → look up icon-map.json
//      (Iconify id) and fetch https://api.iconify.design/<prefix>/<name>.svg
//   3. Nothing resolvable                                   → deterministic letter tile
//
 // Contract enforcement: if the manifest claims a packaged file that is missing,
 // this script FAILS — the publish must not ship an entry whose icon cannot load.
//
// Usage: node scripts/build-icons.mjs [--raw raw] [--out published/icons]
//        [--map icon-map.json] [--size 128]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const ROOT = process.cwd();
const RAW_DIR = path.resolve(ROOT, arg('raw', 'raw'));
const OUT_DIR = path.resolve(ROOT, arg('out', 'published/icons'));
const MAP_FILE = path.resolve(ROOT, arg('map', 'icon-map.json'));
const SIZE = parseInt(arg('size', '128'), 10);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function letterTileSvg(id, name) {
  const initial = (name || id).trim().charAt(0).toUpperCase() || '?';
  const hue = hashHue(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${Math.round(SIZE * 0.22)}" fill="hsl(${hue}, 55%, 45%)"/>
  <text x="50%" y="54%" dy=".35em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(SIZE * 0.44)}"
        font-weight="600" fill="#ffffff">${initial}</text>
</svg>`;
}

async function pngFromSvg(svg, sourceLabel) {
  try {
    return await sharp(Buffer.from(svg), { density: 300 })
      .resize(SIZE, SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch (err) {
    throw new Error(`${sourceLabel}: SVG failed to rasterize (${err.message})`);
  }
}

async function findPackagedIcon(pkgDir, iconValue) {
  const wanted = iconValue.toLowerCase();
  const entries = await fs.readdir(pkgDir);
  const hit = entries.find((f) => f.toLowerCase() === wanted);
  if (hit) return path.join(pkgDir, hit);
  // Case-insensitive sweep over any packaged image asset.
  const anyImage = entries.find((f) => /\.(svg|png)$/i.test(f));
  return anyImage ? path.join(pkgDir, anyImage) : null;
}

async function fetchIconifySvg(iconifyId) {
  const [prefix, ...rest] = iconifyId.split(':');
  const name = rest.join(':');
  if (!prefix || !name) throw new Error(`bad Iconify id '${iconifyId}'`);
  const url = `https://api.iconify.design/${prefix}/${name}.svg?height=${SIZE * 2}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Iconify HTTP ${res.status} for ${iconifyId}`);
  const svg = await res.text();
  if (!svg.trim().startsWith('<svg')) throw new Error(`Iconify returned non-SVG for ${iconifyId}`);
  return svg;
}

async function main() {
  const map = await readJson(MAP_FILE).catch(() => ({}));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const pkgDirs = (await fs.readdir(RAW_DIR))
    .filter((d) => d.endsWith('.openclipext'))
    .sort();

  let built = 0;
  const errors = [];

  for (const pkg of pkgDirs) {
    const pkgDir = path.join(RAW_DIR, pkg);
    const manifestFile = path.join(pkgDir, 'openclip.json');
    let manifest;
    try {
      manifest = await readJson(manifestFile);
    } catch {
      continue; // no manifest → not publishable; zip step skips it too
    }

    const identifier =
      manifest.identifier ||
      `com.openclip.${pkg.replace(/\.openclipext$/, '').toLowerCase()}`;
    const displayName = manifest.name || identifier;
    const iconValue =
      manifest.action?.icon ?? manifest.actions?.[0]?.icon ?? 'puzzlepiece';

    try {
      let svgSource = null;

      if (/\.(svg|png)$/i.test(iconValue)) {
        const found = await findPackagedIcon(pkgDir, iconValue);
        if (!found) {
          throw new Error(
            `manifest icon '${iconValue}' does not exist in ${pkg}/ — add the file or use an SF Symbol / mapped icon`);
        }
        svgSource = await fs.readFile(found);
      } else if (/^[a-z0-9.-]+$/i.test(iconValue) && !iconValue.includes(':')) {
        // Bare SF Symbol name → mapped Iconify icon (app renders it natively too).
        const iconifyId = map[iconValue];
        if (!iconifyId) {
          console.warn(`⚠ ${identifier}: SF Symbol '${iconValue}' not in icon-map.json; using letter tile`);
          svgSource = letterTileSvg(identifier, displayName);
        } else {
          svgSource = await fetchIconifySvg(iconifyId);
        }
      } else {
        // Iconify-style "prefix:name" in the manifest itself, or anything else odd.
        svgSource = iconValue.includes(':')
          ? await fetchIconifySvg(iconValue)
          : letterTileSvg(identifier, displayName);
      }

      const png = await pngFromSvg(svgSource, identifier);
      const out = path.join(OUT_DIR, `${identifier}.png`);
      await fs.writeFile(out, png);
      built++;
      console.log(`✓ ${identifier}.png`);
    } catch (err) {
      errors.push(err.message);
      console.error(`✗ ${identifier}: ${err.message}`);
    }
  }

  console.log(`\nGenerated ${built} icon(s) → ${path.relative(ROOT, OUT_DIR)}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main();
