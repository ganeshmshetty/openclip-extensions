function action(selection) {
    var text = selection || "";
    if (!text.length) return null;
    var lines = text.split(/\r?\n/).length;
    return lines + (lines === 1 ? " line" : " lines");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
