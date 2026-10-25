// Strips email-style quote markers ("> ", ">>", "> > ") from the start of every line.
function action(selection) {
    if (!selection) return "";
    return selection
        .split(/\r\n|\r|\n/)
        .map(function(line) { return line.replace(/^[ \t]*(?:>[ \t]?)+/, ""); })
        .join("\n");
}

module.exports = action;
module.exports.action = action;
