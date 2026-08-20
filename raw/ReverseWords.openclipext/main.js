function action(selection) {
    if (!selection) return "";
    var trimmed = selection.trim();
    if (!trimmed) return "";
    var words = trimmed.split(/\s+/);
    return words.reverse().join(" ");
}
