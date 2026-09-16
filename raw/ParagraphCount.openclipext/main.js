function action(selection) {
    var text = (selection || "")
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0085\u000b\u000c\u2028]/g, "\n")
        .trim();
    if (!text) return null;
    var paragraphs = text.split(/\n\s*\n+|\u2029+/).filter(Boolean).length;
    return paragraphs + (paragraphs === 1 ? " paragraph" : " paragraphs");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
