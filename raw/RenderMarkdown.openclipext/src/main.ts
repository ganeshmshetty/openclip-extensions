// OpenClip Render Markdown entry point.
//
// Inverse of Copy as Markdown: interprets the selected text as Markdown source,
// converts it to HTML with marked, and rich-pastes the rendered result so any
// rich-text target (Mail, Notes, Pages, webmails) receives formatted content.
// A secondary click derives a rich copy via the delivery pipeline.

import { marked } from "marked";

export const action = (selection: string): void => {
  if (!selection || selection.trim().length === 0) return;

  const rendered = marked.parse(selection, { async: false });
  if (typeof rendered !== "string" || rendered.trim().length === 0) {
    openclip.paste(selection);
    return;
  }

  openclip.pasteContent({
    "public.html": rendered,
    "public.utf8-plain-text": selection,
  });
};
