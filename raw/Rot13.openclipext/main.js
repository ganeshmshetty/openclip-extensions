function action(selection) {
    if (!selection) return "";
    return selection.replace(/[a-zA-Z]/g, function(c) {
        var code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
            return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        }
        return c;
    });
}
