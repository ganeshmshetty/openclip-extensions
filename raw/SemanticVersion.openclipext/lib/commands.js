// The host-facing layer: reads options, runs a bump, and reports failure.
// All semantic-version rules live in semver.js.

var semver = require('./semver.js');

var INVALID = {
  en: 'Not a valid semantic version',
  'zh-Hans': '不是有效的语义化版本',
  'zh-Hant': '不是有效的語意化版本',
  fr: 'Version sémantique non valide',
  ja: '有効なセマンティックバージョンではありません'
};

// Falls back to English when openclip.i18n is unavailable (OpenClip 1.0.0).
function t(dict) {
  if (typeof openclip !== 'undefined' && openclip && typeof openclip.i18n === 'function') {
    try {
      var value = openclip.i18n(dict);
      if (typeof value === 'string' && value) return value;
    } catch (e) { /* fall through to English */ }
  }
  return dict.en;
}

function selectionText(selection) {
  if (typeof selection === 'string') return selection;
  if (typeof openclip !== 'undefined' && openclip && openclip.input) return openclip.input.text || '';
  return '';
}

function readOption(id, fallback) {
  var value;
  try {
    if (typeof openclip !== 'undefined' && typeof openclip.option === 'function') {
      value = openclip.option(id);
    } else if (typeof openclip !== 'undefined' && openclip.options) {
      value = openclip.options[id];
    }
  } catch (e) {
    value = undefined;
  }
  // An unset option falls back; an option the user cleared stays cleared, which
  // is how an empty identifier asks for a purely numeric pre-release.
  if (value === undefined || value === null) return fallback;
  return String(value);
}

// Identifier and starting number used when a pre-release is started from scratch.
function prereleaseOptions() {
  return { id: readOption('preid', 'rc'), start: readOption('prestart', '1') };
}

// A bump returns the new version as a string, so the user's "When an action
// returns text" preference decides between paste, copy and preview.
function bump(release) {
  return function action(selection) {
    var parsed;
    try {
      parsed = semver.parse(selectionText(selection));
    } catch (e) {
      openclip.toast(t(INVALID), 'error');
      return;
    }
    return semver.format(semver.inc(parsed, release, prereleaseOptions()));
  };
}

module.exports = {
  bump: bump
};
