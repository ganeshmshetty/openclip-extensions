function action(sel) { try { return decodeURIComponent((sel || openclip.input.text).trim()); } catch(e) { return sel; } }

module.exports = action;
module.exports.action = action;
