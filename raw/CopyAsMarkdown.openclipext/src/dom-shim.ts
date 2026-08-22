// DOM shim for non-browser JS runtimes (OpenClip's JavaScriptCore host, Node tests).
//
// polyfills must be imported BEFORE linkedom: ESM imports evaluate in order, and
// linkedom's module body (via htmlparser2/entities) base64-decodes at init time,
// which requires the `atob` shim to already be installed.
//
// Turndown reads `window.DOMParser` once at module-evaluation time to pick its HTML
// parsing strategy, so this shim must be imported BEFORE turndown. With linkedom's
// DOMParser visible under `window`, Turndown takes its native-parser path; without it,
// it falls back to `document.implementation.createHTMLDocument`, which linkedom does
// not implement.
import "./polyfills";
import { DOMParser, parseHTML } from "linkedom";

const globalWithDOM = globalThis as unknown as Record<string, unknown>;

if (!globalWithDOM.window) {
  globalWithDOM.window = globalWithDOM;
}
const windowRef = globalWithDOM.window as unknown as Record<string, unknown>;
if (!windowRef.document) {
  const { document } = parseHTML("<html><body></body></html>");
  windowRef.document = document;
}
if (!windowRef.DOMParser) {
  windowRef.DOMParser = DOMParser;
}
