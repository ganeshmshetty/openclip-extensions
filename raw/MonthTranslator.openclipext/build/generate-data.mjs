// Generates src/months-data.json from Unicode CLDR (cldr-dates-full): for every locale, the
// Gregorian month names in stand-alone (nominative) and format (genitive) context, wide and
// abbreviated. Locales with identical month tables are collapsed into one entry listing all tags.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("cldr-dates-full/package.json"));
const main = join(root, "main");
const version = require("cldr-dates-full/package.json").version;

const byKey = new Map();
for (const tag of readdirSync(main).sort()) {
    let months;
    try {
        const json = JSON.parse(readFileSync(join(main, tag, "ca-gregorian.json"), "utf8"));
        months = json.main[tag].dates.calendars.gregorian.months;
    } catch {
        continue;
    }
    const list = (ctx, width) => Array.from({ length: 12 }, (_, i) => months[ctx][width][String(i + 1)]);
    const w = list("stand-alone", "wide");
    const f = list("format", "wide");
    const a = list("stand-alone", "abbreviated");
    const fa = list("format", "abbreviated");
    // Skip locales that only carry CLDR placeholders (M01 … M12).
    if (w.every((m) => /^M\d\d$/.test(m))) continue;
    const entry = { w };
    if (JSON.stringify(f) !== JSON.stringify(w)) entry.f = f;
    // Abbreviations: stand-alone first, then format ones that differ, both aligned to 12 slots.
    entry.a = a;
    if (JSON.stringify(fa) !== JSON.stringify(a)) entry.fa = fa;
    if (JSON.stringify(entry.a) === JSON.stringify(w)) delete entry.a;
    const key = JSON.stringify(entry);
    if (!byKey.has(key)) byKey.set(key, { l: [], ...entry });
    byKey.get(key).l.push(tag);
}

const entries = [...byKey.values()];
const out = { cldr: version, entries };
const target = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "months-data.json");
writeFileSync(target, JSON.stringify(out));
console.log(`CLDR ${version}: ${entries.length} distinct month tables from ${entries.reduce((n, e) => n + e.l.length, 0)} locales -> ${target}`);
