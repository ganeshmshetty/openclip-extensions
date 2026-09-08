#!/usr/bin/env node
// build-icons.mjs — generates one canonical ADAPTIVE web icon per extension
// into published/icons/<identifier>.svg during publish (CI or local).
//
// Icons stay monochrome/currentColor so they inherit theme color everywhere
// (website light/dark, app tinting). SVG paths and PNG alpha are preserved.
//
// Source priority per package:
//   1. Packaged SVG → normalize dimensions; packaged PNG → embed as an alpha mask
//   2. Manifest icon is a bare SF Symbol name → look up icon-map.json
//      (Iconify id) and fetch https://api.iconify.design/<prefix>/<name>.svg
//   3. Nothing resolvable → deterministic colored letter tile (intentionally
//      self-colored; it is a brand-style fallback, not a tintable glyph)
//
// Contract enforcement: if the manifest claims a packaged file that is missing,
// this script FAILS — the publish must not ship an entry whose icon cannot load.
//
// Usage: node scripts/build-icons.mjs [--raw raw] [--out published/icons]
//        [--map icon-map.json]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ICONIFY_BASE = 'https://api.iconify.design';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const ROOT = process.cwd();
const RAW_DIR = path.resolve(ROOT, arg('raw', 'raw'));
const OUT_DIR = path.resolve(ROOT, arg('out', 'published/icons'));
const MAP_FILE = path.resolve(ROOT, arg('map', 'icon-map.json'));

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">\n  <rect width="128" height="128" rx="28" fill="hsl(${hue}, 55%, 45%)"/>\n  <text x="64" y="70" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="600" fill="#ffffff">${initial}</text>\n</svg>`;
}

// Normalize a packaged SVG for adaptive web/app use:
//  - drop fixed pixel/em dimensions (consumers size it; viewBox drives scaling)
//  - keep viewBox (required), xmlns (required), and currentColor paint untouched
function normalizePackagedSvg(svgText) {
  let svg = svgText.trim();
  if (!svg.startsWith('<svg')) throw new Error('not an SVG document');
  if (!/viewBox=/i.test(svg)) throw new Error('SVG has no viewBox (cannot scale safely)');
  svg = svg.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg;
}

async function findPackagedIcon(pkgDir, iconValue) {
  const wanted = iconValue.toLowerCase();
  const entries = await fs.readdir(pkgDir);
  const exact = entries.find((f) => f.toLowerCase() === wanted && /\.svg$/i.test(f));
  if (exact) return path.join(pkgDir, exact);
  const anySvg = entries.find((f) => /\.svg$/i.test(f));
  return anySvg ? path.join(pkgDir, anySvg) : null;
}

async function packagedPngSvg(pkgDir, iconValue, identifier) {
  const entries = await fs.readdir(pkgDir);
  const filename = entries.find((entry) => entry.toLowerCase() === iconValue.toLowerCase());
  if (!filename) throw new Error(`manifest icon '${iconValue}' does not exist in ${path.basename(pkgDir)}/`);
  const png = await fs.readFile(path.join(pkgDir, filename));
  const maskID = `icon-${identifier.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <mask id="${maskID}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32" style="mask-type:alpha">
      <image width="32" height="32" href="data:image/png;base64,${png.toString('base64')}"/>
    </mask>
  </defs>
  <rect width="32" height="32" fill="currentColor" mask="url(#${maskID})"/>
</svg>`;
}

async function fetchIconifySvg(iconifyId) {
  const [prefix, ...rest] = iconifyId.split(':');
  const name = rest.join(':');
  if (!prefix || !name) throw new Error(`bad Iconify id '${iconifyId}'`);
  const res = await fetch(`${ICONIFY_BASE}/${prefix}/${name}.svg`);
  if (!res.ok) throw new Error(`Iconify HTTP ${res.status} for ${iconifyId}`);
  const svg = await res.text();
  if (!svg.trim().startsWith('<svg')) throw new Error(`Iconify returned non-SVG for ${iconifyId}`);
  return svg;
}

async function main() {
  const map = await readJson(MAP_FILE).catch(() => ({}));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const pkgDirs = (await fs.readdir(RAW_DIR)).filter((d) => d.endsWith('.openclipext')).sort();

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
      manifest.identifier || `com.openclip.${pkg.replace(/\.openclipext$/, '').toLowerCase()}`;
    const displayName = manifest.name || identifier;
    const iconValue = manifest.action?.icon ?? manifest.actions?.[0]?.icon ?? 'puzzlepiece';

    try {
      let svgText;

      if (/\.svg$/i.test(iconValue)) {
        const found = await findPackagedIcon(pkgDir, iconValue);
        if (!found) {
          throw new Error(
            `manifest icon '${iconValue}' does not exist in ${pkg}/ — add the file or use an SF Symbol / mapped icon`);
        }
        svgText = normalizePackagedSvg(await fs.readFile(found, 'utf8'));
      } else if (/\.png$/i.test(iconValue)) {
        svgText = await packagedPngSvg(pkgDir, iconValue, identifier);
      } else if (iconValue.includes(':')) {
        // Manifest already carries an Iconify-style id.
        svgText = normalizePackagedSvg(await fetchIconifySvg(iconValue));
      } else {
        const iconifyId = map[iconValue];
        if (!iconifyId) {
          console.warn(`⚠ ${identifier}: SF Symbol '${iconValue}' not in icon-map.json; using letter tile`);
          svgText = letterTileSvg(identifier, displayName);
        } else {
          svgText = normalizePackagedSvg(await fetchIconifySvg(iconifyId));
        }
      }

      const out = path.join(OUT_DIR, `${identifier}.svg`);
      await fs.writeFile(out, svgText);
      built++;
      console.log(`✓ ${identifier}.svg`);
    } catch (err) {
      errors.push(err.message);
      console.error(`✗ ${identifier}: ${err.message}`);
    }
  }

  console.log(`\nGenerated ${built} adaptive SVG icon(s) → ${path.relative(ROOT, OUT_DIR)}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main();
