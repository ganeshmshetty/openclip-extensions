const hljs = require('highlight.js/lib/core');

const LANGUAGES = {
  javascript: require('highlight.js/lib/languages/javascript'),
  typescript: require('highlight.js/lib/languages/typescript'),
  python: require('highlight.js/lib/languages/python'),
  swift: require('highlight.js/lib/languages/swift'),
  rust: require('highlight.js/lib/languages/rust'),
  go: require('highlight.js/lib/languages/go'),
  bash: require('highlight.js/lib/languages/bash'),
  shell: require('highlight.js/lib/languages/shell'),
  json: require('highlight.js/lib/languages/json'),
  css: require('highlight.js/lib/languages/css'),
  scss: require('highlight.js/lib/languages/scss'),
  xml: require('highlight.js/lib/languages/xml'),
  sql: require('highlight.js/lib/languages/sql'),
  yaml: require('highlight.js/lib/languages/yaml'),
  markdown: require('highlight.js/lib/languages/markdown'),
  c: require('highlight.js/lib/languages/c'),
  cpp: require('highlight.js/lib/languages/cpp'),
  java: require('highlight.js/lib/languages/java'),
  kotlin: require('highlight.js/lib/languages/kotlin'),
  ruby: require('highlight.js/lib/languages/ruby'),
  php: require('highlight.js/lib/languages/php'),
  dockerfile: require('highlight.js/lib/languages/dockerfile'),
  diff: require('highlight.js/lib/languages/diff'),
  graphql: require('highlight.js/lib/languages/graphql'),
  makefile: require('highlight.js/lib/languages/makefile'),
  ini: require('highlight.js/lib/languages/ini')
};

for (const [name, definition] of Object.entries(LANGUAGES)) {
  hljs.registerLanguage(name, definition);
}

