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

var FALLBACK_ZONE = "UTC";

// True when `Intl` accepts `name` as a time zone. Guards against the RangeError that
// `Intl.DateTimeFormat`/`toLocaleString` throw for an unknown zone, which previously aborted
// the whole action (and therefore suppressed the inline preview).
function isValidZone(name) {
  if (!name) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: name });
    return true;
  } catch (e) {
    return false;
  }
}

function resolveZone(name) {
  var zone;
  if (!name || name === "Local") {
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (e) {
      zone = "UTC";
    }
  } else {
    zone = IANA_MAP[String(name).toUpperCase()] || name;
  }
  return isValidZone(zone) ? zone : FALLBACK_ZONE;
}

function getTimeZoneOffset(timeZone, date) {
  date = date || new Date();
  var isoStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  var tzStr = date.toLocaleString("en-US", { timeZone: timeZone });
  return new Date(tzStr) - new Date(isoStr);
}

// A clock time must be unambiguous: either `H:MM[:SS]` (optionally followed by am/pm) or a bare
// `H am|pm`. Previously this matched the FIRST number anywhere in the selection and treated the
// following token as the zone, so a Discord mention id (`<@123456789>`), a year, or a count became
// the "zone" and `Intl` threw `RangeError: invalid time zone` — no inline preview. Requiring a
// colon or a meridiem skips those unrelated numbers.
var TIME_RE = /\b(\d{1,2})(?::(\d{2})(?::(\d{2}))?\s*(am|pm)?|\s*(am|pm))\b/i;

// A trailing token is honored as a zone only when it is a known abbreviation, an IANA region/city
// name, or an explicit UTC offset — never an arbitrary following word ("apples", "things", "3456789").
function isZoneToken(token) {
  if (!token) return false;
  if (IANA_MAP[token.toUpperCase()]) return true;
  // IANA names can have two or three parts: "Asia/Kolkata", "America/Argentina/Buenos_Aires".
  if (/^[A-Za-z]+(?:\/[A-Za-z_]+)+$/.test(token)) return true;
  if (parseOffset(token) !== null) return true;
  return false;
}

// Selections often carry odd whitespace: macOS writes "3:30\u202fPM" (narrow no-break space),
// web pages use &nbsp;, and selections can include tabs/newlines. Collapse all of it to one
// ASCII space and turn dotted meridiems ("p.m.") into plain "pm" before parsing.
function normalizeInput(input) {
  return String(input)
    .replace(/[\s\u00A0\u202F\u2009\u200B]+/g, " ")
    .trim()
    .replace(/\b([ap])\.? ?m\b\.?/gi, "$1m");
}

