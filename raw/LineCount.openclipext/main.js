function action(selection) {
    var text = selection || "";
    var lines = text.length > 0 ? text.split(/\r?\n/).length : 0;
    var msg = lines + (lines === 1 ? " line" : " lines");
    return msg;
}
