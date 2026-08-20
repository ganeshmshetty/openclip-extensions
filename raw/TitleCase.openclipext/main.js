var minorWords = {
    "a": true, "an": true, "the": true,
    "and": true, "but": true, "or": true, "nor": true, "for": true, "yet": true, "so": true,
    "as": true, "at": true, "by": true, "in": true, "of": true, "off": true, "on": true, "per": true, "to": true, "up": true, "via": true, "vs": true, "with": true
};

function action(selection) {
    if (!selection) return "";

    return selection.replace(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g, function(word, index, fullStr) {
        var lower = word.toLowerCase();
        var isFirst = index === 0 || !/[A-Za-z0-9]/.test(fullStr.slice(0, index));
        var isLast = index + word.length >= fullStr.length || !/[A-Za-z0-9]/.test(fullStr.slice(index + word.length));
        var precededByPunct = /[:.!?]\s*$/.test(fullStr.slice(0, index));

        if (!isFirst && !isLast && !precededByPunct && minorWords[lower]) {
            return lower;
        }
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    });
}