// "+5:30", "-0800", "+9" -> minutes east of UTC.
function parseOffset(token) {
  var m = /^([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(token);
  if (!m) return null;
  var hours = parseInt(m[2], 10);
  var minutes = m[3] ? parseInt(m[3], 10) : 0;
  // Real offsets run from -12:00 to +14:00; minutes must be a valid clock minute.
  if (hours > 14 || minutes > 59) return null;
  var mins = hours * 60 + minutes;
  if (mins > 14 * 60) return null;
  return m[1] === "-" ? -mins : mins;
}

var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Optional calendar date in the selection ("Oct 26, 2026", "26 Oct 2026", "2026-10-26"). When
// present it is used instead of today, so DST and the weekday are right for that day.
function parseDate(input) {
  var m = /\b(\d{4})-(\d{1,2})-(\d{1,2})(?=\b|T)/.exec(input);
  if (m) return makeDate(+m[1], +m[2] - 1, +m[3]);
  m = /\b([A-Za-z]{3})[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})\b/.exec(input);
  if (m && MONTHS.hasOwnProperty(m[1].toLowerCase())) return makeDate(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  m = /\b(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?,? (\d{4})\b/.exec(input);
  if (m && MONTHS.hasOwnProperty(m[2].toLowerCase())) return makeDate(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  return null;
}

function makeDate(y, mo, d) {
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  return { year: y, month: mo, day: d };
}

function parseTime(input) {
  if (!input) return null;
  input = normalizeInput(input);
  var m = input.match(TIME_RE);
  if (!m) return null;

  var hour = parseInt(m[1], 10);
  var min = m[2] ? parseInt(m[2], 10) : 0;
  var sec = m[3] ? parseInt(m[3], 10) : 0;
  var meridiem = (m[4] || m[5] || "").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;

  var rest = input.slice(m.index + m[0].length);
  var zoneMatch = rest.match(/^\s*([A-Za-z]+(?:[\/_][A-Za-z]+)*|[+-]\d{1,2}(?::?\d{2})?)\b/);
  var tzToken = zoneMatch && isZoneToken(zoneMatch[1]) ? zoneMatch[1] : null;
  var offsetMinutes = null;
  if (tzToken) {
    offsetMinutes = parseOffset(tzToken);
    var after = rest.slice(zoneMatch[0].length);
    var offMatch = /^(?:UTC|GMT)$/i.test(tzToken) && after.match(/^ ?([+-]\d{1,2}(?::?\d{2})?)(?![\d:])/);
    if (offMatch) offsetMinutes = parseOffset(offMatch[1]);
  }

  return {
    hour: hour,
    minute: min,
    second: sec,
    tz: tzToken,
    offsetMinutes: offsetMinutes,
    date: parseDate(input)
  };
}

// Short label for a resolved IANA zone: our own abbreviation when we have one (Asia/Kolkata ->
// IST), else Intl's short name, else the IANA name itself.
var DISPLAY_ABBR = {
  "UTC": "UTC", "Europe/London": "GMT", "America/New_York": "ET", "America/Chicago": "CT",
  "America/Denver": "MT", "America/Los_Angeles": "PT", "America/Sao_Paulo": "BRT",
  "Europe/Paris": "CET", "Europe/Athens": "EET", "Asia/Dubai": "GST", "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST", "Asia/Singapore": "SGT", "Asia/Hong_Kong": "HKT", "Asia/Tokyo": "JST",
  "Asia/Seoul": "KST", "Australia/Sydney": "AEST", "Pacific/Auckland": "NZST"
};

function zoneLabel(zone, date) {
  if (DISPLAY_ABBR[zone]) return DISPLAY_ABBR[zone];
  try {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(date);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === "timeZoneName" && parts[i].value) return parts[i].value;
    }
  } catch (e) {}
  return zone;
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
  // Source Time Zone: used only when the selection itself names no zone or offset.
  var sourceZoneOpt = options.sourceZone || "UTC";
  var targetZoneOpt = options.targetZone || "Local";
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
  // The manifest regex hands us only the time ("06:47:31") as matchedText, so look for a date in
  // the full selection too ("Oct 26, 2026, 06:47:31").
  if (!parsed.date && typeof openclip !== "undefined" && openclip.input && openclip.input.text) {
    parsed.date = parseDate(normalizeInput(openclip.input.text));
  }

  var sourceZone = resolveZone(parsed.tz || sourceZoneOpt);
  var targetZone = resolveZone(targetZoneOpt);

  var now = new Date();
  var d = parsed.date || { year: now.getUTCFullYear(), month: now.getUTCMonth(), day: now.getUTCDate() };
  var baseUtc = Date.UTC(d.year, d.month, d.day, parsed.hour, parsed.minute, parsed.second);
  var sourceDate = new Date(baseUtc);
  var sourceOffset = parsed.offsetMinutes !== null
    ? parsed.offsetMinutes * 60000
    : getTimeZoneOffset(sourceZone, sourceDate);
  var actualUtc = new Date(baseUtc - sourceOffset);

  var targetDisplay = targetZoneOpt === "Local" ? zoneLabel(targetZone, actualUtc) : targetZoneOpt;
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
