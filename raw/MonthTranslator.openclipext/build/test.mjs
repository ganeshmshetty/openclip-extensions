// Behaviour tests for the built bundle: `npm test` (runs under Node against dist/main.js).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ext = require("../dist/main.js");

const en = (text, extra) => ext.translate(text, { target: "en", preferred: "en", ...extra });

const cases = [
    // Czech: nominative, genitive, locative with preposition, adjectives, dates, casing, no diacritics
    [en("srpen"), "August"], [en("srpna"), "August"], [en("v srpnu"), "August"], [en("ve srpnu"), "August"],
    [en("srpnový"), "August"], [en("srpnová"), "August"], [en("SRPEN"), "August"], [en("Srpen,"), "August"],
    [en("5. srpna 2024"), "August"], [en("„srpna“"), "August"],
    [en("leden"), "January"], [en("ledna"), "January"], [en("v lednu"), "January"], [en("lednový"), "January"], [en("lednem"), "January"],
    [en("únor"), "February"], [en("unora"), "February"], [en("únorový"), "February"],
    [en("březen"), "March"], [en("brezen"), "March"], [en("březnový"), "March"], [en("v breznu"), "March"],
    [en("dubna"), "April"], [en("května"), "May"], [en("cerven"), "June"], [en("července"), "July"], [en("červencový"), "July"],
    [en("září"), "September"], [en("zari"), "September"], [en("zářijový"), "September"],
    [en("v říjnu"), "October"], [en("říjnový"), "October"], [en("prosinec"), "December"], [en("v prosinci"), "December"], [en("prosincový"), "December"],
    [en("led."), "January"], [en("pro."), "December"], [en("čvc"), "July"],
    // Slovak
    [en("august"), "August"], [en("v auguste"), "August"], [en("augustový"), "August"],
    [en("január"), "January"], [en("januára"), "January"], [en("v januári"), "January"], [en("januárový"), "January"],
    // Polish
    [en("sierpień"), "August"], [en("w sierpniu"), "August"], [en("sierpniowy"), "August"], [en("stycznia"), "January"],
    [en("październik"), "October"], [en("pazdziernik"), "October"], [en("w październiku"), "October"],
    // Russian and Ukrainian
    [en("август"), "August"], [en("в августе"), "August"], [en("августовский"), "August"],
    [en("Сентябрь"), "September"], [en("сентябрьский"), "September"], [en("січень"), "January"], [en("січня"), "January"], [en("січневий"), "January"],
    // Croatian
    [en("kolovoz"), "August"], [en("u kolovozu"), "August"], [en("siječnja"), "January"],
    // German, French, Spanish, Finnish, Japanese, Chinese
    [en("August"), "August"], [en("im August"), "August"], [en("Jänner"), "January"], [en("März"), "March"], [en("Dez."), "December"],
    [en("août"), "August"], [en("aout"), "August"], [en("en août"), "August"], [en("janv."), "January"],
    [en("agosto"), "August"], [en("en agosto"), "August"], [en("ago."), "August"],
    [en("tammikuu"), "January"], [en("tammikuussa"), "January"], [en("tammikuuta"), "January"],
    [en("8月"), "August"], [en("八月"), "August"],
    // Ambiguity across languages resolves to the user's own language when possible
    [en("listopad", { preferred: "cs" }), "November"], [en("listopad", { preferred: "hr" }), "October"],
    [en("listopad", { preferred: "en" }), "October / November"],
    [en("listopad", { source: "pl" }), "November"], [en("listopad", { source: "hr, sl" }), "October"],
    // Target language selection
    [ext.translate("srpen", { target: "cs" }), "August"], [ext.translate("srpen", { target: "de" }), "August"],
    [ext.translate("leden", { target: "de-AT" }), "Jänner"], [ext.translate("leden", { target: "de_AT" }), "Jänner"],
    [ext.translate("srpen", { target: "zh-Hans" }), "八月"], [ext.translate("srpen", { target: "pt-BR" }), "agosto"],
    [ext.translate("srpen", { target: "ja" }), "8月"], [ext.translate("srpen", { target: "xx-nonsense" }), "August"],
    [ext.translate("srpen", {}), "August"],
    // Same-language selection falls back to English; English selection stays English
    [ext.translate("listopad", { target: "cs", preferred: "cs" }), "November"],
    [ext.translate("v srpnu", { target: "cs", preferred: "cs" }), "srpen"],
    [ext.translate("sierpień", { target: "cs", preferred: "cs" }), "srpen"],
    [ext.translate("August", { target: "en", preferred: "en" }), "August"],
    [ext.translate("August", { target: "de", preferred: "de" }), "August"],
    // Ranges
    [en("srpen únor"), "August / February"], [en("leden–únor"), null],
    // Non-months and near misses
    [en("hello"), null], [en("ledový"), null], [en("březový"), null], [en("květový"), null], [en("dubová"), null],
    [en("the quick brown fox jumps"), null], [en(""), null], [en("   "), null], [en(null), null], [en("1 2 3 4"), null],
    [en("ledna2"), null], [en("srpnovýchch"), null],
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
