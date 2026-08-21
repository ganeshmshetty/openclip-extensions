function words(str) {
    var text = str
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    try {
        text = text.replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), " ");
    } catch (e) {
        if (/^[\x00-\x7F]*$/.test(text)) {
            text = text.replace(/[^a-zA-Z0-9]+/g, " ");
        }
    }
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function action(selection) {
    if (!selection) return "";
    return words(selection).map(function(w) {
        return w.toUpperCase();
    }).join("_");
}
