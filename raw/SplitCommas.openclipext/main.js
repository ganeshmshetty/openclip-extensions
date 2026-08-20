function action(selection) {
    if (!selection) return "";
    return selection
        .split(",")
        .map(function(item) { return item.trim(); })
        .filter(function(item) { return item.length > 0; })
        .join("\n");
}
