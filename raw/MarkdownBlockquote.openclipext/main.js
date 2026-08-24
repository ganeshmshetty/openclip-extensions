function action(selection) {
    if (!selection) return "";
    var br = selection.match(/(\r\n|\r|\n)$/);
    var body = br ? selection.slice(0, -br[1].length) : selection;
    return body.split(/\r?\n/).map(function(line) {
        return "> " + line;
    }).join("\n") + (br ? "\n" : "");
}
