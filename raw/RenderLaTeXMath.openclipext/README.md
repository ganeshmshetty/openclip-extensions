# Render LaTeX Math

Render a selected LaTeX **math expression** with [KaTeX](https://katex.org/). Rendering happens entirely on your Mac, with no account, API key, or network connection required.

**Math only.** KaTeX renders math expressions, not full LaTeX documents. `\documentclass`, `\usepackage`, TikZ, and other document features are not supported.

Select an expression, open OpenClip, and choose **Render LaTeX Math**. The result card shows the rendered math as a self-contained HTML file you can preview, copy, save, or open. Right-click or Shift-click the action to copy the file immediately.

The selection can be bare math or wrapped in `$…$`, `$$…$$`, `\(…\)`, or `\[…\]`. Bare math and `$$`/`\[` render in display style; `$` and `\(` render inline. Invalid input shows KaTeX's error message instead of producing a file.

Try selecting:

```latex
\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}
```

The action appears only when the selection looks like math (a LaTeX command such as `\frac{`, a superscript like `x^2`, `_{`, or math delimiters).

Requires **OpenClip 1.7.0 or later**. KaTeX and the fonts it needs are bundled; only the fonts used by an expression are embedded in the output.

Powered by KaTeX, distributed under the MIT license. Its license notice is included in the package. The icon is Lucide's `sigma` (ISC license).
