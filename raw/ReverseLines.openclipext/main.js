function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    return lines.reverse().join("\n");
}
