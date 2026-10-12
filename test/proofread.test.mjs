// Mock harness for raw/Proofread.openclipext/main.js (not shipped in the package).
// Run: node test/proofread.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const SRC = fs.readFileSync(new URL("../raw/Proofread.openclipext/main.js", import.meta.url), "utf8");

const okResp = (text) => ({
  ok: true, status: 200,
  json: async () => ({ stop_reason: "end_turn", content: [{ type: "thinking", thinking: "…" }, { type: "text", text }] }),
});
const errResp = (status, message) => ({
  ok: false, status,
  json: async () => ({ type: "error", error: { message } }),
});

async function run({ text, options = {}, secondary = false, responses = [] }) {
  const calls = [];
  const queue = [...responses];
  globalThis.openclip = {
    input: { text, isSecondaryClick: secondary },
    options: { baseURL: "http://127.0.0.1:3425", customPrompt: "", apiKey: "magpie", model: "claude-haiku-5-5",
               thinking: true, effort: "low", maxTokens: "4000", ...options },
    option(id) { return this.options[id]; },
    i18n: (d) => d["zh-Hans"] || d.en,
    fetch: async (url, o) => {
      calls.push({ url, headers: o.headers, body: JSON.parse(o.body) });
      const r = queue.shift();
      if (r instanceof Error) throw r;
      return r;
    },
  };
  const action = new Function(SRC + "; return action;")();
  try { return { result: await action(text), calls }; }
  catch (e) { return { error: e.message, calls }; }
}

const tests = {
  "defaults: adaptive + low + 4000, key in header": async () => {
    const r = await run({ text: " teh ", responses: [okResp("the")] });
    assert.equal(r.result, " the ");
    const b = r.calls[0].body;
    assert.deepEqual(b.thinking, { type: "adaptive" });
    assert.deepEqual(b.output_config, { effort: "low" });
    assert.equal(b.max_tokens, 4000);
    assert.equal(r.calls[0].headers["x-api-key"], "magpie");
    assert.match(b.system, /copy editor/);
  },
  "secondary click uses fix-only prompt": async () => {
    const r = await run({ text: "teh", secondary: true, responses: [okResp("the")] });
    assert.match(r.calls[0].body.system, /proofreader/);
  },
  "thinking off → disabled (Haiku)": async () => {
    const r = await run({ text: "x", options: { thinking: false }, responses: [okResp("x")] });
    assert.deepEqual(r.calls[0].body.thinking, { type: "disabled" });
  },
  "thinking off → between_tools (Sonnet 5.5, gateway prefix)": async () => {
    const r = await run({ text: "x", options: { thinking: "false", model: "anthropic/claude-sonnet-5-5" }, responses: [okResp("x")] });
    assert.deepEqual(r.calls[0].body.thinking, { type: "between_tools" });
  },
  "effort 'model default' sends no output_config": async () => {
    const r = await run({ text: "x", options: { effort: "model default" }, responses: [okResp("x")] });
    assert.equal(r.calls[0].body.output_config, undefined);
  },
  "non-Claude model gets no thinking/effort": async () => {
    const r = await run({ text: "x", options: { model: "group/auto-glm-5-3-flash" }, responses: [okResp("x")] });
    assert.equal(r.calls[0].body.thinking, undefined);
    assert.equal(r.calls[0].body.output_config, undefined);
  },
  "400 about thinking → one retry without thinking": async () => {
    const r = await run({ text: "x", options: { thinking: false, model: "claude-opus-5-5" },
      responses: [errResp(400, "thinking.type disabled is not supported for this model"), okResp("y")] });
    assert.equal(r.result, "y");
    assert.equal(r.calls.length, 2);
    assert.equal(r.calls[1].body.thinking, undefined);
    assert.deepEqual(r.calls[1].body.output_config, { effort: "low" });
  },
  "400 unrelated → no retry, error surfaced": async () => {
    const r = await run({ text: "x", responses: [errResp(400, "model not found")] });
    assert.equal(r.calls.length, 1);
    assert.match(r.error, /API 400: model not found/);
  },
  "custom budget raises char limit; invalid budget falls back": async () => {
    let r = await run({ text: "a".repeat(5000), options: { maxTokens: "8000" }, responses: [okResp("a")] });
    assert.equal(r.calls[0].body.max_tokens, 8000);
    r = await run({ text: "a".repeat(3001), options: { maxTokens: "abc" } });
    assert.match(r.error, /上限 3000/);
    assert.equal(r.calls.length, 0);
  },
  "truncation, 401, network, non-JSON": async () => {
    let r = await run({ text: "x", responses: [{ ok: true, status: 200, json: async () => ({ stop_reason: "max_tokens", content: [] }) }] });
    assert.match(r.error, /4000 token 预算/);
    r = await run({ text: "x", responses: [errResp(401, "invalid x-api-key")] });
    assert.match(r.error, /401 API key 无效/);
    r = await run({ text: "x", responses: [new Error("Fetch failed: Could not connect to the server.")] });
    assert.match(r.error, /连不上接口/);
    r = await run({ text: "x", responses: [new Error("Destination not allowed: http://127.0.0.1:80/v1/messages")] });
    assert.match(r.error, /拒绝了这个地址/);
    r = await run({ text: "x", responses: [{ ok: true, status: 200, json: async () => { throw new SyntaxError(); } }] });
    assert.match(r.error, /不是 JSON/);
  },
  "Base URL normalization": async () => {
    const cases = {
      "http://127.0.0.1:3425": "http://127.0.0.1:3425/v1/messages",
      "http://127.0.0.1:3425/": "http://127.0.0.1:3425/v1/messages",
      "https://api.anthropic.com/v1": "https://api.anthropic.com/v1/messages",
      "https://api.anthropic.com/v1/": "https://api.anthropic.com/v1/messages",
      "https://api.anthropic.com/v1/messages": "https://api.anthropic.com/v1/messages",
      "https://gw.example.com/proxy/anthropic": "https://gw.example.com/proxy/anthropic/v1/messages",
      "  https://api.anthropic.com  ": "https://api.anthropic.com/v1/messages",
    };
    for (const [input, expected] of Object.entries(cases)) {
      const r = await run({ text: "x", options: { baseURL: input }, responses: [okResp("x")] });
      assert.equal(r.calls[0].url, expected, input);
    }
  },
  "custom prompt: instruction then selection, custom system": async () => {
    const r = await run({ text: "Good morning", options: { customPrompt: "翻译成日语" }, responses: [okResp("おはようございます")] });
    assert.equal(r.result, "おはようございます");
    const b = r.calls[0].body;
    assert.equal(b.messages[0].content, "翻译成日语\n\nGood morning");
    assert.match(b.system, /Carry out the user's instruction/);
  },
  "custom prompt ignored on secondary click (fix-only)": async () => {
    const r = await run({ text: "teh", secondary: true, options: { customPrompt: "翻译成日语" }, responses: [okResp("the")] });
    assert.match(r.calls[0].body.system, /proofreader/);
    assert.match(r.calls[0].body.messages[0].content, /^<text>/);
  },
  "whitespace-only custom prompt falls back to polish": async () => {
    const r = await run({ text: "x", options: { customPrompt: "   " }, responses: [okResp("x")] });
    assert.match(r.calls[0].body.system, /copy editor/);
  },
  "strips inline <think> tags": async () => {
    const r = await run({ text: "x", responses: [okResp("<think>hmm</think>Fixed.")] });
    assert.equal(r.result, "Fixed.");
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { await fn(); console.log("✓", name); }
  catch (e) { failed++; console.log("✗", name, "\n   ", e.message); }
}
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
