// Exercises main.js against a mocked `openclip` bridge.
// Run: node raw/AppwriteFunctionRunner.openclipext/test/run.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const EXECUTION = (overrides = {}) => ({
  $id: 'exec1',
  status: 'completed',
  responseStatusCode: 200,
  responseBody: '',
  errors: '',
  logs: '',
  duration: 0.42,
  ...overrides,
});

function response(status, body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return { status, ok: status >= 200 && status < 300, text: () => text, json: () => JSON.parse(text) };
}

// Build a fresh bridge per scenario; returns the bridge plus a recorder of everything the script did.
function bridge({ text = 'hello world', secondary = false, options = {}, fetch } = {}) {
  const calls = { toasts: [], copies: [], config: [], fetches: [] };
  const opts = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: 'proj',
    functionId: 'fn',
    apiKey: '',
    payload: 'json',
    ...options,
  };
  globalThis.openclip = {
    input: { text, isSecondaryClick: secondary, app: { bundleID: 'com.apple.Notes' } },
    options: opts,
    option: (id) => opts[id] ?? '',
    toast: (message, style) => calls.toasts.push({ message, style }),
    copy: (value) => calls.copies.push(value),
    requireConfiguration: (req) => calls.config.push(req),
    fetch: async (url, init) => {
      calls.fetches.push({ url, init });
      return fetch(url, init);
    },
  };
  return calls;
}

function loadAction() {
  const file = path.join(here, '..', 'main.js');
  delete require.cache[require.resolve(file)];
  return require(file);
}

const scenarios = [];
const scenario = (name, fn) => scenarios.push({ name, fn });

scenario('plain-text reply is returned as text', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ responseBody: 'Hello World' })) });
  const out = await loadAction()('hello world');
  assert.equal(out, 'Hello World');
  assert.deepEqual(calls.toasts, []);
  assert.deepEqual(calls.copies, []);
});

scenario('request shape: URL, headers, execution body, JSON contract', async () => {
  const calls = bridge({
    options: { endpoint: 'https://fra.cloud.appwrite.io/v1/', apiKey: 'secret-key' },
    fetch: async () => response(201, EXECUTION({ responseBody: 'ok' })),
  });
  await loadAction()('hello world');
  const { url, init } = calls.fetches[0];
  assert.equal(url, 'https://fra.cloud.appwrite.io/v1/functions/fn/executions');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['X-Appwrite-Project'], 'proj');
  assert.equal(init.headers['X-Appwrite-Key'], 'secret-key');
  assert.equal(init.headers['X-Appwrite-Response-Format'], '2.0.0');
  const execution = JSON.parse(init.body);
  assert.equal(execution.async, false);
  assert.equal(execution.method, 'POST');
  assert.equal(execution.path, '/');
  assert.equal(execution.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(execution.body), { version: 1, source: 'openclip', text: 'hello world', secondary: false });
});

scenario('no API key → no X-Appwrite-Key header', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ responseBody: 'ok' })) });
  await loadAction()('x');
  assert.equal('X-Appwrite-Key' in calls.fetches[0].init.headers, false);
});

scenario('endpoint without /v1 or scheme is normalised', async () => {
  const calls = bridge({ options: { endpoint: 'appwrite.example.com' }, fetch: async () => response(201, EXECUTION({ responseBody: 'ok' })) });
  await loadAction()('x');
  assert.equal(calls.fetches[0].url, 'https://appwrite.example.com/v1/functions/fn/executions');
});

scenario('raw payload mode sends the bare selection as text/plain', async () => {
  const calls = bridge({ options: { payload: 'raw' }, fetch: async () => response(201, EXECUTION({ responseBody: 'ok' })) });
  await loadAction()('raw text here');
  const execution = JSON.parse(calls.fetches[0].init.body);
  assert.equal(execution.body, 'raw text here');
  assert.equal(execution.headers['content-type'], 'text/plain; charset=utf-8');
});

scenario('JSON { text } reply uses text', async () => {
  bridge({ fetch: async () => response(201, EXECUTION({ responseBody: JSON.stringify({ text: 'From JSON' }) })) });
  assert.equal(await loadAction()('x'), 'From JSON');
});

scenario('JSON { error } reply → error toast, nothing returned', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ responseBody: JSON.stringify({ error: 'Nothing selected\nmore detail' }), responseStatusCode: 400 })) });
  assert.equal(await loadAction()('x'), undefined);
  assert.deepEqual(calls.toasts, [{ message: 'Nothing selected', style: 'error' }]);
});

scenario('non-2xx function status with plain body → error toast', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ responseStatusCode: 500, responseBody: 'boom\nstack' })) });
  assert.equal(await loadAction()('x'), undefined);
  assert.deepEqual(calls.toasts, [{ message: 'Function returned HTTP 500: boom', style: 'error' }]);
});

