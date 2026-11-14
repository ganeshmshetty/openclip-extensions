// Save Selection as File
//
// Writes the selection to a file and hands it back as a native OpenClip file
// result, so it can be dragged out, Copy File'd, Quick Look'd, or saved.
// Runs in JavaScriptCore (no btoa/TextEncoder), so base64 is encoded by hand.

var MIME_TYPES = {
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
};

// Encode a JavaScript string as base64 of its UTF-8 bytes.
function utf8ToBase64(input) {
  var bytes = [];
  for (var i = 0; i < input.length; i++) {
    var code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      var low = input.charCodeAt(++i);
      var point = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f)
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }

  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "";
  for (var j = 0; j < bytes.length; j += 3) {
    var b0 = bytes[j];
    var b1 = bytes[j + 1];
    var b2 = bytes[j + 2];
    out += alphabet.charAt(b0 >> 2);
    out += alphabet.charAt(((b0 & 0x03) << 4) | ((b1 === undefined ? 0 : b1) >> 4));
    out += b1 === undefined ? "=" : alphabet.charAt(((b1 & 0x0f) << 2) | ((b2 === undefined ? 0 : b2) >> 6));
    out += b2 === undefined ? "=" : alphabet.charAt(b2 & 0x3f);
  }
  return out;
}

function optionString(id, fallback) {
  var value = openclip.option(id);
  if (value === undefined || value === null) return fallback;
  var text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function optionFlag(id) {
  var value = openclip.option(id);
  return value === true || value === "true" || value === "1";
}

function pad(value) {
  return value < 10 ? "0" + value : String(value);
}

function timestampSuffix() {
  var now = new Date();
  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function sanitizeName(name) {
  var cleaned = String(name).replace(/[\/\\:*?"<>|\u0000-\u001f]/g, "-").trim();
  return cleaned.length > 0 ? cleaned : "selection";
}

function action(selection) {
  var text = openclip.input.text;
  if (!text || text.length === 0) {
    openclip.toast("Nothing selected", "error");
    return;
  }

  var format = optionString("format", "txt").toLowerCase();
  var mimeType = MIME_TYPES[format] || "text/plain";
  if (!MIME_TYPES[format]) format = "txt";

  var baseName = sanitizeName(optionString("filename", "selection"));
  if (optionFlag("timestamp")) baseName += "-" + timestampSuffix();

  openclip.file({
    data: utf8ToBase64(text),
    filename: baseName + "." + format,
    mimeType: mimeType,
  });
}
