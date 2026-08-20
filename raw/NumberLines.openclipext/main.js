function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    return lines.map(function(line, idx) {
        return (idx + 1) + ". " + line;
    }).join("\n");
}
