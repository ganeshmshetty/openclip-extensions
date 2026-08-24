function action(selection) {
    if (!selection) return "";
    return selection.replace(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu, function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
}
