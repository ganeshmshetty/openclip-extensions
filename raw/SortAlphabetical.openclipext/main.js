function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    lines.sort(function(a, b) {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    return lines.join("\n");
}
