// Month Translator — recognises a month name written in any language (Unicode CLDR data) in the
// selected text and shows its name in the target language inline in the OpenClip popup.
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

function parseLanguageList(value) {
    return String(value || "").split(/[\s,;]+/).map(languageOf).filter(Boolean);
}

function translate(text, settings) {
    settings = settings || {};
    var tokens = String(text || "").trim().split(/\s+/);
    if (tokens.length === 0 || tokens.length > MAX_TOKENS) return null;

    var restrict = parseLanguageList(settings.source);
    var preferred = parseLanguageList(settings.preferred);
    var months = [], preferredMonths = [], words = [];
    for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t].replace(TRIM, "");
        if (!token) continue;
        words.push(fold(token));
        var hits = lookup(token), tokenMonths = [], tokenPreferred = [];
        for (var h = 0; h < hits.length; h++) {
            var langs = DATA.entries[hits[h].e].l.map(languageOf);
            var allowed = restrict.length === 0 || langs.some(function (l) { return restrict.indexOf(l) >= 0; });
            if (!allowed) continue;
            if (tokenMonths.indexOf(hits[h].m) < 0) tokenMonths.push(hits[h].m);
            if (tokenPreferred.indexOf(hits[h].m) < 0 && langs.some(function (l) { return preferred.indexOf(l) >= 0; })) {
                tokenPreferred.push(hits[h].m);
            }
        }
        // Candidates of one token are listed in calendar order; tokens keep their text order.
        tokenMonths.sort(numeric).forEach(function (m) { if (months.indexOf(m) < 0) months.push(m); });
        tokenPreferred.sort(numeric).forEach(function (m) { if (preferredMonths.indexOf(m) < 0) preferredMonths.push(m); });
    }
    // A word that is a month in several languages (hr "listopad" = October, cs/pl = November)
    // resolves to the user's own language when that language is among the candidates.
    if (preferredMonths.length > 0) months = preferredMonths;
    if (months.length === 0 || months.length > MAX_MONTHS) return null;

    var target = entryFor(settings.target);
    if (target < 0) target = entryFor("en");
    var names = namesFor(target, months);
    // Translating a word into its own language is no help (cs app language, "listopad" selected):
    // show English instead, unless English is what was selected.
    var sameWord = names.every(function (name) { return words.indexOf(fold(name)) >= 0; });
    if (sameWord) {
        var english = entryFor("en");
        if (english !== target) names = namesFor(english, months);
    }
    return names.join(" / ");
}

function numeric(a, b) { return a - b; }

function namesFor(entryIndex, months) {
    var table = DATA.entries[entryIndex].w;
    return months.map(function (m) { return table[m]; });
}

function action(selection) {
    var host = typeof openclip !== "undefined" ? openclip : {};
    var option = function (id) { return host.options && host.options[id] ? String(host.options[id]) : ""; };
    return translate(selection, {
        target: option("target") || host.language || host.locale || "en",
        source: option("source"),
        preferred: [host.language, host.locale].filter(Boolean).join(",")
    });
}

module.exports = action;
module.exports.action = action;
module.exports.translate = translate;
module.exports.fold = fold;
module.exports.DATA = DATA;
