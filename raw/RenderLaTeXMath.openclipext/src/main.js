import katex from 'katex';
import css from 'katex/dist/katex.min.css';
import FONTS from './fonts.js';

const t = strings => (typeof openclip !== 'undefined' && openclip.i18n ? openclip.i18n(strings) : strings.en);

// Accepts $...$, $$...$$, \(...\), \[...\] or bare math. Inline delimiters render inline.
function stripDelimiters(selection, mode) {
  const text = String(selection || '').trim();
  const pairs = [[/^\$\$([\s\S]+)\$\$$/, true], [/^\\\[([\s\S]+)\\\]$/, true], [/^\\\(([\s\S]+)\\\)$/, false], [/^\$([^$]+)\$$/, false]];
  for (const [pattern, display] of pairs) {
    const match = text.match(pattern);
    if (match) return { source: match[1].trim(), display };
  }
  return { source: text, display: mode !== 'Inline' };
}

// Embed only the font faces the rendered HTML can use.
function fontFaces(html) {
  const classes = new Set((html.match(/class="([^"]*)"/g) || []).flatMap(c => c.slice(7, -1).split(/\s+/)));
  const families = new Set(['KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4', 'KaTeX_AMS']);
  for (const [, selector, body] of css.matchAll(/([^{}@]+)\{([^{}]*font-family:\s*"?(KaTeX_\w+)[^{}]*)\}/g)) {
    const family = body.match(/font-family:\s*"?(KaTeX_\w+)/)[1];
    if ((selector.match(/\.([\w-]+)/g) || []).some(c => classes.has(c.slice(1)))) families.add(family);
  }
  return css.match(/@font-face\{[^}]*\}/g)
    .map(face => {
      const name = face.match(/url\(fonts\/([\w-]+)\.woff2\)/)?.[1];
      if (!name || !families.has(face.match(/font-family:"?(\w+)/)[1]) || !FONTS[name]) return '';
      return face.replace(/src:[^}]*/, `src:url(data:font/woff2;base64,${FONTS[name]}) format("woff2")`);
    }).join('');
}

// One macro per line or separated by ';': \R = \mathbb{R} or \R: \mathbb{R}. Malformed entries are ignored.
function parseMacros(text) {
  const macros = {};
  const invalid = [];
  for (const raw of String(text || '').split(/[\n;]/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(\\[a-zA-Z]+)\s*[:=]\s*(\S.*)$/);
    if (match) macros[match[1]] = match[2].trim(); else invalid.push(line);
  }
  return { macros, invalid };
}

const SIZES = { Small: '1.2em', Medium: '1.6em', Large: '2.2em' };
const LIGHT = 'background:#fff;color:#000';
const DARK = 'background:#1e1e1e;color:#f0f0f0';

function themeCSS(theme) {
  if (theme === 'Light') return `html,body{${LIGHT}}`;
  if (theme === 'Dark') return `html,body{${DARK}}`;
  return `html,body{${LIGHT}}@media (prefers-color-scheme:dark){html,body{${DARK}}}`;
}

function renderDocument(source, display, settings = {}) {
  const math = katex.renderToString(source, { displayMode: display, throwOnError: true, output: 'htmlAndMathml', trust: false, strict: 'ignore', macros: parseMacros(settings.macros).macros });
  const style = fontFaces(math) + css.replace(/@font-face\{[^}]*\}/g, '') +
    'html,body{margin:0}body{padding:16px}.katex-display{margin:0}' + themeCSS(settings.theme) +
    `.katex{font-size:${SIZES[settings.size] || SIZES.Medium}}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LaTeX</title><style>${style}</style></head><body>${math}</body></html>`;
}

function base64UTF8(text) {
  const bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const out = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i), b = bytes.charCodeAt(i + 1), c = bytes.charCodeAt(i + 2);
    out.push(alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bytes.length ? alphabet[c & 63] : '='));
  }
  return out.join('');
}

function action(selection) {
  try {
    const text = typeof selection === 'string' ? selection : openclip.input.text;
    const settings = (typeof openclip !== 'undefined' && openclip.options) || {};
    const { source, display } = stripDelimiters(text, settings.mode);
    if (!source) {
      throw new Error(t({ en: 'Select a LaTeX math expression to render.', 'zh-Hans': '请选择要渲染的 LaTeX 数学公式。', 'zh-Hant': '請選取要渲染的 LaTeX 數學公式。', fr: 'Sélectionnez une expression mathématique LaTeX à rendre.', ja: '描画する LaTeX 数式を選択してください。' }));
    }
    if (/\\(documentclass|usepackage|begin\{document\})/.test(source)) {
      throw new Error(t({ en: 'Only LaTeX math expressions are supported, not full documents.', 'zh-Hans': '仅支持 LaTeX 数学公式，不支持完整文档。', 'zh-Hant': '僅支援 LaTeX 數學公式，不支援完整文件。', fr: 'Seules les expressions mathématiques LaTeX sont prises en charge, pas les documents complets.', ja: 'LaTeX の数式のみ対応しており、文書全体には対応していません。' }));
    }
    openclip.file({
      data: base64UTF8(renderDocument(source, display, settings)),
      filename: 'latex-math.html',
      mimeType: 'text/html',
      ...(openclip.input.isSecondaryClick ? { action: 'copy' } : {})
    });
  } catch (error) {
    openclip.toast(error instanceof Error ? error.message : String(error), 'error');
  }
}

module.exports = action;
module.exports.action = action;
module.exports.stripDelimiters = stripDelimiters;
module.exports.parseMacros = parseMacros;
module.exports.renderDocument = renderDocument;
