function action(selection) {
    if (!selection) return "";
    return selection.replace(/\r?\n|\r/g, " ").replace(/[ \t]+/g, " ").trim();
}
