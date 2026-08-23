// Quick Translate — inline translation.
//
// Returns the translated string; OpenClip delivers it per the user's General-tab
// preference (preview / paste / copy). Target language comes from the `targetLang`
// option (a picker in the action's config sheet; default "en").
//
// Backends, tried in order until one succeeds — ALL keyless, ALL auto-detect
// the source language:
//   1–2. Google gtx endpoint on both Google hosts (separate throttle buckets).
//   3.   Chrome dictionary endpoint (clients5.google.com) — separate infrastructure.
//   4.   LibreTranslate @ translate.disroot.org (Argos engine, source:"auto").
//   5.   SimplyTranslate @ simplytranslate.org (Google engine, from=auto).
//   6.   Lingva @ lingva.ml (official instance; down at authoring time but kept
//        as a free shot — fails fast if still dead).

// Keep selections bounded: percent-encoding inflates the query string and both
// backends have practical URL/request-size limits well below their char caps.
var MAX_SELECTION_CHARS = 4000;

// Browser-ish UA: endpoints apply different treatment per client signature
// (the gtx endpoint 429s non-browser UAs far more aggressively).
var BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

// IMPORTANT: OpenClip's fetch polyfill response accessors are SYNCHRONOUS —
// `res.json()` / `res.text()` return values directly, not Promises (unlike
// browser/Node fetch). jsonOf() accepts either so the code works in both.
function jsonOf(res) {
  var v = res.json();
  return (v && typeof v.then === 'function') ? v : Promise.resolve(v);
}

// The classic gtx endpoint, tried on both Google hosts (separate throttle buckets).
function translateViaGtx(host, text, targetLang) {
  var url =
    'https://' + host + '/translate_a/single' +
    '?client=gtx&sl=auto&dt=t' +
    '&tl=' + encodeURIComponent(targetLang) +
    '&q=' + encodeURIComponent(text);
  return openclip.fetch(url, { headers: { 'User-Agent': BROWSER_UA } }).then(function (res) {
    if (!res.ok) {
      throw new Error('gtx(' + host + ') HTTP ' + res.status +
        (res.status === 429 ? ' (rate limited)' : ''));
    }
    return jsonOf(res).then(function (data) {
      // data[0] is an array of segments: [[translated, original, …], …]
      if (!data || !Array.isArray(data[0])) {
        throw new Error('Unexpected gtx response shape');
      }
      var translated = data[0].map(function (seg) { return seg[0] || ''; }).join('');
      return translated;
    });
  });
}

// The Chrome dictionary endpoint: keyless, auto-detects, separate infrastructure
// from gtx. Shape: [["<translation>", "<detected src>"], …].
function translateViaDictChrome(text, targetLang) {
  var url =
    'https://clients5.google.com/translate_a/t' +
    '?client=dict-chrome-ex&sl=auto' +
    '&tl=' + encodeURIComponent(targetLang) +
    '&q=' + encodeURIComponent(text);
  return openclip.fetch(url, { headers: { 'User-Agent': BROWSER_UA } }).then(function (res) {
    if (!res.ok) {
      throw new Error('dict-chrome-ex HTTP ' + res.status);
    }
    return jsonOf(res).then(function (data) {
      // Accept [["t","src"],…] and ["t", …] shapes; join every segment string.
      var parts = (data || []).map(function (seg) {
        return Array.isArray(seg) ? String(seg[0] || '') : String(seg || '');
      });
      var translated = parts.join('');
      if (!translated.trim()) {
        throw new Error('dict-chrome-ex returned no translation');
      }
      return translated;
    });
  });
}

// Language-code mapping: the picker uses Microsoft-style codes; some backends
// differ. Anything unmapped passes through unchanged (failures just cascade).
function langFor(code, aliases) {
  return (aliases && aliases[code]) || code;
}
var LT_ALIASES      = { 'zh-Hans': 'zh', 'zh-Hant': 'zt' };
var LINGVA_ALIASES  = { 'zh-Hans': 'zh_HANS', 'zh-Hant': 'zh_HANT' };

