function action(selection) {
    if (!selection) return "";
    var urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi;
    var matches = selection.match(urlRegex) || [];
    var cleaned = matches.map(function(u) {
        u = u.replace(/[.,;:!?]+$/, "");
        while (/\)$/.test(u) &&
               (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) {
            u = u.slice(0, -1);
        }
        return u;
    });
    var seen = Object.create(null);
    var unique = cleaned.filter(function(u) {
        return !seen[u] && (seen[u] = true);
    });
    return unique.join("\n");
}
