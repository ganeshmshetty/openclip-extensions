function action(selection) {
    if (!selection) return "";
    return selection.replace(/\s+/g, "");
}
