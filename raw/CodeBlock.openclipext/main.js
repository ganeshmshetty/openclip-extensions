function action(selection) {
    if (!selection) return "";
    var fence = "```";
    while (selection.indexOf(fence) !== -1) {
        fence += "`";
    }
    return fence + "\n" + selection + "\n" + fence;
}
