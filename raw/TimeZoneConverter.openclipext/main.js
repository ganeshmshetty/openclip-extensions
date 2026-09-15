// Time Zone Converter OpenClip Extension
// Converts detected time strings into a configured target time zone directly inline.

var IANA_MAP = {
  "UTC": "UTC",
  "GMT": "Europe/London",
  // Americas
  "ET": "America/New_York",
  "EST": "America/New_York",
  "EDT": "America/New_York",
  "CT": "America/Chicago",
  "CST": "America/Chicago",
  "CDT": "America/Chicago",
  "MT": "America/Denver",
  "MST": "America/Denver",
  "MDT": "America/Denver",
  "PT": "America/Los_Angeles",
  "PST": "America/Los_Angeles",
  "PDT": "America/Los_Angeles",
  "BRT": "America/Sao_Paulo",
  // Europe
  "WET": "Europe/London",
  "BST": "Europe/London",
  "CET": "Europe/Paris",
  "CEST": "Europe/Paris",
  "EET": "Europe/Athens",
  "EEST": "Europe/Athens",
  // Middle East
  "GST": "Asia/Dubai",
  // South Asia
  "IST": "Asia/Kolkata",
  // East & Southeast Asia
  "SGT": "Asia/Singapore",
  "HKT": "Asia/Hong_Kong",
  "JST": "Asia/Tokyo",
  "KST": "Asia/Seoul",
  // Oceania
  "AEST": "Australia/Sydney",
  "AEDT": "Australia/Sydney",
  "NZST": "Pacific/Auckland",
  "NZDT": "Pacific/Auckland"
};

function resolveZone(name) {
  if (!name || name === "Local") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (e) {
      return "UTC";
    }
  }
  var upper = name.toUpperCase();
  return IANA_MAP[upper] || name;
}

function getTimeZoneOffset(timeZone, date) {
  date = date || new Date();
  var isoStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  var tzStr = date.toLocaleString("en-US", { timeZone: timeZone });
  return new Date(tzStr) - new Date(isoStr);
}

function parseTime(input) {
  if (!input) return null;
  var regex = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?\s*([A-Za-z0-9_+\/-]+)?/i;
  var m = input.match(regex);
  if (!m) return null;

  var hour = parseInt(m[1], 10);
  var min = m[2] ? parseInt(m[2], 10) : 0;
  var sec = m[3] ? parseInt(m[3], 10) : 0;
  var meridiem = m[4] ? m[4].toLowerCase() : null;
  var tzToken = m[5] ? m[5].trim() : null;

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;

  return {
    hour: hour,
    minute: min,
    second: sec,
    tz: tzToken
  };
}

function formatResult(actualUtc, sourceDate, targetZone, targetDisplay, is24h, includeDate) {
  var options = {
    timeZone: targetZone,
    hour: is24h ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle: is24h ? "h23" : "h12"
  };

  if (includeDate) {
    options.weekday = "short";
  }

  var dFmt = new Intl.DateTimeFormat("en-US", options);
  var timeStr = dFmt.format(actualUtc);

  if (!includeDate) {
    var sourceDayStr = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", day: "numeric" }).format(sourceDate);
    var targetDayStr = new Intl.DateTimeFormat("en-US", { timeZone: targetZone, day: "numeric" }).format(actualUtc);
    if (sourceDayStr !== targetDayStr) {
      var sourceDay = parseInt(sourceDayStr, 10);
      var targetDay = parseInt(targetDayStr, 10);
      var diff = targetDay - sourceDay;
      if (diff === 1 || diff < -20) {
        timeStr += " (+1d)";
      } else if (diff === -1 || diff > 20) {
        timeStr += " (-1d)";
      }
    }
  }

  return timeStr + " " + targetDisplay;
}

function action(selection, options) {
  options = options || (typeof openclip !== "undefined" ? openclip.options : {}) || {};
  var targetZoneOpt = options.targetZone || "UTC";
  var timeFormatOpt = options.timeFormat || "12h";
  var includeDateOpt = options.includeDate === true || options.includeDate === "true";
  var is24h = timeFormatOpt === "24h";

  var input = "";
  if (typeof openclip !== "undefined" && openclip.input) {
    input = openclip.input.matchedText || openclip.input.text || "";
  } else {
    input = selection || "";
  }

  var parsed = parseTime(input);
  if (!parsed) return null;

  var sourceZone = resolveZone(parsed.tz || "Local");
  var targetZone = resolveZone(targetZoneOpt);

  var now = new Date();
  var baseUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), parsed.hour, parsed.minute, parsed.second);
  var sourceDate = new Date(baseUtc);
  var sourceOffset = getTimeZoneOffset(sourceZone, sourceDate);
  var actualUtc = new Date(baseUtc - sourceOffset);

  var targetDisplay = targetZoneOpt === "Local" ? "Local" : targetZoneOpt;
  var result = formatResult(actualUtc, sourceDate, targetZone, targetDisplay, is24h, includeDateOpt);
  if (!result) return null;

  if (typeof openclip !== "undefined" && openclip.input && openclip.input.isSecondaryClick) {
    if (typeof openclip.copy === "function") {
      openclip.copy(result);
    }
  }

  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = action;
  module.exports.action = action;
}
