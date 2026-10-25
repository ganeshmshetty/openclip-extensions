function action(selection) {
    if (!selection) return "";
    var mode = (openclip.options && openclip.options.mode) ||
               (openclip.option ? openclip.option('mode') : '') || "Both";
    var trim = function(line) { return line.trim(); };
    if (mode === "Start only") trim = function(line) { return line.replace(/^\s+/, ""); };
    if (mode === "End only") trim = function(line) { return line.replace(/\s+$/, ""); };
    return selection.split(/\r?\n/).map(trim).join("\n");
}

module.exports = action;
module.exports.action = action;
