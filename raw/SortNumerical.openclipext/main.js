function action(selection) {
    if (!selection) return "";
    var lines = selection.split(/\r?\n/);
    lines.sort(function(a, b) {
        var numA = parseFloat((a.match(/-?\d+(?:\.\d+)?/) || [])[0]);
        var numB = parseFloat((b.match(/-?\d+(?:\.\d+)?/) || [])[0]);
        var hasA = !isNaN(numA);
        var hasB = !isNaN(numB);
        if (hasA && hasB) return numA - numB;
        if (hasA) return -1;
        if (hasB) return 1;
        return a.localeCompare(b);
    });
    return lines.join("\n");
}
