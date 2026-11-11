import test from 'node:test';
import assert from 'node:assert/strict';
import { testRuntimeRequire } from './scripts/test-runtime.mjs';
import { pathToFileURL } from 'node:url';
import * as adaptive from './adaptive.js';
const { chooseTier, availableWindow, createAdaptiveProvider } = adaptive;
import * as poolBridge from './pool.js';
const session = (window, output=0) => ({requestContext:()=>({contextWindow:window}),requestHeader:()=>({config:{maxTokens:output}})});
const pools = () => Object.fromEntries(['small','medium','large'].map(tier=>[tier,{
  config:Object.freeze({tier}), measureContent:blocks=>blocks.length,
  pruneContent:blocks=>blocks, pruneSession:()=>tier,
}]));

test('invalid and unknown model capacities use the small fallback',()=>{
  for(const value of [undefined,0,-1,NaN,Infinity,1.2]) assert.equal(chooseTier(session(value)),'small');
  assert.equal(availableWindow(Infinity),undefined);
});
test('window tiers reserve output plus 8192-compatible safety space',()=>{
  assert.equal(chooseTier(session(65536,4096)),'small');
  assert.equal(chooseTier(session(262144,8192)),'medium');
  assert.equal(chooseTier(session(1048576,65536)),'large');
  assert.equal(chooseTier(session(1048576,1000000)),'small');
});
test('available-window thresholds include exact boundary and both adjacent tokens',()=>{
  for(const output of [0,4096])for(const [boundary,below,at] of [[131072,'small','medium'],[524288,'medium','large']]){
    for(const delta of [-1,0,1]){
      const window=boundary+8192+output+delta;
      assert.equal(availableWindow(window,output),boundary+delta);
      assert.equal(chooseTier(session(window,output)),delta<0?below:at);
      assert.equal(chooseTier(session(1048576),{valid:true,window,output}),delta<0?below:at);
    }
  }
});
test('destination metadata can shrink a large old window before header commit',()=>{
  assert.equal(chooseTier(session(1048576),{valid:true,window:65536,output:4096}),'small');
});
test('failed or upward model switch remains conservative',()=>{
  assert.equal(chooseTier(session(65536),{valid:true,window:1048576,output:4096}),'small');
  assert.equal(chooseTier(session(1048576),{valid:false}),'small');
});
test('fresh session can use selected-model metadata before its first header',()=>{
  const s={requestContext:()=>undefined,requestHeader:()=>undefined};
  assert.equal(chooseTier(s,{valid:true,window:1048576,output:65536}),'large');
});
test('idle calls never append replacement tool results outside a turn',()=>{
  const p=createAdaptiveProvider(pools(),{});
  assert.deepEqual(p.pruneSession(session(1048576)),{pruned:[],charsRemoved:0});
});
test('active provider returns official delegate results unchanged and clears on idle',async()=>{
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>({context:{contextWindow:1048576},defaultMaxTokens:4096})});
  const s=session(1048576);
  await p.beforeStep({agent:{session:s},modelSelection:{provider:'p',model:'m'}},async()=>null);
  assert.equal(p.pruneSession(s),'large');
  p.markIdle(s);assert.deepEqual(p.pruneSession(s),{pruned:[],charsRemoved:0});
});
test('two interleaved sessions do not mutate or share their budget choices',async()=>{
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:async(_,model)=>({context:{contextWindow:model==='large'?1048576:65536},defaultMaxTokens:4096})});
  const a=session(1048576),b=session(1048576);
  const step=(s,model)=>({agent:{session:s},modelSelection:{provider:'test',model}});
  await p.beforeStep(step(a,'large'),async()=>({kind:'enter',messages:[],startsRequestSeries:true}));
  await p.beforeStep(step(b,'small'),async()=>({kind:'enter',messages:[]}));
  assert.equal(p.pruneSession(a),'large');assert.equal(p.pruneSession(b),'small');
  assert.equal(p.config.tier,'small');assert(Object.isFrozen(p.config));
});
test('metadata discovery failure warns and preserves the next listener decision',async()=>{
  const warnings=[]; const decision={kind:'reject'};
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>{throw Error('SECRET');}},s=>warnings.push(s));
  const result=await p.beforeStep({agent:{session:session(1048576)},modelSelection:{provider:'p',model:'m'}},async()=>decision);
  assert.equal(result,decision);assert.equal(warnings.length,1);assert(!warnings[0].includes('SECRET'));
});
test('downstream listener errors are never swallowed or retried',async()=>{
  let called=0;const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>({context:{contextWindow:65536}})});
  await assert.rejects(()=>p.beforeStep({agent:{session:session(65536)},modelSelection:{provider:'p',model:'m'}},async()=>{called++;throw Error('downstream');}),/downstream/);
  assert.equal(called,1);
});
test('already cancelled step calls downstream only once',async()=>{
  let called=0;const controller=new AbortController();controller.abort();
  const p=createAdaptiveProvider(pools(),{});
  await assert.rejects(()=>p.beforeStep({agent:{session:session(65536)},signal:controller.signal},async()=>{called++;throw Error('cancel');}),/cancel/);
  assert.equal(called,1);
});
test('cached metadata is invalidated explicitly',async()=>{
  let calls=0; const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>{calls++;return {context:{contextWindow:65536}};}});
  const step={agent:{session:session(65536)},modelSelection:{provider:'p',model:'m'}};
  await p.beforeStep(step,async()=>null);await p.beforeStep(step,async()=>null);assert.equal(calls,1);
  p.clearMetadata();await p.beforeStep(step,async()=>null);assert.equal(calls,2);
});

