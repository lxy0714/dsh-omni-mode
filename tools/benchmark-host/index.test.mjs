// Mock transport regression tests; not real-model benchmark results.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runArm} from './index.js';
import * as grader from '../../scripts/benchmark/grader.mjs';
const sample={id:'transport-regression',prompt:{zh:'Read input.txt.'},files:{'input.txt':'synthetic evidence'},sources:[],userAnswers:[],tools:['fixture_read'],expected:{rules:[],critical:[],process:{writePaths:[],reads:['input.txt'],noWrite:true}}};
const route={provider:'test',model:'test'};
const block={type:'tool-call',id:'call-1',name:'fixture_read',arguments:'{"path":"input.txt"}'};
const nextCall=async function*(){yield {type:'block-end',index:0,block};yield {type:'finish',reason:{kind:'tool-calls'}};};

test('provider failure preserves completed tool trace and labels the arm incomplete',async()=>{
 let n=0;
 const ctx={llm:{stream:async function*(options){
  assert.ok(options.signal);n++;
  if(n===1){yield* nextCall();return;}
  yield {type:'finish',reason:{kind:'error',failure:{code:'MOCK_PROVIDER_FAILURE'}}};
 }}};
 const arm=await runArm(ctx,sample,'candidate','persona',{},route,new AbortController().signal,grader);
 assert.equal(arm.status,'infrastructure-error');assert.equal(arm.errorCode,'MOCK_PROVIDER_FAILURE');
 assert.equal(arm.modelCalls,2);assert.equal(arm.toolCalls.length,1);
 assert.equal(arm.toolCalls[0].result.content,'synthetic evidence');
 assert.equal(arm.files['input.txt'],'synthetic evidence');
});
test('cancellation after a completed call retains its evidence',async()=>{
 const controller=new AbortController();
 const ctx={llm:{stream:async function*(){yield* nextCall();controller.abort();}}};
 const arm=await runArm(ctx,sample,'baseline','persona',{},route,controller.signal,grader);
 assert.equal(arm.status,'aborted');assert.equal(arm.toolCalls.length,1);assert.ok(arm.errorCode);
});
test('missing finish is not completion and an unsafe provider error code is not copied',async()=>{
 const absent={llm:{stream:async function*(){}}};
 const a=await runArm(absent,sample,'candidate','persona',{},route,new AbortController().signal,grader);
 assert.equal(a.status,'infrastructure-error');assert.equal(a.errorCode,'MISSING_FINISH');
 const unsafe={llm:{stream:async function*(){throw Object.assign(Error('not published'),{code:'https://private.example/?token=secret'});}}};
 const b=await runArm(unsafe,sample,'candidate','persona',{},route,new AbortController().signal,grader);
 assert.equal(b.errorCode,'EVALUATOR_ERROR');assert.ok(!JSON.stringify(b).includes('token=secret'));
});
test('clean stop remains completed and no input or tools change between arms',async()=>{
 const before=structuredClone(sample);
 const ctx={llm:{stream:async function*(){yield {type:'finish',reason:{kind:'stop'}};}}};
 for(const variant of ['baseline','candidate']){
  const result=await runArm(ctx,sample,variant,'persona',{},route,new AbortController().signal,grader);
  assert.equal(result.status,'complete');assert.equal(result.errorCode,null);
 }
 assert.deepEqual(sample,before);
});
