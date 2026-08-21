function action(selection) {
    var text = (selection || "").replace(/\r\n|\r/g, "\n").trim();
    var paragraphs = text.length > 0 ? text.split(/\n\s*\n+/).filter(Boolean).length : 0;
    var msg = paragraphs + (paragraphs === 1 ? " paragraph" : " paragraphs");
    if (typeof openclip !== "undefined" && openclip.toast) {
        openclip.toast(msg, "info");
    }
    return msg;
}
