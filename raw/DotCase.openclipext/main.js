function words(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function action(selection) {
    if (!selection) return "";
    return words(selection).map(function(w) {
        return w.toLowerCase();
    }).join(".");
}
