import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, initializeQuality, strongestEffort } from './quality.js';
import { spawnSync } from 'node:child_process';
import { isolatedTestEnv, skillBody, verifyNodeGate, verifyLockMetadata } from './scripts/test-runtime.mjs';

const reasoning = { efforts: [
  { id: 'provider-medium', name: 'Medium' },
  { id: 'provider-xhigh', name: 'Extra high' },
  { id: 'provider-high', name: 'High' },
] };
function fixture(initial = { provider: 'test-provider', model: 'test-model' }) {
  let current = { ...initial };
  const calls = [];
  const warnings = [];
  const agent = { model: {
    current: () => ({ ...current }),
    select: async selection => { calls.push(selection); current = { ...selection }; },
  } };
  return { agent, calls, warnings, warn: text => warnings.push(text),
    set: selection => { current = selection; },
    payload: { agent, source: 'startup' } };
}
const llm = { resolveModelInfo: async () => ({ reasoning }) };

test('select highest explicit label, not list order or opaque id', () => {
  assert.equal(strongestEffort(reasoning).effort, 'provider-xhigh');
  assert.equal(strongestEffort({efforts:[
    {id:'high', name:'Low'}, {id:'low', name:'High'},
  ]}).effort, 'low');
});
test('unknown labels are not ranked even when id is familiar', () => {
  assert.equal(strongestEffort({efforts:[{id:'high',name:'Adaptive mode'}]}).effort, undefined);
});
test('no reasoning capability needs no invented effort', () => {
  assert.equal(strongestEffort(undefined).reason, 'no-reasoning-capability');
  assert.equal(strongestEffort({efforts:[]}).effort, undefined);
});
test('mixed known/unknown vocabulary preserves original', () => {
  assert.equal(strongestEffort({efforts:[...reasoning.efforts,{id:'mystery',name:'Custom'}]}).effort, undefined);
});
test('disabled-only reasoning is not enabled by invention', () => {
  assert.equal(strongestEffort({efforts:[{id:'off-id',name:'Disabled'}]}).effort, undefined);
});
test('fresh agent gets highest recognized effort without changing model or provider', async () => {
  const f=fixture();
  await initializeQuality(llm,f.payload,f.warn);
  assert.deepEqual(f.calls,[{provider:'test-provider',model:'test-model',reasoningEffort:'provider-xhigh'}]);
});
test('already highest selection is not rewritten', async () => {
  const f=fixture({provider:'p',model:'m',reasoningEffort:'provider-xhigh'});
  await initializeQuality(llm,f.payload,f.warn);
  assert.equal(f.calls.length,0);
});
test('resume, compact and clear preserve recorded user choice', async () => {
  for (const source of ['resume','compact','clear']) {
    const f=fixture({provider:'p',model:'m',reasoningEffort:'provider-medium'});
    const result=await initializeQuality(llm,{...f.payload,source},f.warn);
    assert.equal(result.reason,'preserve-resumed-selection');
    assert.equal(f.calls.length,0);
  }
});
test('unknown current effort is not downgraded', async () => {
  const f=fixture({provider:'p',model:'m',reasoningEffort:'future-effort'});
  assert.equal((await initializeQuality(llm,f.payload,f.warn)).reason,'unknown-current-effort');
  assert.equal(f.calls.length,0);
  assert.equal(f.warnings.length,1);
});
test('discovery failure is nonfatal and provider error secrets are not logged', async () => {
  const f=fixture();
  const bad={resolveModelInfo:async()=>{throw new Error('SECRET_TOKEN');}};
  assert.equal((await initializeQuality(bad,f.payload,f.warn)).reason,'initialization-failed');
  assert.equal(f.calls.length,0);
  assert(!f.warnings.join('').includes('SECRET_TOKEN'));
});
test('unsupported reasoning metadata preserves selection', async () => {
  const f=fixture();
  await initializeQuality({resolveModelInfo:async()=>({})},f.payload,f.warn);
  assert.equal(f.calls.length,0);
});
test('user changes during async discovery are not overwritten', async () => {
  const f=fixture();
  const changing={resolveModelInfo:async()=>{
    f.set({provider:'other-provider',model:'other-model',reasoningEffort:'manual'});
    return {reasoning};
  }};
  assert.equal((await initializeQuality(changing,f.payload,f.warn)).reason,'selection-changed');
  assert.equal(f.calls.length,0);
});
test('pre-cancelled initialization performs no discovery or selection', async () => {
  const f=fixture(); const controller=new AbortController(); controller.abort();
  let queried=false;
  await initializeQuality({resolveModelInfo:async()=>{queried=true;}},{...f.payload,signal:controller.signal},f.warn);
  assert.equal(queried,false); assert.equal(f.calls.length,0);
});
test('cancel during discovery stops waiting even if provider ignores signal', async () => {
  const f=fixture(); const controller=new AbortController();
  const slow={resolveModelInfo:()=>{controller.abort();return new Promise(()=>{});}};
  const result=await initializeQuality(slow,{...f.payload,signal:controller.signal},f.warn,100);
  assert.equal(result.reason,'cancelled'); assert.equal(f.calls.length,0);
});
test('metadata deadline prevents blocking creation forever', async () => {
  const f=fixture();
  const result=await initializeQuality({resolveModelInfo:()=>new Promise(()=>{})},f.payload,f.warn,5);
  assert.equal(result.reason,'initialization-failed'); assert.equal(f.calls.length,0);
  assert.equal(f.warnings.length,1);
});
test('selection write errors are contained without rollback overwriting user state', async () => {
  const f=fixture(); f.agent.model.select=async()=>{throw new Error('write failed');};
  assert.equal((await initializeQuality(llm,f.payload,f.warn)).reason,'initialization-failed');
  assert.equal(f.warnings.length,1);
});
test('model read errors do not fail agent creation', async () => {
  const f=fixture(); f.agent.model.current=()=>{throw new Error('read failed');};
  assert.equal((await initializeQuality(llm,f.payload,f.warn)).reason,'initialization-failed');
});
test('async cancellation forwards abort and ignores late metadata without changing selection', async () => {
  const f=fixture({provider:'p',model:'m',reasoningEffort:'provider-medium'});
  const controller=new AbortController();let release,providerSignal;
  const pending=initializeQuality({resolveModelInfo:(_provider,_model,signal)=>{
    providerSignal=signal;return new Promise(resolve=>{release=resolve;});
  }},{...f.payload,signal:controller.signal},f.warn);
  controller.abort();assert.equal((await pending).reason,'cancelled');assert(providerSignal.aborted);
  release({reasoning});await Promise.resolve();
  assert.equal(f.calls.length,0);assert.equal(f.warnings.length,0);
  assert.deepEqual(f.agent.model.current(),{provider:'p',model:'m',reasoningEffort:'provider-medium'});
});
test('same-model manual effort changes during discovery are never overwritten', async () => {
  const f=fixture({provider:'p',model:'m'});let release;
  const pending=initializeQuality({resolveModelInfo:()=>new Promise(resolve=>{release=resolve;})},f.payload,f.warn);
  f.set({provider:'p',model:'m',reasoningEffort:'provider-medium'});release({reasoning});
  assert.equal((await pending).reason,'selection-changed');assert.equal(f.calls.length,0);
});
test('test child environment replaces all ambient skill roots without mutating its parent',()=>{
  const inherited={DSH_HOME:'/ambient-home',DSH_AGENTS_HOME:'/ambient-agents',DSH_BUNDLED_SKILL_DIR:'/ambient-bundled',OTHER:'retained'};
  const env=isolatedTestEnv('/test-fixture',inherited);
  assert.equal(env.DSH_HOME,'/test-fixture/home');assert.equal(env.DSH_AGENTS_HOME,'/test-fixture/agents');
  assert.equal(env.DSH_BUNDLED_SKILL_DIR,'/test-fixture/bundled');assert.equal(env.OTHER,'retained');
  assert.equal(inherited.DSH_AGENTS_HOME,'/ambient-agents');
});
test('lock root versions/engines and known ACP SDK tarball metadata stay consistent',()=>{
  const manifest={version:'1.5.0',engines:{node:'>=24.9.0',dsh:'0.2.2-rc.1'}};
  const lock={version:manifest.version,packages:{'':{version:manifest.version,engines:{...manifest.engines}},
    'node_modules/@agentclientprotocol/sdk':{version:'1.4.0',resolved:'https://registry.npmjs.org/@agentclientprotocol/sdk/-/sdk-1.4.0.tgz'}}};
  assert.doesNotThrow(()=>verifyLockMetadata(manifest,lock));
  for(const target of ['top','root','node','sdk']){
    const bad=structuredClone(lock);
    if(target==='top')bad.version='1.3.1';
    if(target==='root')bad.packages[''].version='1.3.1';
    if(target==='node')bad.packages[''].engines.node='>=22.16.0';
    if(target==='sdk')bad.packages['node_modules/@agentclientprotocol/sdk'].version='1.5.0';
    assert.throws(()=>verifyLockMetadata(manifest,bad),/Lock root|ACP SDK/);
  }
});
test('Node compatibility rejects weak public gates, old runtimes and unknown range formats',()=>{
  assert.equal(verifyNodeGate('>=24.9.0','>=24.9.0','24.9.0'),'>=24.9.0');
  assert.equal(verifyNodeGate('>=24.10.0','>=24.9.0','25.0.0'),'>=24.10.0');
  assert.throws(()=>verifyNodeGate('>=22.16.0','>=24.9.0','24.10.0'),/below the official/);
  assert.throws(()=>verifyNodeGate('>=24.9.0','>=24.9.0','24.8.9'),/Current Node/);
  for(const range of ['^24.9.0','>=24.9.0 <26',undefined])assert.throws(()=>verifyNodeGate(range,'>=24.9.0','24.10.0'),/Unsupported/);
  assert.throws(()=>verifyNodeGate('>=24.9.0','^24.9.0','24.10.0'),/Unsupported/);
});
test('skill expected body strips only frontmatter and native trim, preserving inner bytes',()=>{
  assert.equal(skillBody('---\r\nname: grilling\r\ndescription: fixture\r\n---\r\n \r\nA  design tree\r\n  B\r\n '),'A  design tree\r\n  B');
  assert.throws(()=>skillBody('no frontmatter'),/frontmatter/);
  assert.throws(()=>skillBody('---\nname: grilling'),/unterminated/);
});
for(const [failure,code,options,pattern] of [
  ['exit one','process.exit(1)',{},/worker failed/],
  ['signal',"process.kill(process.pid,'SIGTERM')",{},/worker failed/],
  ['timeout','setInterval(()=>{},1000)',{timeout:50},/worker failed/],
  ['invalid JSON',"process.stdout.write('not json')",{},/invalid JSON report/],
  ['invalid report',"console.log(JSON.stringify({result:'FAIL'}))",{},/invalid report shape/],
])test(`worker ${failure} propagates to a nonzero top-level process`,()=>{
  const runner=`import {spawnSync} from 'node:child_process';\nimport {processReport} from ${JSON.stringify(new URL('./scripts/test-runtime.mjs',import.meta.url).href)};\nconst child=spawnSync(process.execPath,['-e',${JSON.stringify(code)}],{encoding:'utf8',...${JSON.stringify(options)}});\nprocessReport(child,'fixture',report=>report.result==='PASS');`;
  const top=spawnSync(process.execPath,['--input-type=module','-e',runner],{encoding:'utf8',timeout:5000});
  assert(!top.error&&!top.signal,'top-level runner must finish, not hang');
  assert.notEqual(top.status,0);assert.match(top.stderr,pattern);
});

test('plugin registers an awaited public creation listener', async () => {
  let event, listener;
  apply({llm,on:(name,callback)=>{event=name;listener=callback;}});
  assert.equal(event,'agent/created');
  const f=fixture(); await listener(f.payload);
  assert.equal(f.calls[0].reasoningEffort,'provider-xhigh');
});
