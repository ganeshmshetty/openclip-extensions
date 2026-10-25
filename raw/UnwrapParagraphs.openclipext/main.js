// Joins hard-wrapped lines into one line per paragraph.
// Blank lines separate paragraphs; list items (-, *, +, •, 1., 1)) start a new line.
function action(selection) {
    if (!selection) return "";
    var listItem = /^\s*(?:[-*+\u2022\u25e6\u2023]|\d+[.)])\s+/;
    var paragraphs = [];
    var lines = [];
    function flush() {
        if (lines.length) paragraphs.push(lines.join("\n"));
        lines = [];
    }
    selection.split(/\r\n|\r|\n/).forEach(function(raw) {
        var line = raw.replace(/\s+$/, "");
        if (line.trim() === "") {
            flush();
        } else if (lines.length === 0 || listItem.test(line)) {
            lines.push(lines.length === 0 && !listItem.test(line) ? line.trim() : line.replace(/^\s+/, ""));
        } else {
            lines[lines.length - 1] += " " + line.trim();
        }
    });
    flush();
    return paragraphs.join("\n\n");
}

module.exports = action;
module.exports.action = action;