// Reusable dark/light syntax palettes tuned per Ray.so theme family
const PALETTES = {
  vibrantDark: {
    fg: '#F3F4F6',
    comment: '#7E869A',
    keyword: '#F472B6',
    type: '#67E8F9',
    string: '#A7F3D0',
    number: '#FDBA74',
    title: '#93C5FD',
    attr: '#C4B5FD',
    tag: '#FB7185',
    operator: '#94A3B8',
    addition: '#86EFAC',
    deletion: '#FDA4AF'
  },
  vibrantLight: {
    fg: '#1F2937',
    comment: '#6B7280',
    keyword: '#BE185D',
    type: '#0E7490',
    string: '#047857',
    number: '#C2410C',
    title: '#1D4ED8',
    attr: '#6D28D9',
    tag: '#BE123C',
    operator: '#475569',
    addition: '#15803D',
    deletion: '#B91C1C'
  },
  vercelDark: {
    fg: '#EDEDED',
    comment: '#737373',
    keyword: '#FF4D8D',
    type: '#52A8FF',
    string: '#62C073',
    number: '#EDEDED',
    title: '#BF7AF0',
    attr: '#52A8FF',
    tag: '#FF4D8D',
    operator: '#A1A1A1',
    addition: '#62C073',
    deletion: '#FF6166'
  },
  vercelLight: {
    fg: '#171717',
    comment: '#737373',
    keyword: '#D91B60',
    type: '#0068D6',
    string: '#117A37',
    number: '#171717',
    title: '#7928CA',
    attr: '#0068D6',
    tag: '#D91B60',
    operator: '#525252',
    addition: '#117A37',
    deletion: '#D93036'
  },
  emeraldDark: {
    fg: '#ECFDF5',
    comment: '#6B8B7E',
    keyword: '#3ECF8E',
    type: '#6EE7B7',
    string: '#A7F3D0',
    number: '#FDE68A',
    title: '#38BDF8',
    attr: '#5EEAD4',
    tag: '#3ECF8E',
    operator: '#86A89B',
    addition: '#3ECF8E',
    deletion: '#F87171'
  },
  emeraldLight: {
    fg: '#0F291E',
    comment: '#5E7C6E',
    keyword: '#059669',
    type: '#0D9488',
    string: '#047857',
    number: '#B45309',
    title: '#0284C7',
    attr: '#0F766E',
    tag: '#059669',
    operator: '#4B6B5D',
    addition: '#059669',
    deletion: '#DC2626'
  },
  glassDark: {
    fg: '#F8FAFC',
    comment: '#7B8CA8',
    keyword: '#F472B6',
    type: '#38BDF8',
    string: '#7DD3FC',
    number: '#FDE047',
    title: '#C084FC',
    attr: '#38BDF8',
    tag: '#F472B6',
    operator: '#94A3B8',
    addition: '#4ADE80',
    deletion: '#FB7185'
  },
  glassLight: {
    fg: '#0F172A',
    comment: '#64748B',
    keyword: '#DB2777',
    type: '#0284C7',
    string: '#0369A1',
    number: '#A16207',
    title: '#7C3AED',
    attr: '#0284C7',
    tag: '#DB2777',
    operator: '#475569',
    addition: '#16A34A',
    deletion: '#E11D48'
  },
  noirDark: {
    fg: '#F4F4F5',
    comment: '#71717A',
    keyword: '#FFFFFF',
    type: '#D4D4D8',
    string: '#A1A1AA',
    number: '#E4E4E7',
    title: '#FFFFFF',
    attr: '#D4D4D8',
    tag: '#FAFAFA',
    operator: '#71717A',
    addition: '#A1A1AA',
    deletion: '#71717A'
  },
  noirLight: {
    fg: '#18181B',
    comment: '#71717A',
    keyword: '#09090B',
    type: '#3F3F46',
    string: '#52525B',
    number: '#27272A',
    title: '#09090B',
    attr: '#3F3F46',
    tag: '#18181B',
    operator: '#71717A',
    addition: '#3F3F46',
    deletion: '#71717A'
  },
  warmDark: {
    fg: '#FAF5EE',
    comment: '#8E8275',
    keyword: '#F59E0B',
    type: '#FDBA74',
    string: '#D9F99D',
    number: '#FCA5A5',
    title: '#FCD34D',
    attr: '#FDE68A',
    tag: '#FB923C',
    operator: '#A89B8C',
    addition: '#BEF264',
    deletion: '#FCA5A5'
  },
  warmLight: {
    fg: '#292018',
    comment: '#7D6E5D',
    keyword: '#B45309',
    type: '#9A3412',
    string: '#3F6212',
    number: '#B91C1C',
    title: '#92400E',
    attr: '#78350F',
    tag: '#C2410C',
    operator: '#6B5D4D',
    addition: '#3F6212',
    deletion: '#B91C1C'
  },
  bitmapDark: {
    fg: '#F5F5F4',
    comment: '#78716C',
    keyword: '#FF5A5F',
    type: '#FFB400',
    string: '#00D1B2',
    number: '#FF8A5B',
    title: '#FFE66D',
    attr: '#4ECDC4',
    tag: '#FF5A5F',
    operator: '#A8A29E',
    addition: '#00D1B2',
    deletion: '#FF5A5F'
  },
  bitmapLight: {
    fg: '#1C1917',
    comment: '#78716C',
    keyword: '#D92638',
    type: '#B45309',
    string: '#0F766E',
    number: '#C2410C',
    title: '#9A3412',
    attr: '#0E7490',
    tag: '#D92638',
    operator: '#57534E',
    addition: '#0F766E',
    deletion: '#D92638'
  }
};

function buildTokens(p) {
  return {
    comment: { color: p.comment, italic: true },
    quote: { color: p.comment, italic: true },
    keyword: { color: p.keyword },
    selector_tag: { color: p.keyword },
    built_in: { color: p.type },
    type: { color: p.type },
    literal: { color: p.number },
    number: { color: p.number },
    string: { color: p.string },
    regexp: { color: p.string },
    symbol: { color: p.attr },
    title: { color: p.title },
    section: { color: p.title, bold: true },
    function: { color: p.title },
    attr: { color: p.attr },
    attribute: { color: p.attr },
    property: { color: p.attr },
    variable: { color: p.fg },
    params: { color: p.fg },
    meta: { color: p.attr },
    tag: { color: p.tag },
    name: { color: p.tag },
    operator: { color: p.operator },
    punctuation: { color: p.operator },
    addition: { color: p.addition },
    deletion: { color: p.deletion }
  };
}

