// openclip.d.ts — Ambient type declarations for OpenClip JS extension authoring.
// The runtime does NOT consume this file; it exists so editors and `tsc --noEmit` understand
// the `openclip.*` bridge and the entry signature. Includes the rich-pasteboard surface
// (pasteContent/copyContent) introduced with multi-type clipboard support.

interface OpenClipApp {
  bundleID: string;
  name: string;
}

interface OpenClipInput {
  text: string;
  html: string;
  rtf: string;
  matchedText: string;
  captures: string[];
  app: OpenClipApp;
  isSecondaryClick: boolean;
}

type OpenClipOptionValue = string | boolean;

interface OpenClipOptions {
  [identifier: string]: OpenClipOptionValue;
}

/** Multi-type clipboard payload; every field is optional, at least one should be present. */
interface OpenClipRichPayload {
  "public.utf8-plain-text"?: string;
  text?: string;
  "public.html"?: string;
  html?: string;
  "public.rtf"?: string;
  rtf?: string;
}

interface OpenClipBridge {
  readonly input: OpenClipInput;
  readonly options: OpenClipOptions;
  option(id: string): OpenClipOptionValue | undefined;
  paste(text: string): void;
  copy(text: string): void;
  cut(): void;
  /** Rich multi-type paste (plain text / HTML / RTF). */
  pasteContent(payload: OpenClipRichPayload): void;
  /** Rich multi-type copy (plain text / HTML / RTF). */
  copyContent(payload: OpenClipRichPayload): void;
  openURL(url: string): void;
  keyPress(key: string, modifiers?: string[]): void;
}

declare const openclip: OpenClipBridge;

type OpenClipAction = (selection: string, options: OpenClipOptions) => string | void | Promise<string | void>;
