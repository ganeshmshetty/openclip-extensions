function action(selection) {
    var text = (selection || "")
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0085\u000b\u000c\u2028]/g, "\n")
        .trim();
    if (!text) return null;
    var count = text.split(/\n\s*\n+|\u2029+/).filter(Boolean).length;
    var unit = (typeof openclip !== "undefined" && openclip.i18n)
        ? openclip.i18n({
            en: count === 1 ? "paragraph" : "paragraphs",
            "zh-Hans": "个段落",
            "zh-Hant": "個段落",
            ja: "段落",
            fr: count === 1 ? "paragraphe" : "paragraphes"
        })
        : (count === 1 ? "paragraph" : "paragraphs");
    return count + " " + unit;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = action;
    module.exports.action = action;
}
