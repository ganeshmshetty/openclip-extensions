function action(sel) { return encodeURIComponent((sel || openclip.input.text).trim()); }

module.exports = action;
module.exports.action = action;
