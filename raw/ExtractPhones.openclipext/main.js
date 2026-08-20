function action(selection) {
    if (!selection) return "";
    var phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{1,4})?/g;
    var matches = selection.match(phoneRegex) || [];
    var seen = Object.create(null);
    var filtered = matches.map(function(p) { return p.trim(); }).filter(function(p) {
        var digits = p.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15 && !seen[p] && (seen[p] = true);
    });
    return filtered.join("\n");
}
