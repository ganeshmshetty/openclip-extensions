// Curly (typographic) quotes and primes -> plain straight quotes.
function action(selection) {
    if (!selection) return "";
    return selection
        .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
        .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"');
}

module.exports = action;
module.exports.action = action;
