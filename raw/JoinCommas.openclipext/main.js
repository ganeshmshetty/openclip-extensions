function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    return lines
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return line.length > 0; })
        .join(", ");
}
