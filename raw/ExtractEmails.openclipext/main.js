function action(selection) {
    if (!selection) return "";
    var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    var matches = selection.match(emailRegex) || [];
    var seen = Object.create(null);
    var unique = matches.filter(function(e) {
        var lower = e.toLowerCase();
        return !seen[lower] && (seen[lower] = true);
    });
    return unique.join("\n");
}
