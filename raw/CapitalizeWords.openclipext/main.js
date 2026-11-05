function action(selection) {
    if (!selection) return "";
    var words = selection.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
    // A fully uppercase sentence is a casing transform, not a list of acronyms.
    var isAllCapsSentence = words.length > 1 && words.every(function(word) {
        var letters = word.replace(/[^\p{L}]/gu, "");
        return letters === letters.toUpperCase();
    });
    return selection.replace(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu, function(word) {
        if (isAllCapsSentence) {
            var lower = word.toLowerCase();
            return lower.replace(/\p{L}/u, function(ch) { return ch.toUpperCase(); });
        }
        // Keep acronyms (all-uppercase, 2+ letters) unchanged, e.g. NASA, URL.
        var letters = word.replace(/[^\p{L}]/gu, "");
        if (letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}
