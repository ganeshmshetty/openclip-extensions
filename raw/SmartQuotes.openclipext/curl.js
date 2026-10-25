// Straight quotes -> curly (typographic) quotes.
// A quote opens after the start of text, whitespace, an opening bracket or a dash; otherwise it closes.
function action(selection) {
    if (!selection) return "";
    var opener = /[\s(\[{<\u2014\u2013\-\/\u201c\u2018]/;
    var out = "";
    for (var i = 0; i < selection.length; i++) {
        var ch = selection[i];
        var prev = i > 0 ? selection[i - 1] : "";
        var opens = prev === "" || opener.test(prev);
        if (ch === '"') {
            out += opens ? "\u201c" : "\u201d";
        } else if (ch === "'") {
            // Abbreviated years like '90s take an apostrophe, not an opening quote.
            if (opens && !/^\d\ds?\b/.test(selection.slice(i + 1))) {
                out += "\u2018";
            } else {
                out += "\u2019";
            }
        } else {
            out += ch;
        }
    }
    return out;
}

module.exports = action;
module.exports.action = action;
