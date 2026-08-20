function action(selection) {
    var text = selection || "";
    var lines = text.length > 0 ? text.split(/\r?\n/).length : 0;
    var msg = lines + (lines === 1 ? " line" : " lines");
    if (typeof openclip !== "undefined" && openclip.toast) {
        openclip.toast(msg, "info");
    }
    return msg;
}
