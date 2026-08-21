function action(selection) {
    if (!selection) return "";
    var d = "`";
    while (selection.indexOf(d) !== -1) {
        d += "`";
    }
    var pad = (selection.startsWith("`") || selection.endsWith("`")) ? " " : "";
    return d + pad + selection + pad + d;
}
