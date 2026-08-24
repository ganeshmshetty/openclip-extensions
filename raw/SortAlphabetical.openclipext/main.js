function action(selection) {
    if (!selection) return "";
    var lines = selection.match(/[^\r\n]+/g) || [];
    lines.sort(function(a, b) {
        return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
    });
    return lines.join("\n");
}
