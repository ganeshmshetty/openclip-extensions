function action(selection) {
    var text = selection || "";
    if (!text.length) return null;
    var count = typeof Intl !== "undefined" && Intl.Segmenter
        ? Array.from(new Intl.Segmenter().segment(text)).length
        : Array.from(text).length;
    return count + (count === 1 ? " char" : " chars");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
