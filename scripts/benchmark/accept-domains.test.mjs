import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCases,checkOutput,evaluateResult} from './accept-domains.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('../../benchmark/domain-acceptance.json',import.meta.url),'utf8'));
test('all-domain scenarios stay unexecuted and engineering cases explicitly are not held-out',()=>{
 assert.equal(validateCases(cases),cases);assert.equal(cases.operationCases.length,23);assert.equal(cases.scenarioTasks.length,12);
 const bad=structuredClone(cases);bad.provenance.heldOut=true;assert.throws(()=>validateCases(bad));
});
test('checks enforce values and missing paths, never evaluate generated code',()=>{
 assert.deepEqual(checkOutput({a:[{v:3}],s:'hello'},[{path:['a',0,'v'],equals:3},{path:['a'],length:1},{path:['s'],contains:'ell'}]),[]);
 assert.equal(checkOutput({},[{path:['absent'],equals:true}]).length,1);
 assert.throws(()=>checkOutput({},[{path:[],code:'throw 1'}]));
});
test('negative cases require actual structured expected rejection, not arbitrary failure',()=>{
 const c={errorCode:'E_SCHEMA'};
 assert.equal(evaluateResult(c,{status:1,stderr:JSON.stringify({error:{code:'E_SCHEMA'}})}).status,'passed');
 assert.equal(evaluateResult(c,{status:1,stderr:'module missing'}).status,'failed');
 assert.equal(evaluateResult(c,{status:0,stderr:JSON.stringify({error:{code:'E_SCHEMA'}})}).status,'failed');
 assert.equal(evaluateResult(c,{error:{code:'ENOENT'}}).status,'failed');
});
test('ordinary cases reject bad output, process faults and wrong check results',()=>{
 const c={checks:[{path:['valid'],equals:true}]};
 assert.equal(evaluateResult(c,{status:0,stdout:'{"valid":true}',stderr:''}).status,'passed');
 assert.equal(evaluateResult(c,{status:0,stdout:'{"valid":false}',stderr:''}).status,'failed');
 assert.equal(evaluateResult(c,{status:0,stdout:'not json',stderr:''}).status,'failed');
 assert.equal(evaluateResult(c,{status:1,stdout:'',stderr:'dependency failure'}).status,'failed');
 assert.equal(evaluateResult(c,{signal:'SIGTERM'}).status,'failed');
});
