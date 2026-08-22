// openclip.d.ts — Ambient type declarations for OpenClip JS extension authoring.
// The runtime does NOT consume this file; it exists so editors and `tsc --noEmit` understand
// the `openclip.*` bridge and the entry signature.

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

interface OpenClipBridge {
  readonly input: OpenClipInput;
  readonly options: OpenClipOptions;
  option(id: string): OpenClipOptionValue | undefined;
  paste(text: string): void;
  copy(text: string): void;
  cut(): void;
  openURL(url: string): void;
  keyPress(key: string, modifiers?: string[]): void;
}

declare const openclip: OpenClipBridge;

type OpenClipAction = (selection: string, options: OpenClipOptions) => string | void | Promise<string | void>;
