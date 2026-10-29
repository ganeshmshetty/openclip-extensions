// Save to Supermemory, against a local mock server (no real API call). Run: node scripts/test-save-to-supermemory.cjs
const assert = require('node:assert'); const http = require('node:http'); const path = require('node:path');
let last, status = 200;
const srv = http.createServer((req, res) => { let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ last={method:req.method,url:req.url,headers:req.headers,body:JSON.parse(b)}; res.writeHead(status,{'content-type':'application/json'}); res.end(JSON.stringify(status===200?{id:'doc_1',status:'queued'}:{error:'Unauthorized'})); }); });
srv.listen(0, async () => {
  const port = srv.address().port; const toasts = [];
  const load = (options, fail) => { global.openclip = { options, input: { text: '', app: { name: 'Safari', bundleID: 'com.apple.Safari' } }, toast: (m,s)=>toasts.push([m,s]),
    fetch: async (url, init) => { if (fail) throw new Error('offline'); assert.strictEqual(url,'https://api.supermemory.ai/v3/documents');
      const r = await fetch('http://127.0.0.1:'+port+'/v3/documents', init); const t = await r.text(); return { status: r.status, text: () => t }; } };
    const f = path.join(__dirname,'..','raw','SaveToSupermemory.openclipext','main.js'); delete require.cache[f]; return require(f); };
  let a = load({ apiKey: 'sm_test', containerTag: 'open clip!' });
  await a('  hello memory  ');
  assert.strictEqual(last.method,'POST'); assert.strictEqual(last.headers.authorization,'Bearer sm_test');
  assert.strictEqual(last.body.content,'hello memory'); assert.strictEqual(last.body.containerTag,'open-clip');
  assert.strictEqual(last.body.metadata.source,'openclip'); assert.strictEqual(last.body.metadata.app,'Safari'); assert.strictEqual(last.body.metadata.bundleID,'com.apple.Safari');
  assert.deepStrictEqual(toasts.pop(), ['Saved to Supermemory','success']);
  a = load({ apiKey: 'sm_test' }); await a('x'); assert.ok(!('containerTag' in last.body));
  a = load({}); await assert.rejects(a('x'), /Add your Supermemory API key/);
  a = load({ apiKey: 'k' }); await assert.rejects(a('   '), /Select some text/);
  status = 401; a = load({ apiKey: 'bad' }); await assert.rejects(a('x'), /rejected the API key/);
  status = 500; await assert.rejects(a('x'), /HTTP 500: Unauthorized/);
  a = load({ apiKey: 'k' }, true); await assert.rejects(a('x'), /Could not reach Supermemory/);
  console.log('all tests passed'); srv.close();
});