scenario('failed execution with errors (API key) → first line of errors', async () => {
  const calls = bridge({ options: { apiKey: 'k' }, fetch: async () => response(201, EXECUTION({ status: 'failed', errors: 'TypeError: x is not a function\n    at main.js:3' })) });
  await loadAction()('x');
  assert.deepEqual(calls.toasts, [{ message: 'Function failed: TypeError: x is not a function', style: 'error' }]);
});

scenario('failed execution without key → hint to add a key', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ status: 'failed' })) });
  await loadAction()('x');
  assert.equal(calls.toasts.length, 1);
  assert.equal(calls.toasts[0].style, 'error');
  assert.match(calls.toasts[0].message, /Add an API key/);
});

scenario('401 → permission hint', async () => {
  const calls = bridge({ fetch: async () => response(401, { message: 'The current user is not authorized to perform the requested action.', code: 401, type: 'user_unauthorized' }) });
  await loadAction()('x');
  assert.match(calls.toasts[0].message, /Check the API key, or set the function’s execute access to Any/);
});

scenario('404 project_not_found → region hint', async () => {
  const calls = bridge({ fetch: async () => response(404, { message: 'Project with the requested ID could not be found.', code: 404, type: 'project_not_found' }) });
  await loadAction()('x');
  assert.equal(calls.toasts[0].message, 'Project not found at cloud.appwrite.io. Check the project ID and the region in the endpoint.');
});

scenario('404 function_not_found → function hint', async () => {
  const calls = bridge({ fetch: async () => response(404, { message: 'Function with the requested ID could not be found.', code: 404, type: 'function_not_found' }) });
  await loadAction()('x');
  assert.match(calls.toasts[0].message, /Function not found in this project/);
});

scenario('synchronous timeout → 30 s hint', async () => {
  const calls = bridge({ fetch: async () => response(408, { message: 'Synchronous function execution timed out.', code: 408, type: 'function_synchronous_timeout' }) });
  await loadAction()('x');
  assert.match(calls.toasts[0].message, /within 30 seconds/);
});

scenario('unknown API error → generic message with first line', async () => {
  const calls = bridge({ fetch: async () => response(500, { message: 'Server Error\nignored', code: 500, type: 'general_server_error' }) });
  await loadAction()('x');
  assert.deepEqual(calls.toasts, [{ message: 'Appwrite error 500: Server Error', style: 'error' }]);
});

scenario('network failure → could not reach toast', async () => {
  const calls = bridge({ fetch: async () => { throw new Error('The Internet connection appears to be offline.'); } });
  assert.equal(await loadAction()('x'), undefined);
  assert.deepEqual(calls.toasts, [{ message: 'Could not reach cloud.appwrite.io. The Internet connection appears to be offline.', style: 'error' }]);
});

scenario('empty reply → success toast', async () => {
  const calls = bridge({ fetch: async () => response(201, EXECUTION({ responseStatusCode: 204, responseBody: '' })) });
  assert.equal(await loadAction()('x'), undefined);
  assert.deepEqual(calls.toasts, [{ message: 'Function returned no text', style: 'success' }]);
});

scenario('secondary click → copy, no text return, secondary:true in payload', async () => {
  const calls = bridge({ secondary: true, fetch: async () => response(201, EXECUTION({ responseBody: 'copied!' })) });
  assert.equal(await loadAction()('x'), undefined);
  assert.deepEqual(calls.copies, ['copied!']);
  assert.equal(JSON.parse(JSON.parse(calls.fetches[0].init.body).body).secondary, true);
});

scenario('missing config → requireConfiguration with the missing ids, no fetch', async () => {
  const calls = bridge({ options: { projectId: '', functionId: '  ' }, fetch: async () => { throw new Error('must not fetch'); } });
  assert.equal(await loadAction()('x'), undefined);
  assert.equal(calls.fetches.length, 0);
  assert.equal(calls.config.length, 1);
  assert.deepEqual(calls.config[0].missing, ['projectId', 'functionId']);
});

scenario('non-JSON success body → unexpected reply toast', async () => {
  const calls = bridge({ fetch: async () => response(200, '<html>proxy page</html>') });
  await loadAction()('x');
  assert.deepEqual(calls.toasts, [{ message: 'Unexpected reply from Appwrite: not an execution object.', style: 'error' }]);
});

let failed = 0;
for (const { name, fn } of scenarios) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`✗ ${name}\n  ${err.message}`);
  }
}
console.log(`\n${scenarios.length - failed}/${scenarios.length} passed`);
process.exit(failed ? 1 : 0);
