// Behaviour tests for the built bundle: `npm test` (runs under Node against dist/main.js).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ext = require("../dist/main.js");

// Czech <-> English pair (A = cs, B = en): Czech shows English, English shows Czech, others show Czech.
const cs = (text) => ext.translate(text, { languageA: "cs", languageB: "en" });
// English-only user (A = en, B = en): everything shows English.
const en = (text) => ext.translate(text, { languageA: "en", languageB: "en" });
const pair = (text, a, b) => ext.translate(text, { languageA: a, languageB: b });

const cases = [
    // A -> B: Czech nominative, genitive, locative with preposition, adjectives, dates, casing, no diacritics
    [cs("srpen"), "August"], [cs("srpna"), "August"], [cs("v srpnu"), "August"], [cs("ve srpnu"), "August"],
    [cs("srpnový"), "August"], [cs("srpnová"), "August"], [cs("SRPEN"), "August"], [cs("Srpen,"), "August"],
    [cs("5. srpna 2024"), "August"], [cs("„srpna“"), "August"],
    [cs("leden"), "January"], [cs("ledna"), "January"], [cs("v lednu"), "January"], [cs("lednový"), "January"], [cs("lednem"), "January"],
    [cs("únor"), "February"], [cs("unora"), "February"], [cs("únorový"), "February"],
    [cs("březen"), "March"], [cs("brezen"), "March"], [cs("březnový"), "March"], [cs("v breznu"), "March"],
    [cs("dubna"), "April"], [cs("května"), "May"], [cs("cerven"), "June"], [cs("července"), "July"], [cs("červencový"), "July"],
    [cs("září"), "September"], [cs("zari"), "September"], [cs("zářijový"), "September"],
    [cs("v říjnu"), "October"], [cs("říjnový"), "October"], [cs("prosinec"), "December"], [cs("v prosinci"), "December"], [cs("prosincový"), "December"],
    [cs("led."), "January"], [cs("pro."), "December"], [cs("čvc"), "July"],
    // B -> A: English shows Czech
    [cs("August"), "srpen"], [cs("in August"), "srpen"], [cs("Aug"), "srpen"], [cs("JANUARY"), "leden"], [cs("Sept."), "září"],
    // Other languages -> A (Czech)
    [cs("august"), "srpen"], [cs("v auguste"), "srpen"], [cs("augustový"), "srpen"], [cs("január"), "leden"], [cs("v januári"), "leden"],
    [cs("sierpień"), "srpen"], [cs("w sierpniu"), "srpen"], [cs("sierpniowy"), "srpen"], [cs("stycznia"), "leden"],
    [cs("październik"), "říjen"], [cs("pazdziernik"), "říjen"], [cs("w październiku"), "říjen"],
    [cs("август"), "srpen"], [cs("в августе"), "srpen"], [cs("августовский"), "srpen"], [cs("сентябрьский"), "září"], [cs("січневий"), "leden"],
    [cs("kolovoz"), "srpen"], [cs("u kolovozu"), "srpen"], [cs("Jänner"), "leden"], [cs("im August"), "srpen"], [cs("août"), "srpen"],
    [cs("en agosto"), "srpen"], [cs("tammikuussa"), "leden"], [cs("8月"), "srpen"], [cs("八月"), "srpen"],
    // A configured language wins over other readings of the same word
    [cs("listopad"), "November"], [pair("listopad", "hr", "en"), "October"], [pair("listopad", "en", "cs"), "November"],
    [en("listopad"), "October / November"],
    // Other pairs, both directions
    [pair("srpen", "en", "cs"), "August"], [pair("August", "en", "cs"), "srpen"],
    [pair("leden", "cs", "de-AT"), "Jänner"], [pair("Jänner", "cs", "de_AT"), "leden"], [pair("leden", "cs", "de"), "Januar"],
    [pair("srpen", "cs", "zh-Hans"), "八月"], [pair("八月", "cs", "zh-Hans"), "srpen"], [pair("srpen", "cs", "ja"), "8月"],
    [pair("srpen", "cs", "pt-BR"), "agosto"], [pair("agosto", "cs", "pt-BR"), "srpen"],
    [pair("August", "de", "en"), "August"], [pair("srpen", "xx-nonsense", "yy-nonsense"), "August"],
    // English-only user
    [en("srpen"), "August"], [en("August"), "August"], [en("w sierpniu"), "August"],
    // Ranges and mixed directions
    [cs("srpen únor"), "August / February"], [cs("srpen August"), "August / srpen"], [cs("leden–únor"), null],
    // Non-months and near misses
    [cs("hello"), null], [cs("ledový"), null], [cs("březový"), null], [cs("květový"), null], [cs("dubová"), null],
    [cs("the quick brown fox jumps"), null], [cs(""), null], [cs("   "), null], [cs(null), null], [cs("1 2 3 4"), null],
    [cs("ledna2"), null], [cs("srpnovýchch"), null],
];

let failed = 0;
cases.forEach(([got, want], i) => {
    if (got !== want) {
        failed++;
        console.log(`FAIL #${i}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
});
console.log(`${cases.length - failed}/${cases.length} cases passed`);
if (failed) process.exit(1);
