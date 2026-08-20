function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    for (var i = lines.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = lines[i];
        lines[i] = lines[j];
        lines[j] = temp;
    }
    return lines.join("\n");
}
