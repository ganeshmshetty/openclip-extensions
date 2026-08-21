function action(selection) {
    if (!selection) return "";
    var trailing = "";
    var content = selection;
    var match = selection.match(/(\r\n|\r|\n)$/);
    if (match) {
        trailing = match[1];
        content = selection.slice(0, -trailing.length);
    }
    var lines = content.split(/\r?\n/);
    return lines.reverse().join("\n") + trailing;
}
