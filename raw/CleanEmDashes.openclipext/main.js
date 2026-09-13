// Clean Em Dashes — OpenClip Extension
// Converts excessive AI-generated em-dashes and formatting dashes into natural punctuation.

function getOption(id, defaultValue) {
  var val;
  if (typeof openclip !== 'undefined') {
    if (typeof openclip.option === 'function') {
      val = openclip.option(id);
    } else if (openclip.options && openclip.options[id] !== undefined) {
      val = openclip.options[id];
    }
  }
  if (val === undefined || val === null || val === '') {
    return defaultValue;
  }
  return val;
}

function getBoolOption(id, defaultValue) {
  var val = getOption(id, defaultValue);
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    var lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  return Boolean(val);
}

function cleanEmDashes(text, options) {
  if (!text) return '';
  options = options || {};

  var style = options.style || getOption('style', 'commas');
  var cleanEnDashes = options.cleanEnDashes !== undefined ? options.cleanEnDashes : getBoolOption('cleanEnDashes', true);
  var cleanDoubleHyphens = options.cleanDoubleHyphens !== undefined ? options.cleanDoubleHyphens : getBoolOption('cleanDoubleHyphens', true);

  var result = text;

  // 1. Line-starting list bullets: "— Item" or "-- Item" -> "- Item"
  result = result.replace(/^(\s*)—\s+/gm, '$1- ');
  if (cleanDoubleHyphens) {
    result = result.replace(/^(\s*)--\s+/gm, '$1- ');
  }

  // 2. Unify target dashes into a private Unicode placeholder \uE000
  // Spaced en-dashes: only when surrounded by whitespace
  if (cleanEnDashes) {
    result = result.replace(/([^\S\r\n]+)\u2013([^\S\r\n]+)/g, '$1\uE000$2');
  }
  // Double hyphens (2 or more hyphens)
  if (cleanDoubleHyphens) {
    result = result.replace(/--+/g, '\uE000');
  }
  // Standard em-dashes
  result = result.replace(/\u2014/g, '\uE000');

  // 3. Handle paired dashes (parenthetical clauses)
  if (style === 'parentheses') {
    result = result.replace(/(?:[^\S\r\n]*\uE000[^\S\r\n]*)([^.\r\n\uE000]+?)(?:[^\S\r\n]*\uE000[^\S\r\n]*)/g, function(_, inner) {
      return ' (' + inner.trim() + ') ';
    });
  } else if (style === 'hyphens') {
    result = result.replace(/[^\S\r\n]*\uE000[^\S\r\n]*/g, ' - ');
  } else if (style === 'remove') {
    result = result.replace(/[^\S\r\n]*\uE000[^\S\r\n]*/g, ' ');
  } else {
    // Default style: 'commas'
    result = result.replace(/(?:[^\S\r\n]*\uE000[^\S\r\n]*)([^.\r\n\uE000]+?)(?:[^\S\r\n]*\uE000[^\S\r\n]*)/g, function(_, inner) {
      return ', ' + inner.trim() + ', ';
    });
  }

  // 4. Handle remaining dashes (single dash, connector, or edge positions)
  // A. Dash before existing punctuation: e.g. "— ." or "— ?"
  result = result.replace(/[^\S\r\n]*\uE000[^\S\r\n]*([.,;:!?)\]}])/g, '$1');

  // B. Dash after existing punctuation: e.g. "!, — "
  result = result.replace(/([.,;:!?(\[{])[^\S\r\n]*\uE000[^\S\r\n]*/g, '$1 ');

  // C. Dash at beginning of line
  result = result.replace(/^[^\S\r\n]*\uE000[^\S\r\n]*/gm, '');

  // D. Dash at end of line
  result = result.replace(/[^\S\r\n]*\uE000[^\S\r\n]*$/gm, '');

  // E. Remaining dashes between words
  var fallbackReplacement = ', ';
  if (style === 'hyphens') {
    fallbackReplacement = ' - ';
  } else if (style === 'remove') {
    fallbackReplacement = ' ';
  }
  result = result.replace(/[^\S\r\n]*\uE000[^\S\r\n]*/g, fallbackReplacement);

  // 5. Clean up spacing and punctuation collisions
  // Collapse multiple horizontal spaces to single space
  result = result.replace(/[^\S\r\n]{2,}/g, ' ');
  // Remove space before punctuation: " ," or " ."
  result = result.replace(/[^\S\r\n]+([.,;:!?])/g, '$1');
  // Clean double commas: ",," or ", ," -> ","
  result = result.replace(/,[^\S\r\n]*,+/g, ',');
  // Clean comma directly before a period: ",." -> "."
  result = result.replace(/,[^\S\r\n]*\./g, '.');
  // Clean comma at start of line: "^, " -> ""
  result = result.replace(/^[^\S\r\n]*,[^\S\r\n]*/gm, '');
  // Clean comma before closing parentheses: ", )" -> ") "
  result = result.replace(/,[^\S\r\n]*\)/g, ')');

  return result;
}

function action(selection, options) {
  var text = typeof selection === 'string' ? selection : (selection && selection.text ? selection.text : String(selection || ''));
  if (!text) return '';
  return cleanEmDashes(text, options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = action;
  module.exports.action = action;
  module.exports.cleanEmDashes = cleanEmDashes;
}
