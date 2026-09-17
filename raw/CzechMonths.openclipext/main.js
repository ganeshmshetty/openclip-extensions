// Czech Months — shows the English name of a selected Czech month inline in the OpenClip popup.
//
// Recognises every singular case form of the twelve Czech month names (leden / ledna / lednu /
// lednem, červenec / července / …) plus the standard three-letter abbreviations when written
// with their trailing period (led., úno., …). Matching ignores casing, diacritics and
// surrounding punctuation, so "Ledna", "UNORA", "„září“" and "bre." all resolve.
//
// The manifest's requirements.regex (the popup visibility gate) is generated from the same table
// by manifestRegex() below. After editing MONTHS or SUFFIXES, regenerate it with:
//   jsc -e 'var module={exports:{}};load("main.js");print(module.exports.manifestRegex())'

// [english, nominative, stem, declension, abbreviation]
var MONTHS = [
    ["January",   "leden",    "ledn",     "hard", "led"],
    ["February",  "únor",     "únor",     "hard", "úno"],
    ["March",     "březen",   "březn",    "hard", "bře"],
    ["April",     "duben",    "dubn",     "hard", "dub"],
    ["May",       "květen",   "květn",    "hard", "kvě"],
    ["June",      "červen",   "červn",    "hard", "čvn"],
    ["July",      "červenec", "červenc",  "soft", "čvc"],
    ["August",    "srpen",    "srpn",     "hard", "srp"],
    ["September", "září",     "září",     "none", "zář"],
    ["October",   "říjen",    "říjn",     "hard", "říj"],
    ["November",  "listopad", "listopad", "hard", "lis"],
    ["December",  "prosinec", "prosinc",  "soft", "pro"]
];

// Singular case endings appended to the stem (genitive, dative/locative, vocative, instrumental).
var SUFFIXES = { hard: ["a", "u", "e", "em"], soft: ["e", "i", "em"], none: [] };

// Lower-cases and strips diacritics: "Února" -> "unora".
function fold(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// All full word forms of one month entry (with diacritics).
function fullForms(m) {
    var forms = [m[1]];
    var suffixes = SUFFIXES[m[3]];
    for (var i = 0; i < suffixes.length; i++) forms.push(m[2] + suffixes[i]);
    return forms;
}

var FULL = {};
var ABBR = {};
for (var i = 0; i < MONTHS.length; i++) {
    var forms = fullForms(MONTHS[i]);
    for (var j = 0; j < forms.length; j++) FULL[fold(forms[j])] = MONTHS[i][0];
    ABBR[fold(MONTHS[i][4])] = MONTHS[i][0];
}

// One word, optionally wrapped in quotes/brackets/punctuation. Group 1 = the word,
// group 2 = a period directly after it (required for abbreviations).
var WORD = /^[\s"'«»„“”‚‘’(\[]*([^\s"'«»„“”‚‘’()\[\],.;:!?]+)(\.?)[\s"'«»„“”‚‘’()\[\],.;:!?]*$/;

function translate(text) {
    var match = WORD.exec(text || "");
    if (!match) return null;
    var word = fold(match[1]);
    if (Object.prototype.hasOwnProperty.call(FULL, word)) return FULL[word];
    if (match[2] && Object.prototype.hasOwnProperty.call(ABBR, word)) return ABBR[word];
    return null;
}

// Builds the ICU regex used as the manifest visibility gate: the same word forms as above, with
// every base letter also accepting its Czech accented variants (mirrors fold()).
var CLASSES = { a: "[aá]", c: "[cč]", d: "[dď]", e: "[eéě]", i: "[ií]", n: "[nň]", o: "[oó]", r: "[rř]", s: "[sš]", t: "[tť]", u: "[uúů]", y: "[yý]", z: "[zž]" };
var LEAD = "[\\s\"'«»„“”‚‘’(\\[]*";
var TRAIL = "[\\s\"'«»„“”‚‘’()\\[\\],.;:!?]*";

function manifestRegex() {
    function loosen(w) {
        return fold(w).split("").map(function (c) { return CLASSES[c] || c; }).join("");
    }
    var full = [], abbr = [];
    for (var i = 0; i < MONTHS.length; i++) {
        var forms = fullForms(MONTHS[i]);
        for (var j = 0; j < forms.length; j++) full.push(loosen(forms[j]));
        abbr.push(loosen(MONTHS[i][4]));
    }
    return "^" + LEAD + "(?:" + full.join("|") + "|(?:" + abbr.join("|") + ")\\.)" + TRAIL + "$";
}

function action(selection) {
    return translate(selection);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
    module.exports.translate = translate;
    module.exports.MONTHS = MONTHS;
    module.exports.fullForms = fullForms;
    module.exports.manifestRegex = manifestRegex;
}
