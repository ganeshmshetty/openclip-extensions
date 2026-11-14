// Google Translate — open the web translator in the configured target language.
//
// The action does not translate in-process: it hands the selection to
// translate.google.com, which keeps the full dictionary, alternate meanings,
// and language switcher available. The target comes from the `targetLang`
// option (picker in the action's config sheet; default "English").

// The target picker shows display names; backends need language codes.
// Anything not in the map (e.g. a legacy saved code like "sv") passes through.
var TARGET_CODES = {
  "Arabic": "ar",   "Bengali": "bn",   "Bulgarian": "bg",   "Burmese": "my",
  "Chinese (Simplified)": "zh-Hans",   "Chinese (Traditional)": "zh-Hant",   "Czech": "cs",   "Danish": "da",
  "Dutch": "nl",   "English": "en",   "Filipino": "tl",   "Finnish": "fi",
  "French": "fr",   "German": "de",   "Greek": "el",   "Gujarati": "gu",
  "Hebrew": "he",   "Hindi": "hi",   "Hungarian": "hu",   "Indonesian": "id",
  "Italian": "it",   "Japanese": "ja",   "Kannada": "kn",   "Kashmiri (Koshur)": "ks",
  "Korean": "ko",   "Malay": "ms",   "Malayalam": "ml",   "Marathi": "mr",
  "Norwegian": "no",   "Persian": "fa",   "Polish": "pl",   "Portuguese": "pt",
  "Punjabi": "pa",   "Romanian": "ro",   "Russian": "ru",   "Serbian": "sr",
  "Slovak": "sk",   "Spanish": "es",   "Swahili": "sw",   "Swedish": "sv",
  "Tamil": "ta",   "Telugu": "te",   "Thai": "th",   "Turkish": "tr",
  "Ukrainian": "uk",   "Urdu": "ur",   "Vietnamese": "vi"
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
