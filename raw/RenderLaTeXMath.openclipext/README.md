# Render LaTeX Math

Render a selected LaTeX **math expression** as an SVG image with [MathJax](https://www.mathjax.org/). Rendering happens entirely on your Mac, with no account, API key, or network connection required.

**Math only.** It renders math expressions, not full LaTeX documents. `\documentclass`, `\usepackage`, TikZ, and other document features are not supported.

Select an expression, open OpenClip, and choose **Render LaTeX Math**. The result card shows the rendered math as an SVG image you can preview, copy, save, or open. Right-click or Shift-click the action to copy the image immediately. Glyphs are drawn as vector paths, so the image needs no fonts and stays sharp at any size.

The selection can be bare math or wrapped in `$…$`, `$$…$$`, `\(…\)`, or `\[…\]`. Bare math and `$$`/`\[` render in display style; `$` and `\(` render inline. Invalid input shows MathJax's error message instead of producing a file.

In the action's settings, choose:

| Setting | Choices | Default |
| --- | --- | --- |
| Size | Small (20 px), Medium (28 px), Large (40 px) font size | Medium |
| Theme | System, Light (black on white), Dark (light on #1e1e1e) | System |
| Math without delimiters | Display, Inline | Display |
| Custom macros | e.g. `\R = \mathbb{R}; \N: \mathbb{N}` | none |

System produces a light image whose colors switch to dark in apps that honor the SVG's dark-mode style (such as browsers); image viewers that ignore it show it light. Explicit delimiters always win over the "Math without delimiters" setting. Separate macros with `;` (or new lines); each is `\name = expansion` or `\name: expansion`. Malformed entries are skipped.

Try selecting:

```latex
\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}
```

The action appears only when the selection looks like math (a LaTeX command such as `\frac{`, a superscript like `x^2`, `_{`, or math delimiters).

Requires **OpenClip 1.7.0 or later**. MathJax is bundled; no network or extra tools are needed. Accented letters inside `\text{}` are drawn from MathJax's fonts; characters MathJax has no glyph for (for example CJK or emoji) fall back to a system font in the image.

Powered by MathJax and mhchemparser, distributed under the Apache License 2.0. Their license notice is included in the package. The icon is Lucide's `sigma` (ISC license).
