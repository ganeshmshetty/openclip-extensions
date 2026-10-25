// OpenClip's JavaScriptCore host only provides console.log. KaTeX calls console.warn for
// characters it has no metrics for, so fill in missing methods without replacing real ones.
const root = typeof globalThis !== 'undefined' ? globalThis : Function('return this')();
if (typeof root.console !== 'object' || root.console === null) root.console = {};
const log = typeof root.console.log === 'function' ? root.console.log.bind(root.console) : () => {};
for (const name of ['log', 'info', 'warn', 'error', 'debug']) {
  if (typeof root.console[name] !== 'function') root.console[name] = name === 'log' ? log : () => {};
}
