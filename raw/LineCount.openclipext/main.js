function action(selection) {
    var text = selection || "";
    if (!text.length) return null;
    var count = text.split(/\r?\n/).length;
    var unit = (typeof openclip !== "undefined" && openclip.i18n)
        ? openclip.i18n({
            en: count === 1 ? "line" : "lines",
            "zh-Hans": "行",
            "zh-Hant": "行",
            ja: "行",
            fr: count === 1 ? "ligne" : "lignes"
        })
        : (count === 1 ? "line" : "lines");
    return count + " " + unit;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