const THEMES = {
  Breeze: {
    frameStyle: 'classic',
    gradient: ['#CF2F98', '#6A3DEC'],
    glow: '#FF7AD9',
    dark: {
      surface: '#111018',
      surfaceOpacity: 0.78,
      border: '#FFFFFF',
      borderOpacity: 0.22,
      innerRim: '#FFFFFF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.28,
      muted: '#A1A1AA',
      palette: PALETTES.vibrantDark
    },
    light: {
      surface: '#FFFFFF',
      surfaceOpacity: 0.84,
      border: '#FFFFFF',
      borderOpacity: 0.7,
      innerRim: '#FFFFFF',
      dotColor: '#18181B',
      dotOpacity: 0.22,
      muted: '#6B7280',
      palette: PALETTES.vibrantLight
    }
  },
  Blueprint: {
    frameStyle: 'blueprint',
    dark: {
      canvas: '#000000',
      grid: '#FFFFFF',
      gridOpacity: 0.12,
      crosshair: '#FFFFFF',
      crosshairOpacity: 0.45,
      surface: '#0A0A0A',
      surfaceOpacity: 0.96,
      border: '#FFFFFF',
      borderOpacity: 0.16,
      innerRim: '#FFFFFF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.24,
      muted: '#737373',
      palette: PALETTES.vercelDark
    },
    light: {
      canvas: '#FAFAFA',
      grid: '#000000',
      gridOpacity: 0.08,
      crosshair: '#000000',
      crosshairOpacity: 0.38,
      surface: '#FFFFFF',
      surfaceOpacity: 0.98,
      border: '#000000',
      borderOpacity: 0.12,
      innerRim: '#FFFFFF',
      dotColor: '#000000',
      dotOpacity: 0.18,
      muted: '#737373',
      palette: PALETTES.vercelLight
    }
  },
  Emerald: {
    frameStyle: 'emerald',
    dark: {
      canvas: '#090D0B',
      glow: '#3ECF8E',
      glowOpacity: 0.26,
      surface: '#111715',
      surfaceOpacity: 0.88,
      border: '#3ECF8E',
      borderOpacity: 0.34,
      innerRim: '#A7F3D0',
      dotColor: '#3ECF8E',
      dotOpacity: 0.35,
      muted: '#6B8B7E',
      palette: PALETTES.emeraldDark
    },
    light: {
      canvas: '#ECFDF5',
      glow: '#10B981',
      glowOpacity: 0.22,
      surface: '#FFFFFF',
      surfaceOpacity: 0.92,
      border: '#10B981',
      borderOpacity: 0.32,
      innerRim: '#FFFFFF',
      dotColor: '#059669',
      dotOpacity: 0.3,
      muted: '#5E7C6E',
      palette: PALETTES.emeraldLight
    }
  },
  Glass: {
    frameStyle: 'glass',
    gradient: ['#0EA5E9', '#6366F1', '#A855F7'],
    dark: {
      surface: '#0B1120',
      surfaceOpacity: 0.72,
      border: '#FFFFFF',
      borderOpacity: 0.28,
      innerRim: '#FFFFFF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.32,
      muted: '#94A3B8',
      palette: PALETTES.glassDark
    },
    light: {
      surface: '#FFFFFF',
      surfaceOpacity: 0.76,
      border: '#FFFFFF',
      borderOpacity: 0.85,
      innerRim: '#FFFFFF',
      dotColor: '#0F172A',
      dotOpacity: 0.22,
      muted: '#475569',
      palette: PALETTES.glassLight
    }
  },
  Bitmap: {
    frameStyle: 'bitmap',
    dark: {
      canvas: '#161413',
      dotPattern: '#FFFFFF',
      dotPatternOpacity: 0.14,
      shadow: '#000000',
      surface: '#1F1C1A',
      surfaceOpacity: 1,
      border: '#FF5A5F',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#FF5A5F',
      dotOpacity: 0.7,
      muted: '#A8A29E',
      palette: PALETTES.bitmapDark
    },
    light: {
      canvas: '#F5F2EB',
      dotPattern: '#1C1917',
      dotPatternOpacity: 0.14,
      shadow: '#1C1917',
      surface: '#FFFDF9',
      surfaceOpacity: 1,
      border: '#1C1917',
      borderOpacity: 0.85,
      innerRim: '#FFFFFF',
      dotColor: '#1C1917',
      dotOpacity: 0.55,
      muted: '#78716C',
      palette: PALETTES.bitmapLight
    }
  },
  Candy: {
    frameStyle: 'classic',
    gradient: ['#A58EFA', '#F472B6', '#FB923C'],
    glow: '#FBCFE8',
    dark: {
      surface: '#16111C',
      surfaceOpacity: 0.78,
      border: '#FFFFFF',
      borderOpacity: 0.24,
      innerRim: '#FFFFFF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.28,
      muted: '#B4A9C4',
      palette: PALETTES.vibrantDark
    },
    light: {
      surface: '#FFFFFF',
      surfaceOpacity: 0.84,
      border: '#FFFFFF',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#1F2937',
      dotOpacity: 0.22,
      muted: '#6B7280',
      palette: PALETTES.vibrantLight
    }
  },
  Crimson: {
    frameStyle: 'classic',
    gradient: ['#FF6363', '#A81C3E', '#4A0E23'],
    glow: '#FB7185',
    dark: {
      surface: '#170C10',
      surfaceOpacity: 0.8,
      border: '#FFFFFF',
      borderOpacity: 0.2,
      innerRim: '#FDA4AF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.26,
      muted: '#B89AA3',
      palette: PALETTES.vibrantDark
    },
    light: {
      surface: '#FFFDFD',
      surfaceOpacity: 0.88,
      border: '#FFFFFF',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#4A0E23',
      dotOpacity: 0.24,
      muted: '#7E5E68',
      palette: PALETTES.vibrantLight
    }
  },
  Midnight: {
    frameStyle: 'classic',
    gradient: ['#0F2027', '#203A43', '#2C5364'],
    glow: '#38BDF8',
    dark: {
      surface: '#0B1219',
      surfaceOpacity: 0.8,
      border: '#FFFFFF',
      borderOpacity: 0.18,
      innerRim: '#7DD3FC',
      dotColor: '#FFFFFF',
      dotOpacity: 0.26,
      muted: '#8DA2B5',
      palette: PALETTES.glassDark
    },
    light: {
      surface: '#F8FAFC',
      surfaceOpacity: 0.88,
      border: '#FFFFFF',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#0F172A',
      dotOpacity: 0.22,
      muted: '#64748B',
      palette: PALETTES.glassLight
    }
  },
  Sunset: {
    frameStyle: 'classic',
    gradient: ['#FFCF71', '#F97316', '#DB2777'],
    glow: '#FDE68A',
    dark: {
      surface: '#1A1114',
      surfaceOpacity: 0.8,
      border: '#FFFFFF',
      borderOpacity: 0.22,
      innerRim: '#FDE68A',
      dotColor: '#FFFFFF',
      dotOpacity: 0.28,
      muted: '#C2A8A0',
      palette: PALETTES.warmDark
    },
    light: {
      surface: '#FFFDF9',
      surfaceOpacity: 0.86,
      border: '#FFFFFF',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#431407',
      dotOpacity: 0.22,
      muted: '#7D6E5D',
      palette: PALETTES.warmLight
    }
  },
  Meadow: {
    frameStyle: 'classic',
    gradient: ['#59D499', '#14B8A6', '#0F766E'],
    glow: '#A7F3D0',
    dark: {
      surface: '#0D1715',
      surfaceOpacity: 0.8,
      border: '#FFFFFF',
      borderOpacity: 0.22,
      innerRim: '#A7F3D0',
      dotColor: '#FFFFFF',
      dotOpacity: 0.28,
      muted: '#84A89C',
      palette: PALETTES.emeraldDark
    },
    light: {
      surface: '#FFFFFF',
      surfaceOpacity: 0.86,
      border: '#FFFFFF',
      borderOpacity: 0.75,
      innerRim: '#FFFFFF',
      dotColor: '#0F291E',
      dotOpacity: 0.22,
      muted: '#5E7C6E',
      palette: PALETTES.emeraldLight
    }
  },
  Noir: {
    frameStyle: 'minimal',
    dark: {
      canvas: '#121214',
      vignette: '#27272A',
      surface: '#0A0A0C',
      surfaceOpacity: 0.92,
      border: '#FFFFFF',
      borderOpacity: 0.14,
      innerRim: '#FFFFFF',
      dotColor: '#FFFFFF',
      dotOpacity: 0.22,
      muted: '#71717A',
      palette: PALETTES.noirDark
    },
    light: {
      canvas: '#E4E4E7',
      vignette: '#F4F4F5',
      surface: '#FFFFFF',
      surfaceOpacity: 0.96,
      border: '#000000',
      borderOpacity: 0.1,
      innerRim: '#FFFFFF',
      dotColor: '#000000',
      dotOpacity: 0.18,
      muted: '#71717A',
      palette: PALETTES.noirLight
    }
  },
  Sand: {
    frameStyle: 'minimal',
    dark: {
      canvas: '#26201A',
      vignette: '#3F342A',
      surface: '#1A1511',
      surfaceOpacity: 0.9,
      border: '#E7D5C0',
      borderOpacity: 0.18,
      innerRim: '#FDE68A',
      dotColor: '#E7D5C0',
      dotOpacity: 0.28,
      muted: '#9C8C7B',
      palette: PALETTES.warmDark
    },
    light: {
      canvas: '#EAE0D2',
      vignette: '#F6EFE6',
      surface: '#FCF9F5',
      surfaceOpacity: 0.95,
      border: '#A8947C',
      borderOpacity: 0.28,
      innerRim: '#FFFFFF',
      dotColor: '#5C4B3B',
      dotOpacity: 0.25,
      muted: '#8A7968',
      palette: PALETTES.warmLight
    }
  }
};

