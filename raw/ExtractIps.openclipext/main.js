function action(selection) {
    if (!selection) return "";
    var ipRegex = /(?<![\d.])(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?![\d.])/g;
    var matches = selection.match(ipRegex) || [];
    var seen = Object.create(null);
    var unique = matches.filter(function(ip) {
        return !seen[ip] && (seen[ip] = true);
    });
    return unique.join("\n");
}
