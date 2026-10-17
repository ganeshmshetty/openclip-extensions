// Month Translator — recognises a month name written in any language (Unicode CLDR data) in the
// selected text and shows it inline in the OpenClip popup, translating both ways between two
// configured languages: a month in language A is shown in B, a month in B is shown in A, and a
// month from any other language is shown in A.
//
// Matching ignores casing, diacritics and surrounding punctuation, and understands inflected
// forms: CLDR provides the nominative ("srpen") and genitive ("srpna") of every month, and stems
// derived from those cover the other cases and adjectives ("v srpnu", "srpnový", "w sierpniu",
// "августовский"). Build with `npm run build`; the data file is generated from cldr-dates-full.

var DATA = require("./months-data.json");

var MAX_TOKENS = 4;
var MAX_MONTHS = 3;
var MAX_SUFFIX = 6;
var MIN_COMMON_STEM = 5;
var MIN_GENITIVE_STEM = 4;

var SPECIAL = { "ł": "l", "đ": "d", "ø": "o", "ß": "ss", "æ": "ae", "œ": "oe", "ı": "i", "ħ": "h", "ŧ": "t", "ð": "d", "þ": "th" };

// Lower-cases, strips diacritics and periods: "Srpna." -> "srpna", "Août" -> "aout".
function fold(s) {
    return s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[łđøßæœıħŧðþ]/g, function (c) { return SPECIAL[c]; })
        .replace(/\./g, "");
}

function commonPrefix(a, b) {
    var n = 0;
    while (n < a.length && n < b.length && a.charAt(n) === b.charAt(n)) n++;
    return a.slice(0, n);
}

var index = null;

function add(map, key, hit) {
    if (!key) return;
    var list = map[key] || (map[key] = []);
    for (var i = 0; i < list.length; i++) {
        if (list[i].e === hit.e && list[i].m === hit.m) return;
    }
    list.push(hit);
}

// Builds the lookup tables once per script run: exact forms and inflection stems.
function buildIndex() {
    var exact = {}, stems = {};
    var entries = DATA.entries;
    for (var e = 0; e < entries.length; e++) {
        var entry = entries[e];
        for (var m = 0; m < 12; m++) {
            var hit = { e: e, m: m };
            var w = fold(entry.w[m]);
            add(exact, w, hit);
            if (entry.f) {
                // Inflecting language (nominative and genitive differ somewhere in the table):
                // derive stems that cover the remaining cases and adjectives.
                var f = fold(entry.f[m]);
                add(exact, f, hit);
                if (f !== w) {
                    var cp = commonPrefix(w, f);
                    if (cp.length >= MIN_COMMON_STEM) add(stems, cp, hit);
                    if (f.length - 1 >= MIN_GENITIVE_STEM) add(stems, f.slice(0, -1), hit);
                } else if (w.length >= MIN_GENITIVE_STEM) {
                    // Indeclinable month in an inflecting language (cs "září"): the word itself is
                    // the stem, so derived forms such as "zářijový" still resolve.
                    add(stems, w, hit);
                }
            }
            if (entry.a) add(exact, fold(entry.a[m]), hit);
            if (entry.fa) add(exact, fold(entry.fa[m]), hit);
        }
    }
    return { exact: exact, stems: stems };
}

var LETTERS = /^[\p{L}\p{M}]+$/u;
var TRIM = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}.]+$/gu;

// Every (entry, month) hit for one token: exact form first, then stem + short suffix.
function lookup(token) {
    var idx = index || (index = buildIndex());
    var word = fold(token);
    if (!word) return [];
    if (idx.exact[word]) return idx.exact[word];
    var minLen = Math.max(MIN_GENITIVE_STEM, word.length - MAX_SUFFIX);
    for (var len = word.length - 1; len >= minLen; len--) {
        var hits = idx.stems[word.slice(0, len)];
        if (hits && LETTERS.test(word.slice(len))) return hits;
    }
    return [];
}

