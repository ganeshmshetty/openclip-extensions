function action(selection) {
    if (!selection) return "";
    var upper = false;
    var result = "";
    for (var i = 0; i < selection.length; i++) {
        var ch = selection.charAt(i);
        if (/[a-zA-Z]/.test(ch)) {
            result += upper ? ch.toUpperCase() : ch.toLowerCase();
            upper = !upper;
        } else {
            result += ch;
        }
    }
    return result;
}
