function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    var seen = Object.create(null);
    var unique = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!seen[line]) {
            seen[line] = true;
            unique.push(line);
        }
    }
    return unique.join("\n");
}