test('metadata cache expires at exactly 60 seconds, not one millisecond before',async t=>{
  let now=1000,calls=0;
  t.mock.method(Date,'now',()=>now);
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>{calls++;return {context:{contextWindow:1048576}};}});
  const step={agent:{session:session(1048576)},modelSelection:{provider:'p',model:'m'}};
  await p.beforeStep(step,async()=>null);
  now+=59999;await p.beforeStep(step,async()=>null);assert.equal(calls,1);
  now++;await p.beforeStep(step,async()=>null);assert.equal(calls,2);
  now+=59999;await p.beforeStep(step,async()=>null);assert.equal(calls,2);
});
test('metadata cache holds 128 models and evicts the oldest at capacity',async()=>{
  const calls=new Map();
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:async(provider,model)=>{
    const key=`${provider}/${model}`;calls.set(key,(calls.get(key)??0)+1);
    return {context:{contextWindow:1048576}};
  }});
  const visit=(provider,model)=>p.beforeStep({agent:{session:session(1048576)},modelSelection:{provider,model}},async()=>null);
  for(let i=0;i<128;i++)await visit('p',`m${i}`);
  await visit('p','m0');assert.equal(calls.get('p/m0'),1,'128 entries must fit');
  await visit('p','m128');await visit('p','m127');assert.equal(calls.get('p/m127'),1);
  await visit('p','m0');assert.equal(calls.get('p/m0'),2,'oldest entry must be rediscovered');
  await visit('other','m127');assert.equal(calls.get('other/m127'),1,'provider is part of the cache key');
});
test('public adapter/model update listeners invalidate cached metadata',async()=>{
  const listeners=new Map(),provided=new Map();let calls=0;
  adaptive.apply({...Object.fromEntries(Object.entries(pools()).map(([tier,pool])=>[`omni${tier[0].toUpperCase()+tier.slice(1)}Pruner`,pool])),
    llm:{resolveModelInfo:async()=>{calls++;return {context:{contextWindow:1048576}};}},
    reflect:{provide:(name,value)=>provided.set(name,value)},
    on:(event,listener)=>listeners.set(event,listener)});
  const p=provided.get('omniRetention');assert.equal(p,provided.get('toolResultPruner'));
  const step={agent:{session:session(1048576)},modelSelection:{provider:'p',model:'m'}};
  await p.beforeStep(step,async()=>null);await p.beforeStep(step,async()=>null);assert.equal(calls,1);
  for(const event of ['llm/models-updated','llm/adapters-updated']){
    assert.equal(typeof listeners.get(event),'function');listeners.get(event)();
    await p.beforeStep(step,async()=>null);assert.equal(calls,event==='llm/models-updated'?2:3);
  }
  listeners.get('agent/status')({agent:step.agent,status:'idle'});
  assert.deepEqual(p.pruneSession(step.agent.session),{pruned:[],charsRemoved:0});
});
test('async metadata cancellation aborts provider signal and never widens the old budget',async()=>{
  let release,receivedSignal,calls=0,nextCalls=0;const warnings=[];
  const controller=new AbortController();
  const p=createAdaptiveProvider(pools(),{resolveModelInfo:(_provider,_model,signal)=>{
    calls++;receivedSignal=signal;
    return calls===1?new Promise(resolve=>{release=resolve;}):Promise.resolve({context:{contextWindow:1048576}});
  }},warning=>warnings.push(warning));
  const s=session(1048576),selection={provider:'p',model:'new'};
  const decision={kind:'reject'};
  const waiting=p.beforeStep({agent:{session:s},modelSelection:selection,signal:controller.signal},async()=>{nextCalls++;return decision;});
  controller.abort();
  assert.equal(await waiting,decision);assert.equal(nextCalls,1);assert(receivedSignal.aborted);
  assert.equal(p.pruneSession(s),'small');assert.equal(s.requestContext().contextWindow,1048576);
  release({context:{contextWindow:1048576}});await Promise.resolve();
  assert.equal(p.pruneSession(s),'small','late metadata must not restore an aborted destination');
  await p.beforeStep({agent:{session:s},modelSelection:selection},async()=>null);
  assert.equal(calls,2,'cancelled metadata must not populate the cache');
  assert.equal(warnings.length,0,'cancellation must not emit discovery warnings');
});
test('failed and cancelled model switches do not widen committed old-model budgets',async()=>{
  for(const failure of ['reject','cancel']){
    const controller=new AbortController();const old=session(65536,4096);const decision={kind:'reject'};
    const p=createAdaptiveProvider(pools(),{resolveModelInfo:async()=>{
      if(failure==='cancel')controller.abort();
      return {context:{contextWindow:1048576},defaultMaxTokens:4096};
    }});
    assert.equal(await p.beforeStep({agent:{session:old},modelSelection:{provider:'p',model:'large'},signal:controller.signal},async()=>decision),decision);
    assert.equal(p.pruneSession(old),'small');
    assert.deepEqual(old.requestHeader(),{config:{maxTokens:4096}});
    assert.equal(old.requestContext().contextWindow,65536);
  }
});

