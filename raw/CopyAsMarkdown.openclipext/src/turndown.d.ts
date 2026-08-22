declare module "turndown" {
  interface Options {
    headingStyle?: "setext" | "atx";
    bulletListMarker?: "-" | "+" | "*";
    emDelimiter?: "_" | "*";
    strongDelimiter?: "**" | "__";
    linkStyle?: "inlined" | "referenced";
    codeBlockStyle?: "indented" | "fenced";
    [key: string]: unknown;
  }

  interface Rule {
    filter: string | string[] | ((node: unknown) => boolean);
    replacement: (content: string, node: unknown, options: unknown) => string;
  }

  class TurndownService {
    constructor(options?: Options);
    addRule(key: string, rule: Rule): void;
    turndown(html: string): string;
  }

  export = TurndownService;
}
