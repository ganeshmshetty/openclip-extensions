function action(selection, options) {
    var text = selection || "";
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var chars = text.length;
    var lines = text.split("\n").length;

    return words + " words  •  " + chars + " chars  •  " + lines + " lines";
}
