import { render } from 'pele';

function sourceText(selection) {
  const text = selection.trim();
  const fenced = text.match(/^(`{3,}|~{3,})mermaid[^\S\n]*\r?\n([\s\S]*?)\r?\n\1$/i);
  return fenced ? fenced[2].trim() : text;
}

function portableSVG(svg, width, height, options) {
  const rootStyle = svg.match(/^<svg\b[^>]*\bstyle="([^"]*)"/)?.[1] || '';
  const variables = Object.fromEntries(
    Array.from(rootStyle.matchAll(/(--[\w-]+):([^;]+)(?:;|$)/g), match => [match[1], match[2]])
  );
  const dark = options.theme === 'dark';
  if (dark) {
    Object.assign(variables, {
      '--pele-bg': '#100f0f', '--pele-fg': '#cecdc3', '--pele-muted': '#878580',
      '--pele-line': '#cecdc3', '--pele-surface': '#1c1b1a', '--pele-surface-alt': '#282726',
      '--pele-border': '#575653', '--pele-accent': '#4385be', '--pele-critical': '#d14d41'
    });
  }
  // Native SVG previews need literal colors instead of CSS custom properties.
  const resolved = svg.replace(/\b(fill|stroke|style|font-family|font-weight)="([^"]*)"/g, (attribute, name, value) => {
    for (let pass = 0; pass < 8 && value.includes('var('); pass++) {
      value = value.replace(/var\((--[\w-]+)(?:,([^()]*))?\)/g, (expression, key, fallback) => variables[key] ?? fallback ?? expression);
    }
    return `${name}="${value}"`;
  });
  return options.transparent === 'true' ? resolved : resolved.replace(
    /^(<svg\b[^>]*>)/,
    `$1<rect width="${width}" height="${height}" fill="${dark ? '#100f0f' : '#fff'}"/>`
  );
}

function numericOption(value, choices, fallback) {
  const number = Number(value);
  return choices.includes(number) ? number : fallback;
}

function base64UTF8(text) {
  const bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const encoded = [];
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes.charCodeAt(index);
    const b = bytes.charCodeAt(index + 1);
    const c = bytes.charCodeAt(index + 2);
    encoded.push(
      alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] +
      (index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') +
      (index + 2 < bytes.length ? alphabet[c & 63] : '=')
    );
  }
  return encoded.join('');
}

module.exports = function action(selection, options = {}) {
  try {
    const source = sourceText(selection);
    if (!source) {
      throw new Error(openclip.i18n({
        en: 'Select Mermaid code to render.',
        'zh-Hans': '请选择要渲染的 Mermaid 代码。',
        'zh-Hant': '請選取要渲染的 Mermaid 程式碼。',
        fr: 'Sélectionnez du code Mermaid à rendre.',
        ja: '描画する Mermaid コードを選択してください。'
      }));
    }
    const result = render(source, {
      responsive: false, autoDirection: false, links: false, images: false,
      fontSize: numericOption(options.fontSize, [12, 16, 20, 24], 16),
      padding: numericOption(options.padding, [8, 16, 24, 32], 8)
    });
    openclip.file({
      data: base64UTF8(portableSVG(result.svg, result.width, result.height, options)),
      filename: `mermaid-${result.type}.svg`,
      mimeType: 'image/svg+xml',
      ...(openclip.input.isSecondaryClick ? { action: 'copy' } : {})
    });
  } catch (error) {
    openclip.toast(error instanceof Error ? error.message : String(error), 'error');
  }
};
