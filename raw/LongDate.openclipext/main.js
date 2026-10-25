// Inserts today's date written out in full, e.g. "Sunday, 25 October 2026",
// formatted for the user's locale when the system supports it.
var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

function fallback(d) {
    return DAYS[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

function formatLongDate(d, locale) {
    if (!locale) return fallback(d);
    var tag = String(locale).replace(/_/g, "-").replace(/@.*$/, "");
    try {
        return d.toLocaleDateString(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
        return fallback(d);
    }
}

function action() {
    var locale = (typeof openclip !== "undefined" && openclip.locale) || "";
    return formatLongDate(new Date(), locale);
}

module.exports = action;
module.exports.action = action;
module.exports.formatLongDate = formatLongDate;
module.exports.fallback = fallback;
