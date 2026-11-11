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

test('real Cordis isolation and official pruners load and unload without changing Host realm',async()=>{
  const require=testRuntimeRequire();
  const load=async name=>import(pathToFileURL(require.resolve(name)));
  const {Context}=await load('@deepseek-ai/cordis');
  const {ToolResultPruner}=await load('@deepseek-ai/dsh-compaction-tool-result-pruner');
  const root=new Context();
  const budgets={small:{thresholdChars:8192,headChars:4096,tailChars:1024},medium:{thresholdChars:32768,headChars:24576,tailChars:4096},large:{thresholdChars:131072,headChars:98304,tailChars:16384}};
  try{
    await root.plugin({name:'test-services',apply(ctx){ctx.reflect.provide('tokenMeter',{estimateMessage:()=>1});ctx.reflect.provide('llm',{resolveModelInfo:async()=>({context:{contextWindow:1048576}})});}});
    let main=root.isolate('toolResultPruner').isolate('omniRetention');
    for(const alias of ['omniSmallPruner','omniMediumPruner','omniLargePruner']) main=main.isolate(alias);
    const delegates={};
    for(const tier of ['small','medium','large']){
      const nested=main.isolate('toolResultPruner');
      await nested.plugin(ToolResultPruner,budgets[tier]);
      await nested.plugin(poolBridge,{as:`omni${tier[0].toUpperCase()+tier.slice(1)}Pruner`});
      delegates[tier]=nested.get('toolResultPruner');
    }
    await main.plugin(adaptive);
    const provider=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('adaptive provider did not become ready')),2000);
      main.inject(['toolResultPruner'],ctx=>{clearTimeout(timer);resolve(ctx.toolResultPruner);});
    });
    assert.equal(root.get('toolResultPruner'),undefined);
    assert.equal(root.get('omniRetention'),undefined);
    assert.equal(provider.config.thresholdChars,8192);
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
  }finally{await root.fiber.dispose();}
  assert.equal(root.get('toolResultPruner'),undefined);
});
