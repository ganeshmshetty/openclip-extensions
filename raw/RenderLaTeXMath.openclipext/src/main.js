import './console-shim.js';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const t = strings => (typeof openclip !== 'undefined' && openclip.i18n ? openclip.i18n(strings) : strings.en);

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
// Packages that load files or need a browser are left out.
const PACKAGES = AllPackages.filter(name => !['autoload', 'require', 'html', 'bussproofs', 'noundefined', 'noerrors'].includes(name));

// Accepts $...$, $$...$$, \(...\), \[...\] or bare math. Inline delimiters render inline.
function stripDelimiters(selection, mode) {
  // Copied text often carries invisible or typographic spaces that KaTeX has no metrics for.
  const text = String(selection || '')
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, '')
    .replace(/[\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, ' ')
    .trim();
  const pairs = [[/^\$\$([\s\S]+)\$\$$/, true], [/^\\\[([\s\S]+)\\\]$/, true], [/^\\\(([\s\S]+)\\\)$/, false], [/^\$([^$]+)\$$/, false]];
  for (const [pattern, display] of pairs) {
    const match = text.match(pattern);
    if (match) return { source: match[1].trim(), display };
  }
  return { source: text, display: mode !== 'Inline' };
}

// One macro per line or separated by ';': \R = \mathbb{R} or \R: \mathbb{R}. Malformed entries are ignored.
function parseMacros(text) {
  const macros = {};
  const invalid = [];
  for (const raw of String(text || '').split(/[\n;]/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(\\[a-zA-Z]+)\s*[:=]\s*(\S.*)$/);
    if (match) macros[match[1].slice(1)] = match[2].trim(); else invalid.push(line);
  }
  return { macros, invalid };
}


// Font size of the math in pixels (one em) and padding around it.
const SIZES = { Small: 20, Medium: 28, Large: 40 };
const PAD = 8;
const LIGHT = { bg: '#fff', fg: '#000' };
const DARK = { bg: '#1e1e1e', fg: '#f0f0f0' };

// MathJax's fonts lack precomposed accented letters, so \\text{é} would fall back to a guessed-width
// <text>. Rewrite them inside \\text{…} as TeX accents (\\'{e}), which textmacros draws from the font.
const ACCENTS = { '\u0301': 'acute', '\u0300': 'grave', '\u0308': 'ddot', '\u0302': 'hat', '\u0303': 'tilde', '\u0304': 'bar', '\u0306': 'breve', '\u030C': 'check' };
function accentText(source) {
  return source.replace(/(\\(?:text|textrm|textit|textbf|mbox)\s*\{)([^{}$]*)\}/g, (_, open, body) =>
    open + body.normalize('NFD').replace(/([A-Za-z])([\u0300-\u036f]+)/g, (m, ch, marks) => {
      if (![...marks].every(mark => ACCENTS[mark])) return m.normalize('NFC');
      // Dotless i/j under accents, drawn upright with math accents (MathJax's text accents sit too high).
      const base = ch === 'i' ? '\\imath' : ch === 'j' ? '\\jmath' : `\\mathrm{${ch}}`;
      return '$' + [...marks].reduce((inner, mark) => `\\${ACCENTS[mark]}{${inner}}`, base) + '$';
    }).normalize('NFC') + '}');
}

function renderSVG(source, display, settings = {}) {
  source = accentText(source);
  const tex = new TeX({ packages: PACKAGES, macros: parseMacros(settings.macros).macros, formatError: (_, error) => { throw error; } });
  const doc = mathjax.document('', { InputJax: tex, OutputJax: new SVG({ fontCache: 'none' }) });
  const node = doc.convert(source, { display, em: 16, ex: 8, containerWidth: 80 * 16 });
  const inner = adaptor.firstChild(node);
  const em = SIZES[settings.size] || SIZES.Medium;
  // MathJax sizes the SVG in ex; one ex is half an em in its default font metrics.
  const ex = name => parseFloat(adaptor.getAttribute(inner, name)) * em / 2;
  const width = Math.ceil(ex('width') + 2 * PAD);
  const height = Math.ceil(ex('height') + 2 * PAD);
  const viewBox = adaptor.getAttribute(inner, 'viewBox').split(/\s+/).map(Number);
  const scale = (width - 2 * PAD) / viewBox[2];
  const colors = settings.theme === 'Dark' ? DARK : LIGHT;
  const system = settings.theme !== 'Dark' && settings.theme !== 'Light';
  const style = system
    ? `<style>@media (prefers-color-scheme: dark){.bg{fill:${DARK.bg}}.fg{fill:${DARK.fg};stroke:${DARK.fg}}}</style>`
    : '';
  const body = adaptor.innerHTML(inner)
    .replace(/currentColor/g, 'inherit');
  const ty = PAD - viewBox[1] * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    style + `<rect class="bg" width="${width}" height="${height}" fill="${colors.bg}"/>` +
    `<g class="fg" fill="${colors.fg}" stroke="${colors.fg}" stroke-width="0" transform="translate(${PAD - viewBox[0] * scale} ${ty}) scale(${scale})">${body}</g></svg>`;
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
      data: base64UTF8(renderSVG(source, display, settings)),
      filename: 'latex-math.svg',
      mimeType: 'image/svg+xml',
      ...(openclip.input.isSecondaryClick ? { action: 'copy' } : {})
    });
  } catch (error) {
    openclip.toast(error && error.message ? error.message : String(error), 'error');
  }
}

module.exports = action;
module.exports.action = action;
module.exports.stripDelimiters = stripDelimiters;
module.exports.parseMacros = parseMacros;
module.exports.renderSVG = renderSVG;
