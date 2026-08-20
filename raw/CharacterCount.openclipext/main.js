function action(selection) {
    var text = selection || "";
    var count = text.length;
    var msg = count + (count === 1 ? " character" : " characters");
    if (typeof openclip !== "undefined" && openclip.toast) {
        openclip.toast(msg, "info");
    }
    return msg;
}
