// Base runtime shims for OpenClip's JavaScriptCore host. Must be the FIRST
// import of the bundle: JavaScriptCore exposes neither `atob` nor Node's
// `Buffer`, and linkedom's entity decoder base64-decodes its trie during module
// init — without `atob` visible it reaches for `Buffer.from`, which throws a
// ReferenceError ("Can't find variable: Buffer") in this host.
const globalRef = globalThis as unknown as Record<string, unknown>;

if (typeof globalRef.atob !== "function") {
  const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  globalRef.atob = (input: string): string => {
    let out = "";
    let acc = 0;
    let bits = 0;
    for (let i = 0; i < input.length; i++) {
      const v = BASE64.indexOf(input[i]);
      if (v < 0) continue;
      acc = (acc << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out += String.fromCharCode((acc >> bits) & 0xff);
      }
    }
    return out;
  };
}
