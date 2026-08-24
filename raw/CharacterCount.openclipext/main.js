function action(selection) {
    var text = selection || "";
    var count = typeof Intl !== "undefined" && Intl.Segmenter
        ? Array.from(new Intl.Segmenter().segment(text)).length
        : Array.from(text).length;
    var msg = count + (count === 1 ? " character" : " characters");
    return msg;
}
