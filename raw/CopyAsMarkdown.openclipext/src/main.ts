// OpenClip Copy as Markdown entry point.
//
// Converts the source selection's HTML to Markdown using Turndown. The OpenClip
// host supplies openclip.input.html (normalized to HTML from RTF when the source
// app copies only RTF) and openclip.input.text (plain-text fallback).
// dom-shim must be the first import: it installs window/document/DOMParser before
// turndown's module body snapshots them.
import "./dom-shim";
import TurndownService from "turndown";

type Options = Record<string, string>;

const headingStyle = (options: Options) =>
  options.headingStyle === "setext" ? "setext" : "atx";

const bulletListMarker = (options: Options) =>
  options.bulletListMarker === "-" || options.bulletListMarker === "+"
    ? options.bulletListMarker
    : "*";

const emDelimiter = (options: Options) =>
  options.emDelimiter === "_" ? "_" : "*";

const strongDelimiter = (options: Options) =>
  options.strongDelimiter === "__" ? "__" : "**";

const linkStyle = (options: Options) =>
  options.linkStyle === "referenced" ? "referenced" : "inlined";

const toMarkdown = (html: string, options: Options): string => {
  const service = new TurndownService({
    headingStyle: headingStyle(options),
    bulletListMarker: bulletListMarker(options),
    emDelimiter: emDelimiter(options),
    strongDelimiter: strongDelimiter(options),
    linkStyle: linkStyle(options),
    codeBlockStyle: "fenced",
  });

  service.addRule("strikethrough", {
    filter: ["del", "s", "strike"],
    replacement: (content: string) => `~~${content}~~`,
  });

  return service.turndown(html).trim();
};

export const action = (selection: string, options: Options): void => {
  const html = openclip.input.html;
  const text = openclip.input.text;

  const markdown = html && html.trim().length > 0
    ? toMarkdown(html, options)
    : text;

  openclip.copy(markdown.length > 0 ? markdown : text);
};