function dedentAndNormalize(raw) {
  const lines = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '  ').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (!lines.length) return '';

  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^ */);
    if (match && match[0].length < minIndent) {
      minIndent = match[0].length;
    }
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) {
    return lines.join('\n');
  }
  return lines.map(line => line.slice(minIndent)).join('\n');
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveStyle(classStack, tokensMap, fallbackFg) {
  let color = fallbackFg;
  let italic = false;
  let bold = false;

  for (const cls of classStack) {
    const parts = cls.split(/\s+/);
    for (const part of parts) {
      const normalized = part.replace(/^hljs-/, '').replace(/-/g, '_');
      const base = normalized.split('_')[0];
      const spec = tokensMap[normalized] || tokensMap[base];
      if (spec) {
        if (spec.color) color = spec.color;
        if (spec.italic) italic = true;
        if (spec.bold) bold = true;
      }
    }
  }
  return { color, italic, bold };
}

function parseHighlightedLines(html, tokensMap, fallbackFg) {
  const lines = [[]];
  const classStack = [];
  const tagRegex = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[1] !== undefined) {
      classStack.push(match[1]);
    } else if (match[0] === '</span>') {
      classStack.pop();
    } else if (match[2] !== undefined) {
      const decoded = decodeHtmlEntities(match[2]);
      const style = resolveStyle(classStack, tokensMap, fallbackFg);
      const chunks = decoded.split('\n');
      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) lines.push([]);
        if (chunks[i].length > 0) {
          lines[lines.length - 1].push({ text: chunks[i], ...style });
        }
      }
    }
  }
  return lines;
}

