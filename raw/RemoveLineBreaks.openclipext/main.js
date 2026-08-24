function action(selection) {
    if (!selection) return "";
    return selection
        .split(/\r\n|\r|\n/)
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return line.length > 0; })
        .join(" ");
}
