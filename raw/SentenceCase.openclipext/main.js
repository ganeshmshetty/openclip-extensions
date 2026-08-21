function action(selection) {
    if (!selection) return "";
    var lower = selection.toLowerCase();
    return lower.replace(/(^\s*["'“‘«‹„(\[{<]*|[.!?\n]\s*["'“‘«‹„(\[{<]*)([a-z])/g, function(match, prefix, char) {
        return prefix + char.toUpperCase();
    });
}
