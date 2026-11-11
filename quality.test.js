import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, initializeQuality, strongestEffort } from './quality.js';

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
test('plugin registers an awaited public creation listener', async () => {
  let event, listener;
  apply({llm,on:(name,callback)=>{event=name;listener=callback;}});
  assert.equal(event,'agent/created');
  const f=fixture(); await listener(f.payload);
  assert.equal(f.calls[0].reasoningEffort,'provider-xhigh');
});