function languageOf(tag) {
    return String(tag || "").replace(/_/g, "-").split("-")[0].toLowerCase();
}

// Index of the data entry whose locale list best matches a BCP-47 tag ("cs", "pt-BR", "zh-Hans").
function entryFor(tag) {
    var wanted = String(tag || "").replace(/_/g, "-").toLowerCase();
    if (!wanted) return -1;
    var entries = DATA.entries, lang = languageOf(wanted);
    var langHit = -1, prefixHit = -1;
    for (var e = 0; e < entries.length; e++) {
        for (var i = 0; i < entries[e].l.length; i++) {
            var tagged = entries[e].l[i].toLowerCase();
            if (tagged === wanted) return e;
            if (tagged === lang && langHit < 0) langHit = e;
            if (prefixHit < 0 && tagged.indexOf(lang + "-") === 0) prefixHit = e;
        }
    }
    return langHit >= 0 ? langHit : prefixHit;
}

function pushUnique(list, value) {
    if (list.indexOf(value) < 0) list.push(value);
}

function numeric(a, b) { return a - b; }

// Bi-directional translation between two configured languages A and B:
//   month written in A  -> shown in B
//   month written in B  -> shown in A
//   month in any other language -> shown in A
function translate(text, settings) {
    settings = settings || {};
    var tokens = String(text || "").trim().split(/\s+/);
    if (tokens.length === 0 || tokens.length > MAX_TOKENS) return null;

    var entryA = entryFor(settings.languageA);
    if (entryA < 0) entryA = entryFor("en");
    var entryB = entryFor(settings.languageB);
    if (entryB < 0) entryB = entryFor("en");
    var langA = languageOf(DATA.entries[entryA].l[0]);
    var langB = languageOf(DATA.entries[entryB].l[0]);

    var toB = [], toA = [], other = [];
    for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t].replace(TRIM, "");
        if (!token) continue;
        var hits = lookup(token), inA = [], inB = [], elsewhere = [];
        for (var h = 0; h < hits.length; h++) {
            var langs = DATA.entries[hits[h].e].l.map(languageOf);
            if (langs.indexOf(langA) >= 0) pushUnique(inA, hits[h].m);
            if (langs.indexOf(langB) >= 0) pushUnique(inB, hits[h].m);
            if (langs.indexOf(langA) < 0 && langs.indexOf(langB) < 0) pushUnique(elsewhere, hits[h].m);
        }
        // A token that is a month in a configured language ignores readings from other languages
        // (hr "listopad" = October is dropped when Czech is configured and says November).
        // Candidates of one token are listed in calendar order; tokens keep their text order.
        inA.sort(numeric).forEach(function (m) { pushUnique(toB, m); });
        inB.sort(numeric).forEach(function (m) { pushUnique(toA, m); });
        if (inA.length === 0 && inB.length === 0) elsewhere.sort(numeric).forEach(function (m) { pushUnique(other, m); });
    }

    var names = [];
    toB.forEach(function (m) { pushUnique(names, DATA.entries[entryB].w[m]); });
    toA.forEach(function (m) { pushUnique(names, DATA.entries[entryA].w[m]); });
    if (toB.length === 0 && toA.length === 0) {
        other.forEach(function (m) { pushUnique(names, DATA.entries[entryA].w[m]); });
    }
    if (names.length === 0 || names.length > MAX_MONTHS) return null;
    return names.join(" / ");
}

function action(selection) {
    var host = typeof openclip !== "undefined" ? openclip : {};
    var option = function (id) { return host.options && host.options[id] ? String(host.options[id]) : ""; };
    return translate(selection, {
        languageA: option("languageA") || host.language || host.locale || "en",
        languageB: option("languageB") || "en"
    });
}

module.exports = action;
module.exports.action = action;
module.exports.translate = translate;
module.exports.fold = fold;
module.exports.DATA = DATA;
