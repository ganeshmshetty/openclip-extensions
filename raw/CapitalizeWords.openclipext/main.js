function action(selection) {
    if (!selection) return "";
    return selection.replace(/[A-Za-z0-9]+/g, function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}
