function action(selection) {
    if (!selection) return "";
    var hashtagRegex = /(#[\p{L}\p{N}_]+)/gu;
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
