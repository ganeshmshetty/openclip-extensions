// Google Translate — open the web translator in the configured target language.
//
// The action does not translate in-process: it hands the selection to
// translate.google.com, which keeps the full dictionary, alternate meanings,
// and language switcher available. The target comes from the `targetLang`
// option (picker in the action's config sheet; default "English").

// The picker shows display names; the URL needs BCP-47-ish codes. Anything
// unmapped passes through unchanged (a saved code such as "hu" keeps working).
var TARGET_CODES = {
  'English': 'en', 'Hindi': 'hi', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
  'Japanese': 'ja', 'Chinese (Simplified)': 'zh-Hans', 'Chinese (Traditional)': 'zh-Hant',
  'Korean': 'ko', 'Portuguese': 'pt', 'Russian': 'ru', 'Arabic': 'ar', 'Italian': 'it',
  'Turkish': 'tr', 'Dutch': 'nl', 'Polish': 'pl', 'Swedish': 'sv', 'Danish': 'da',
  'Finnish': 'fi', 'Norwegian': 'no', 'Czech': 'cs', 'Greek': 'el', 'Hebrew': 'he',
  'Thai': 'th', 'Vietnamese': 'vi', 'Indonesian': 'id', 'Ukrainian': 'uk',
  'Bengali': 'bn', 'Tamil': 'ta', 'Telugu': 'te', 'Malayalam': 'ml', 'Urdu': 'ur',
  'Persian': 'fa', 'Punjabi': 'pa', 'Marathi': 'mr', 'Filipino': 'tl', 'Swahili': 'sw',
  'Romanian': 'ro', 'Gujarati': 'gu', 'Hungarian': 'hu', 'Malay': 'ms', 'Slovak': 'sk',
  'Bulgarian': 'bg', 'Serbian': 'sr', 'Burmese': 'my', 'Kannada': 'kn',
  'Kashmiri (Koshur)': 'ks'
};

function action() {
  var text = openclip.input.text.trim();
  if (!text) {
    return;
  }

  var picked = openclip.option('targetLang') || 'English';
  var target = TARGET_CODES[picked] || picked;

  openclip.openURL(
    'https://translate.google.com/?sl=auto&tl=' + encodeURIComponent(target) +
    '&text=' + encodeURIComponent(text) +
    '&op=translate'
  );
}

module.exports = action;
module.exports.action = action;
