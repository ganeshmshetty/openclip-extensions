function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    if (/\r?\n$/.test(selection)) {
        lines.pop();
    }
    return lines.map(function(line) {
        return line ? "# " + line : line;
    }).join("\n");
}