// LibreTranslate (Argos engine) — keyless community instance, auto-detect via
// source:"auto". Shape: { detectedLanguage: {language, confidence}, translatedText }.
function translateViaLibreTranslate(text, targetLang) {
  return openclip.fetch('https://translate.disroot.org/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text, source: 'auto',
      target: langFor(targetLang, LT_ALIASES), format: 'text'
    })
  }).then(function (res) {
    if (!res.ok) {
      throw new Error('LibreTranslate HTTP ' + res.status);
    }
    return jsonOf(res).then(function (data) {
      var t = data && data.translatedText;
      if (!t || !String(t).trim()) {
        throw new Error((data && data.error) || 'LibreTranslate returned no translation');
      }
      return String(t);
    });
  });
}

// SimplyTranslate — front-end with multi-engine support; google engine + from=auto.
// Shape: { translated_text: string, source_language: string, … }.
function translateViaSimplyTranslate(text, targetLang) {
  var url =
    'https://simplytranslate.org/api/translate/' +
    '?engine=google&from=auto' +
    '&to=' + encodeURIComponent(langFor(targetLang)) +
    '&text=' + encodeURIComponent(text);
  return openclip.fetch(url).then(function (res) {
    if (!res.ok) {
      throw new Error('SimplyTranslate HTTP ' + res.status);
    }
    return jsonOf(res).then(function (data) {
      var t = data && data.translated_text;
      if (!t || !String(t).trim()) {
        throw new Error((data && data.error) || 'SimplyTranslate returned no translation');
      }
      return String(t);
    });
  });
}

// Lingva — Google Translate proxy front-end; "auto" source detects. Official
// instance was erroring at authoring time; kept as a last-ditch free shot.
// Shape: { translation: string } or { error: string }.
function translateViaLingva(text, targetLang) {
  // Lingva's API takes the query in the path — double-encode so slashes and
  // spaces survive their own routing layer.
  var query = encodeURIComponent(encodeURIComponent(text));
  var url =
    'https://lingva.ml/api/v1/auto/' +
    encodeURIComponent(langFor(targetLang, LINGVA_ALIASES)) + '/' + query;
  return openclip.fetch(url, { headers: { 'User-Agent': BROWSER_UA } }).then(function (res) {
    if (!res.ok) {
      throw new Error('Lingva HTTP ' + res.status);
    }
    return jsonOf(res).then(function (data) {
      var t = data && data.translation;
      if (!t || !String(t).trim()) {
        throw new Error((data && data.error) || 'Lingva returned no translation');
      }
      return String(t);
    });
  });
}

// Backends in priority order. All return the translated string; all auto-detect
// the source language.
function buildBackends() {
  return [
    function (text, lang) { return translateViaGtx('translate.googleapis.com', text, lang); },
    function (text, lang) { return translateViaGtx('translate.google.com', text, lang); },
    translateViaDictChrome,
    translateViaLibreTranslate,
    translateViaSimplyTranslate,
    translateViaLingva
  ];
}


async function action() {
  var text = openclip.input.text.trim();
  if (!text) {
    openclip.toast('Nothing selected to translate', 'error');
    return;
  }
  if (text.length > MAX_SELECTION_CHARS) {
    openclip.toast('Selection too long (' + text.length + ' chars, max ' + MAX_SELECTION_CHARS + ')', 'error');
    return;
  }

  var targetLang = openclip.option('targetLang') || 'en';

  var translated = null;
  var failures = [];
  var backends = buildBackends();
  for (var i = 0; i < backends.length && !translated; i++) {
    try {
      translated = await backends[i](text, targetLang);
    } catch (err) {
      console.log('Backend ' + i + ' failed:', String(err));
      failures.push(String(err));
    }
  }

  if (!translated || !translated.trim()) {
    openclip.toast(
      'Translation failed: ' +
      (failures.length ? failures.join(' | ') : 'empty translation'),
      'error', { keepVisible: true });
    return;
  }

  // Return the string: OpenClip resolves it as a `.text` result delivered per
  // the user's General-tab preference (preview / paste / copy), with defaults
  // of primary-click paste and secondary-click copy.
  return translated;
}

