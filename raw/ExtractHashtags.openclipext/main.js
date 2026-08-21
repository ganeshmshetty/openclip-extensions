function action(selection) {
    if (!selection) return "";
    var hashtagRegex = /(?:^|[^a-zA-Z0-9_\u00C0-\u024F])(#[a-zA-Z0-9_\u00C0-\u024F]+)/g;
    var matches = [];
    var match;
    while ((match = hashtagRegex.exec(selection)) !== null) {
        matches.push(match[1]);
    }
    var seen = Object.create(null);
    var unique = matches.filter(function(tag) {
        return !seen[tag] && (seen[tag] = true);
    });
    return unique.join("\n");
}
