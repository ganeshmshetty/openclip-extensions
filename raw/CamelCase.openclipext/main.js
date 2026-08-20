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
    var list = words(selection);
    if (list.length === 0) return "";
    return list.map(function(word, i) {
        var lower = word.toLowerCase();
        return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join("");
}
