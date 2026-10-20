// Mocks the openclip host and checks request payloads, copied URLs and fallbacks
// for the Linear Issue and Jira Issue extensions. Run: node scripts/test-issue-extensions.cjs
const assert = require('node:assert');
const path = require('node:path');

function load(dir, options, responder) {
  const calls = { fetch: [], copy: [], toast: [], open: [] };
  global.openclip = {
    options, input: { text: '' },
    i18n: (d) => d.en,
    fetch: async (url, init) => { calls.fetch.push({ url, init }); return responder(url, init, calls.fetch.length); },
    copy: (t) => calls.copy.push(t),
    toast: (m, s) => calls.toast.push([m, s]),
    openURL: (u) => calls.open.push(u)
  };
  const file = path.join(__dirname, '..', 'raw', dir, 'main.js');
  delete require.cache[require.resolve(file)];
  return { action: require(file), calls };
}
const json = (status, body) => ({ status, text: () => JSON.stringify(body) });

(async () => {
  // Linear: create with team key
  let t = load('LinearIssue.openclipext', { apiKey: 'lin_api_x', teamKey: 'eng' }, (url, init, n) =>
    n === 1 ? json(200, { data: { teams: { nodes: [{ id: 'team-1', key: 'ENG' }] } } })
            : json(200, { data: { issueCreate: { success: true, issue: { identifier: 'ENG-7', url: 'https://linear.app/x/issue/ENG-7' } } } }));
  await t.action('Fix login\nSteps:\n1. open app');
  assert.strictEqual(t.calls.fetch[0].url, 'https://api.linear.app/graphql');
  assert.strictEqual(t.calls.fetch[0].init.headers.Authorization, 'lin_api_x');
  assert.deepStrictEqual(JSON.parse(t.calls.fetch[0].init.body).variables, { key: 'eng' });
  const lin = JSON.parse(t.calls.fetch[1].init.body);
  assert.match(lin.query, /issueCreate/);
  assert.deepStrictEqual(lin.variables.input, { teamId: 'team-1', title: 'Fix login', description: 'Steps:\n1. open app' });
  assert.deepStrictEqual(t.calls.copy, ['https://linear.app/x/issue/ENG-7']);
  assert.deepStrictEqual(t.calls.toast, [['Created ENG-7, link copied', 'success']]);

  // Linear: unknown team
  t = load('LinearIssue.openclipext', { apiKey: 'k', teamKey: 'NOPE' }, () => json(200, { data: { teams: { nodes: [] } } }));
  await assert.rejects(t.action('Title'), /No Linear team found with key "NOPE"/);

  // Linear: bad key
  t = load('LinearIssue.openclipext', { apiKey: 'bad' }, () => json(400, { errors: [{ message: 'auth', extensions: { code: 'AUTHENTICATION_ERROR' } }] }));
  await assert.rejects(t.action('Title'), /rejected the API key/);

  // Linear: fallback without key
  t = load('LinearIssue.openclipext', { teamKey: 'ENG' }, () => { throw new Error('no fetch expected'); });
  await t.action('Bug & stuff\nline 2');
  assert.deepStrictEqual(t.calls.open, ['https://linear.app/team/ENG/new?title=Bug%20%26%20stuff&description=line%202']);
  assert.strictEqual(t.calls.fetch.length, 0);

  // Jira: create
  t = load('JiraIssue.openclipext', { siteUrl: 'acme.atlassian.net/', email: 'me@acme.io', apiToken: 'tok', projectKey: 'proj', issueType: 'Bug' },
    () => json(201, { id: '1', key: 'PROJ-42' }));
  await t.action('Crash on save\nPara one\nstill one\n\nPara two');
  const j = t.calls.fetch[0];
  assert.strictEqual(j.url, 'https://acme.atlassian.net/rest/api/3/issue');
  assert.strictEqual(j.init.headers.Authorization, 'Basic ' + Buffer.from('me@acme.io:tok').toString('base64'));
  const fields = JSON.parse(j.init.body).fields;
  assert.deepStrictEqual(fields.project, { key: 'PROJ' });
  assert.deepStrictEqual(fields.issuetype, { name: 'Bug' });
  assert.strictEqual(fields.summary, 'Crash on save');
  assert.deepStrictEqual(fields.description, { type: 'doc', version: 1, content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Para one' }, { type: 'hardBreak' }, { type: 'text', text: 'still one' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Para two' }] }] });
  assert.deepStrictEqual(t.calls.copy, ['https://acme.atlassian.net/browse/PROJ-42']);
  assert.deepStrictEqual(t.calls.toast, [['Created PROJ-42, link copied', 'success']]);

  // Jira: base64 of non-ASCII matches Buffer (UTF-8)
  assert.strictEqual(t.action._test.base64('jösé:tök€n'), Buffer.from('jösé:tök€n').toString('base64'));

  // Jira: default type Task, no description
  t = load('JiraIssue.openclipext', { siteUrl: 'https://a.atlassian.net', email: 'e', apiToken: 't', projectKey: 'P' }, () => json(201, { key: 'P-1' }));
  await t.action('Just a title');
  const f2 = JSON.parse(t.calls.fetch[0].init.body).fields;
  assert.deepStrictEqual(f2.issuetype, { name: 'Task' });
  assert.ok(!('description' in f2));

  // Jira: error messages
  t = load('JiraIssue.openclipext', { siteUrl: 'https://a.atlassian.net', email: 'e', apiToken: 't', projectKey: 'P' }, () => json(400, { errorMessages: [], errors: { issuetype: 'Specify a valid issue type' } }));
  await assert.rejects(t.action('x'), /issuetype: Specify a valid issue type/);
  t = load('JiraIssue.openclipext', { siteUrl: 'https://a.atlassian.net', email: 'e', apiToken: 't', projectKey: 'P' }, () => json(401, {}));
  await assert.rejects(t.action('x'), /rejected the email or API token/);
  t = load('JiraIssue.openclipext', { siteUrl: 'https://a.atlassian.net', apiToken: 't' }, () => json(201, {}));
  await assert.rejects(t.action('x'), /email and project key/);
  t = load('JiraIssue.openclipext', {}, () => json(201, {}));
  await assert.rejects(t.action('x'), /site URL/);

  // Jira: fallback without token
  t = load('JiraIssue.openclipext', { siteUrl: 'https://a.atlassian.net' }, () => { throw new Error('no fetch expected'); });
  await t.action('Title here\nmore');
  assert.deepStrictEqual(t.calls.open, ['https://a.atlassian.net/secure/CreateIssueDetails!init.jspa?summary=Title%20here&description=more']);

  console.log('All Linear/Jira issue extension tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
