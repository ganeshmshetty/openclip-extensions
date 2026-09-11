function action(selection, options) {
    var text = (selection || "").trim();
    if (!text) return null;
    var words = text.split(/\s+/).length;
    return words + (words === 1 ? " word" : " words");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
