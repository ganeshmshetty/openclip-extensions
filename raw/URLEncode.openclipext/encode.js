function action(sel) { return encodeURIComponent(sel || openclip.input.text); }

module.exports = action;
module.exports.action = action;