function base64EncodeUtf8(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += i + 1 < bytes.length ? alphabet[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? alphabet[n & 63] : '=';
  }
  return out;
}

function detectLanguageHint(code) {
  const trimmed = code.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (_) {}
  }
  if (/\b(?:import\s+SwiftUI|import\s+Foundation|var\s+body\s*:\s*some\s+View|guard\s+let\b|if\s+let\b|@State\b|@Observable\b|struct\s+\w+\s*:\s*\w+)/.test(code)) {
    return 'swift';
  }
  if (/\b(?:fn\s+\w+\s*\(|let\s+mut\b|impl\s+\w+|pub\s+fn\b|println!\()/.test(code)) {
    return 'rust';
  }
  if (/\b(?:package\s+\w+|func\s+\(\w+\s+\*?\w+\)|fmt\.Print|:=)/.test(code)) {
    return 'go';
  }
  if (/^\s*(?:def\s+\w+\s*\(|async\s+def\s+|from\s+[\w.]+\s+import\b|if\s+__name__\s*==)/m.test(code)) {
    return 'python';
  }
  if (/\b(?:interface\s+\w+\s*\{|type\s+\w+\s*=|:\s*(?:string|number|boolean|Record<|Promise<))/.test(code)) {
    return 'typescript';
  }
  if (/^\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE)\b/im.test(code)) {
    return 'sql';
  }
  if (/^#!\/(?:usr\/bin\/env\s+)?(?:ba|z)?sh\b/m.test(trimmed)) {
    return 'bash';
  }
  return null;
}

function renderGradientStops(colors) {
  if (colors.length === 2) {
    return [
      `<stop offset="0%" stop-color="${colors[0]}"/>`,
      `<stop offset="100%" stop-color="${colors[1]}"/>`
    ];
  }
  return colors.map((c, idx) => {
    const pct = Math.round((idx / (colors.length - 1)) * 100);
    return `<stop offset="${pct}%" stop-color="${c}"/>`;
  });
}

function renderCodeSvg(code, options) {
  const themeName = THEMES[options.theme] ? options.theme : 'Breeze';
  const theme = THEMES[themeName];
  const isDark = options.darkMode !== 'false';
  const mode = isDark ? theme.dark : theme.light;
  const showBackground = options.background !== 'false';
  const showLineNumbers = options.lineNumbers === 'true';
  const parsedPadding = Number(options.padding);
  const outerPad = showBackground ? ([16, 32, 64, 128].includes(parsedPadding) ? parsedPadding : 64) : 0;

  const hinted = detectLanguageHint(code);
  const highlighted = hinted && LANGUAGES[hinted]
    ? hljs.highlight(code, { language: hinted })
    : hljs.highlightAuto(code);
  const detectedLang = highlighted.language || hinted || 'code';
  const tokensMap = buildTokens(mode.palette);
  const lines = parseHighlightedLines(highlighted.value, tokensMap, mode.palette.fg);

  const fontSize = 14;
  const lineHeight = 23.5;
  const charWidth = 8.43; // Menlo 14px exact monospace advance
  const codePadX = 24;
  const codePadTop = 14;
  const codePadBottom = 24;
  const headerHeight = 42;
  const windowRadius = theme.frameStyle === 'bitmap' ? 4 : theme.frameStyle === 'blueprint' ? 10 : 14;

  const lineNumDigits = String(lines.length).length;
  const gutterWidth = showLineNumbers ? Math.max(26, lineNumDigits * charWidth + 20) : 0;

  let maxLineLength = 0;
  for (const rawLine of code.split('\n')) {
    if (rawLine.length > maxLineLength) maxLineLength = rawLine.length;
  }

  const contentWidth = Math.ceil(gutterWidth + maxLineLength * charWidth);
  const windowWidth = Math.max(460, contentWidth + codePadX * 2 + 12);
  const windowHeight = headerHeight + codePadTop + codePadBottom + lines.length * lineHeight;

  const totalWidth = windowWidth + outerPad * 2;
  const totalHeight = windowHeight + outerPad * 2;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );

  parts.push('<defs>');
  if (showBackground) {
    if (theme.frameStyle === 'classic' || theme.frameStyle === 'glass') {
      parts.push(
        `<linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">`,
        ...renderGradientStops(theme.gradient),
        `</linearGradient>`
      );
      if (theme.glow) {
        parts.push(
          `<radialGradient id="ambient-glow" cx="20%" cy="15%" r="70%">`,
          `<stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.32"/>`,
          `<stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>`,
          `</radialGradient>`
        );
      }
    } else if (theme.frameStyle === 'emerald') {
      parts.push(
        `<radialGradient id="emerald-glow" cx="50%" cy="0%" r="85%">`,
        `<stop offset="0%" stop-color="${mode.glow}" stop-opacity="${mode.glowOpacity}"/>`,
        `<stop offset="100%" stop-color="${mode.canvas}" stop-opacity="0"/>`,
        `</radialGradient>`
      );
    } else if (theme.frameStyle === 'minimal') {
      parts.push(
        `<radialGradient id="minimal-vignette" cx="50%" cy="35%" r="80%">`,
        `<stop offset="0%" stop-color="${mode.vignette}"/>`,
        `<stop offset="100%" stop-color="${mode.canvas}"/>`,
        `</radialGradient>`
      );
    } else if (theme.frameStyle === 'bitmap') {
      parts.push(
        `<pattern id="dot-matrix" width="14" height="14" patternUnits="userSpaceOnUse">`,
        `<circle cx="2" cy="2" r="1.1" fill="${mode.dotPattern}" fill-opacity="${mode.dotPatternOpacity}"/>`,
        `</pattern>`
      );
    }
  }

  if (theme.frameStyle === 'glass') {
    parts.push(
      `<linearGradient id="glass-sheen" x1="0%" y1="0%" x2="100%" y2="100%">`,
      `<stop offset="0%" stop-color="#FFFFFF" stop-opacity="${isDark ? '0.14' : '0.45'}"/>`,
      `<stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.02"/>`,
      `<stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>`,
      `</linearGradient>`
    );
  }

  parts.push(
    `<clipPath id="window-clip"><rect x="${outerPad}" y="${outerPad}" width="${windowWidth}" height="${windowHeight}" rx="${windowRadius}" ry="${windowRadius}"/></clipPath>`,
    `<mask id="outside-window"><rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="white"/><rect x="${outerPad}" y="${outerPad}" width="${windowWidth}" height="${windowHeight}" rx="${windowRadius}" ry="${windowRadius}" fill="black"/></mask>`,
    `<filter id="card-shadow" x="-25%" y="-25%" width="150%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="18"/></filter>`
  );
  parts.push('</defs>');

  // 1. Backdrop layer
  if (showBackground) {
    if (theme.frameStyle === 'classic' || theme.frameStyle === 'glass') {
      parts.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#bg-grad)"/>`);
      if (theme.glow) {
        parts.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#ambient-glow)"/>`);
      }
    } else if (theme.frameStyle === 'blueprint') {
      parts.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${mode.canvas}"/>`);
      // Architectural hairline grid aligned to window edges
      const x0 = outerPad;
      const x1 = outerPad + windowWidth;
      const y0 = outerPad;
      const y1 = outerPad + windowHeight;
      const gStroke = `stroke="${mode.grid}" stroke-opacity="${mode.gridOpacity}" stroke-width="1"`;
      parts.push(
        `<line x1="${x0}" y1="0" x2="${x0}" y2="${totalHeight}" ${gStroke}/>`,
        `<line x1="${x1}" y1="0" x2="${x1}" y2="${totalHeight}" ${gStroke}/>`,
        `<line x1="0" y1="${y0}" x2="${totalWidth}" y2="${y0}" ${gStroke}/>`,
        `<line x1="0" y1="${y1}" x2="${totalWidth}" y2="${y1}" ${gStroke}/>`
      );
    } else if (theme.frameStyle === 'emerald') {
      parts.push(
        `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${mode.canvas}"/>`,
        `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#emerald-glow)"/>`
      );
    } else if (theme.frameStyle === 'bitmap') {
      parts.push(
        `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${mode.canvas}"/>`,
        `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#dot-matrix)"/>`
      );
    } else if (theme.frameStyle === 'minimal') {
      parts.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#minimal-vignette)"/>`);
    }

    // Shadow layer masked strictly outside the window so frosted glass stays uniform
    if (theme.frameStyle === 'bitmap') {
      parts.push(
        `<rect x="${outerPad + 8}" y="${outerPad + 8}" width="${windowWidth}" height="${windowHeight}" rx="${windowRadius}" fill="${mode.shadow}" fill-opacity="${isDark ? '0.65' : '0.85'}" mask="url(#outside-window)"/>`
      );
    } else if (theme.frameStyle !== 'blueprint') {
      parts.push(
        `<g mask="url(#outside-window)">`,
        `<rect x="${outerPad + 4}" y="${outerPad + 16}" width="${windowWidth - 8}" height="${windowHeight - 4}" rx="${windowRadius}" fill="#000000" fill-opacity="${isDark ? '0.45' : '0.24'}" filter="url(#card-shadow)"/>`,
        `</g>`
      );
    }
  }

  // 2. Window card body
  parts.push(`<g clip-path="url(#window-clip)">`);
  parts.push(
    `<rect x="${outerPad}" y="${outerPad}" width="${windowWidth}" height="${windowHeight}" fill="${mode.surface}" fill-opacity="${showBackground ? mode.surfaceOpacity : 1}"/>`
  );

  // Subtle diagonal glass sheen for Glass theme
  if (theme.frameStyle === 'glass') {
    parts.push(
      `<polygon points="${outerPad},${outerPad} ${outerPad + windowWidth * 0.65},${outerPad} ${outerPad + windowWidth * 0.35},${outerPad + windowHeight} ${outerPad},${outerPad + windowHeight}" fill="url(#glass-sheen)"/>`
    );
  }

  // Subtle top inner highlight line (Ray.so frosted glass rim)
  parts.push(
    `<line x1="${outerPad}" y1="${outerPad + 0.75}" x2="${outerPad + windowWidth}" y2="${outerPad + 0.75}" stroke="${mode.innerRim}" stroke-opacity="${isDark ? '0.22' : '0.65'}" stroke-width="1"/>`
  );

  // Header controls: Ray.so muted translucent dots + centered title
  const dotY = outerPad + headerHeight / 2;
  const dotStartX = outerPad + 20;
  const dotRadius = theme.frameStyle === 'bitmap' ? 4.5 : 5.5;
  parts.push(
    `<circle cx="${dotStartX}" cy="${dotY}" r="${dotRadius}" fill="${mode.dotColor}" fill-opacity="${mode.dotOpacity}"/>`,
    `<circle cx="${dotStartX + 19}" cy="${dotY}" r="${dotRadius}" fill="${mode.dotColor}" fill-opacity="${mode.dotOpacity}"/>`,
    `<circle cx="${dotStartX + 38}" cy="${dotY}" r="${dotRadius}" fill="${mode.dotColor}" fill-opacity="${mode.dotOpacity}"/>`
  );

  const customTitle = (options.title || '').trim();
  const headerTitle = escapeXml(customTitle || detectedLang);
  parts.push(
    `<text x="${outerPad + windowWidth / 2}" y="${dotY + 4}" text-anchor="middle" font-family="Helvetica Neue" font-size="12" font-weight="500" fill="${mode.muted}">${headerTitle}</text>`
  );

  // 3. Code lines — exact Menlo monospace positioning for CoreSVG fidelity
  const codeStartX = outerPad + codePadX + gutterWidth;
  const lineNumX = outerPad + codePadX + gutterWidth - 18;
  const firstBaselineY = outerPad + headerHeight + codePadTop + fontSize;

  parts.push(`<g font-family="Menlo" font-size="${fontSize}">`);

  for (let i = 0; i < lines.length; i++) {
    const y = firstBaselineY + i * lineHeight;
    if (showLineNumbers) {
      parts.push(
        `<text x="${lineNumX.toFixed(1)}" y="${y}" text-anchor="end" fill="${mode.muted}" fill-opacity="0.55">${i + 1}</text>`
      );
    }
    const tokens = lines[i];
    if (tokens.length === 0) continue;

    let col = 0;
    for (const token of tokens) {
      const text = token.text;
      let startOffset = 0;
      while (startOffset < text.length && text[startOffset] === ' ') {
        startOffset++;
      }
      col += startOffset;
      const visible = text.slice(startOffset);
      if (visible.length > 0) {
        const x = codeStartX + col * charWidth;
        const attrs = [
          `x="${x.toFixed(2)}"`,
          `y="${y}"`,
          `fill="${token.color}"`
        ];
        if (token.italic) attrs.push('font-style="italic"');
        if (token.bold) attrs.push('font-weight="bold"');
        const safeText = escapeXml(visible).replace(/ /g, '&#160;');
        parts.push(`<text ${attrs.join(' ')}>${safeText}</text>`);
      }
      col += visible.length;
    }
  }

  parts.push('</g>');
  parts.push('</g>');

  // 4. Outer crisp border
  const borderWidth = theme.frameStyle === 'bitmap' ? 1.5 : 1;
  parts.push(
    `<rect x="${outerPad + 0.5}" y="${outerPad + 0.5}" width="${windowWidth - 1}" height="${windowHeight - 1}" rx="${windowRadius}" ry="${windowRadius}" fill="none" stroke="${mode.border}" stroke-opacity="${mode.borderOpacity}" stroke-width="${borderWidth}"/>`
  );

  // Blueprint corner '+' registration crosshairs
  if (showBackground && theme.frameStyle === 'blueprint') {
    const corners = [
      [outerPad, outerPad],
      [outerPad + windowWidth, outerPad],
      [outerPad, outerPad + windowHeight],
      [outerPad + windowWidth, outerPad + windowHeight]
    ];
    const cStroke = `stroke="${mode.crosshair}" stroke-opacity="${mode.crosshairOpacity}" stroke-width="1"`;
    const arm = 6;
    for (const [cx, cy] of corners) {
      parts.push(
        `<line x1="${cx - arm}" y1="${cy}" x2="${cx + arm}" y2="${cy}" ${cStroke}/>`,
        `<line x1="${cx}" y1="${cy - arm}" x2="${cx}" y2="${cy + arm}" ${cStroke}/>`
      );
    }
  }

  parts.push('</svg>');

  return { svg: parts.join('\n'), language: detectedLang };
}

function action(selection, options) {
  const cleaned = dedentAndNormalize(String(selection || ''));
  if (!cleaned) {
    openclip.toast('Select some code first.', 'error');
    return;
  }

  const { svg, language } = renderCodeSvg(cleaned, options || {});
  const safeLang = language.replace(/[^a-z0-9_-]/gi, '') || 'code';
  openclip.file({
    data: base64EncodeUtf8(svg),
    filename: `code-image-${safeLang}.svg`,
    mimeType: 'image/svg+xml'
  });
}

module.exports = action;