test('real Cordis isolation and official pruners load and unload without changing Host realm',async()=>{
  const require=testRuntimeRequire();
  const load=async name=>import(pathToFileURL(require.resolve(name)));
  const {Context}=await load('@deepseek-ai/cordis');
  const {ToolResultPruner}=await load('@deepseek-ai/dsh-compaction-tool-result-pruner');
  const root=new Context();
  const sentinel=Object.freeze({config:Object.freeze({thresholdChars:17}),marker:'host-sentinel'});
  const scopedFibers=[];
  let metadataCalls=0;
  const budgets={small:{thresholdChars:8192,headChars:4096,tailChars:1024},medium:{thresholdChars:32768,headChars:24576,tailChars:4096},large:{thresholdChars:131072,headChars:98304,tailChars:16384}};
  try{
    await root.plugin({name:'test-services',apply(ctx){ctx.reflect.provide('tokenMeter',{estimateMessage:()=>1});ctx.reflect.provide('llm',{resolveModelInfo:async()=>{metadataCalls++;return {context:{contextWindow:1048576}};}});ctx.reflect.provide('toolResultPruner',sentinel);ctx.reflect.provide('omniRetention',sentinel);}});
    assert.equal(root.get('toolResultPruner'),sentinel);
    let main=root.isolate('toolResultPruner').isolate('omniRetention');
    for(const alias of ['omniSmallPruner','omniMediumPruner','omniLargePruner']) main=main.isolate(alias);
    const delegates={};
    for(const tier of ['small','medium','large']){
      const nested=main.isolate('toolResultPruner');
      scopedFibers.push(await nested.plugin(ToolResultPruner,budgets[tier]));
      scopedFibers.push(await nested.plugin(poolBridge,{as:`omni${tier[0].toUpperCase()+tier.slice(1)}Pruner`}));
      delegates[tier]=nested.get('toolResultPruner');
    }
    scopedFibers.push(await main.plugin(adaptive));
    const provider=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('adaptive provider did not become ready')),2000);
      main.inject(['toolResultPruner'],ctx=>{clearTimeout(timer);resolve(ctx.toolResultPruner);});
    });
    assert.equal(root.get('toolResultPruner'),sentinel);
    assert.equal(root.get('omniRetention'),sentinel);
    assert.equal(sentinel.config.thresholdChars,17);
    assert.equal(provider.config.thresholdChars,8192);
    const step={agent:{session:session(1048576)},modelSelection:{provider:'test',model:'m'}};
    await provider.beforeStep(step,async()=>null);await provider.beforeStep(step,async()=>null);
    assert.equal(metadataCalls,1);
    root.emit('llm/models-updated','test');await provider.beforeStep(step,async()=>null);
    assert.equal(metadataCalls,2,'real Cordis model update must clear scoped metadata');
    root.emit('llm/adapters-updated');await provider.beforeStep(step,async()=>null);
    assert.equal(metadataCalls,3,'real Cordis adapter update must clear scoped metadata');
    for(const tier of ['small','medium','large']){
      const official=delegates[tier];
      assert(Object.isFrozen(official.config));
      const image={type:'image',image:{attachmentId:'sha256:test'}};
      const pruned=official.pruneContent([{type:'text',text:'😀'.repeat(150000)},image]);
      assert(pruned.some(block=>block===image));
      assert(official.measureContent(pruned)<=budgets[tier].thresholdChars);
      assert.equal(official.pruneContent(pruned),null);
      assert(!pruned.filter(b=>b.type==='text').some(b=>/[\uD800-\uDBFF]$/.test(b.text)));
    }
    for(const fiber of scopedFibers.reverse())await fiber.dispose();
    assert.equal(root.get('toolResultPruner'),sentinel,'unmount must retain the Host provider');
    assert.equal(root.get('omniRetention'),sentinel);
    assert.deepEqual(sentinel,{config:{thresholdChars:17},marker:'host-sentinel'});
  }finally{await root.fiber.dispose();}
  assert.equal(root.get('toolResultPruner'),undefined);
});
