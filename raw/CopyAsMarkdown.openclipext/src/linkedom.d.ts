declare module "linkedom" {
  export function parseHTML(html: string): { document: Document };
  export const DOMParser: typeof globalThis.DOMParser;
}
