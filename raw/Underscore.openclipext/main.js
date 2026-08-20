function action(selection) {
    if (!selection) return "";
    return selection.trim().replace(/\s+/g, "_");
}
