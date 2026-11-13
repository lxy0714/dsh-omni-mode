import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeReceipts} from './summarize.mjs';
const h='a'.repeat(64), p='b'.repeat(64), route='c'.repeat(64), grader='1'.repeat(64), driver='2'.repeat(64);
const cases=[{id:'one',category:'research'},{id:'two',category:'research'}];
const options={caseSetHash:h,candidatePolicyHash:p,routeFingerprint:route,graderHash:grader,driverHash:driver,cases};
const arm=(variant,pass=true,status='complete')=>({variant,status,grade:{passed:pass,criticalPassed:pass,score:pass?1:0,checks:pass?[]:[{id:'outcome',passed:false}]}});
const receipt=(id,results,extra={})=>({id,sha256:'d'.repeat(64),receipt:{scored:true,caseSetHash:h,candidatePolicyHash:p,routeFingerprint:route,graderHash:grader,driverHash:driver,caseId:'one',category:'research',started:'2026-01-01T00:00:00Z',status:'complete',results,...extra}});

test('separate treatment arms inside a matched cohort',()=>{
 const data=summarizeReceipts([receipt('1',[arm('baseline',false),arm('candidate')]),receipt('other',[arm('baseline'),arm('candidate')],{routeFingerprint:'e'.repeat(64)})],options);
 assert.equal(data.counts.baseline.passed,0);assert.equal(data.counts.candidate.passed,1);
 assert.equal(data.recordedAttempts,1);assert.deepEqual(data.missingCases,['two']);
 assert.equal(data.acceptanceEstablished,false);
});
test('first failed attempt stays primary; later success remains visible',()=>{
 const data=summarizeReceipts([receipt('later',[arm('baseline'),arm('candidate')],{started:'2026-01-02T00:00:00Z'}),receipt('first',[arm('baseline'),arm('candidate',false)])],options);
 assert.equal(data.recordedAttempts,2);assert.equal(data.counts.candidate.passed,0);
 assert.deepEqual(data.criticalRegressions,['one']);assert.equal(data.attempts.length,2);
});
test('partial infrastructure failures are retained, not replaced with a full retry',()=>{
 const data=summarizeReceipts([receipt('partial',[arm('candidate')],{status:'infrastructure-error',errorCode:'ABORTED'}),receipt('retry',[arm('baseline'),arm('candidate')],{started:'2026-01-02T00:00:00Z'})],options);
 assert.equal(data.counts.baseline.missing,1);assert.equal(data.counts.baseline.entered,0);
 assert.equal(data.pairedPrimaryCases,0);assert.equal(data.primary[0].errorCode,'ABORTED');
});
test('a step limit is never a successful completion even if artifacts happened to pass',()=>{
 const data=summarizeReceipts([receipt('limit',[arm('baseline'),arm('candidate',true,'step-limit')],{status:'incomplete'})],options);
 assert.equal(data.counts.candidate.passed,0);assert.equal(data.counts.candidate.incomplete,1);
 // A budget exhaustion is a model-behaviour outcome, not infrastructure: it is counted
 // as an incomplete arm and still blocks a compare-only-on-finished claim.
 assert.equal(data.counts.candidate.infrastructure,0);
 assert.equal(data.pairedPrimaryCases,0);
 assert.deepEqual(data.criticalRegressions,['one']);
});
test('transport faults are excluded from outcomes and never counted as model regressions',()=>{
 const transport=receipt('fault',[arm('baseline'),{variant:'candidate',status:'infrastructure-error',grade:{passed:false,criticalPassed:false,score:0.1,checks:[]}}]);
 const data=summarizeReceipts([transport],options);
 assert.equal(data.counts.candidate.infrastructure,1);
 assert.equal(data.counts.candidate.incomplete,0);
 assert.equal(data.counts.candidate.passed,0);
 assert.equal(data.pairedPrimaryCases,0);
 assert.deepEqual(data.criticalRegressions,[]);
});
test('duplicate or unknown arm identities fail closed',()=>{
 assert.throws(()=>summarizeReceipts([receipt('duplicate',[arm('baseline'),arm('baseline')])],options),/arm identity/);
 assert.throws(()=>summarizeReceipts([receipt('unknown',[arm('other')])],options),/arm identity/);
});
test('hash-less legacy receipts are excluded from a cohort, not silently merged',()=>{
 // Previously such a receipt entered the cohort with hashesComplete=false, which
 // still allowed a mixed-revision tally. It must now be excluded and counted.
 const legacy=(id,extra={})=>{const r=receipt(id,[arm('baseline'),arm('candidate',false)]);delete r.receipt.graderHash;delete r.receipt.driverHash;return Object.assign(r,extra);};
 const data=summarizeReceipts([legacy('legacy')],options);
 assert.equal(data.recordedAttempts,0,'a receipt with no grader hash cannot join the cohort');
 assert.equal(data.primary.length,0);
 assert.equal(data.excludedReceipts.missingGraderHash,1);
 assert.equal(data.acceptanceEstablished,false);
});

test('receipts graded or driven by another revision never share a cohort',()=>{
 const other=receipt('other',[arm('baseline'),arm('candidate')],{graderHash:'9'.repeat(64)});
 const otherDriver=receipt('other-driver',[arm('baseline'),arm('candidate')],{driverHash:'8'.repeat(64)});
 const good=receipt('good',[arm('baseline'),arm('candidate')]);
 const data=summarizeReceipts([other,otherDriver,good],options);
 assert.equal(data.recordedAttempts,1,'only the matching revision is admitted');
 assert.equal(data.primary[0].receipt,'good');
 assert.deepEqual(data.excludedReceipts,{otherGrader:1,otherDriver:1,missingGraderHash:0,missingDriverHash:0});
 assert.deepEqual(data.cohort,{caseSetHash:h,candidatePolicyHash:p,routeFingerprint:route,graderHash:grader,driverHash:driver});
});

test('a cohort without pinned grader and driver hashes is refused outright',()=>{
 for(const drop of ['graderHash','driverHash']){
  const opts={...options};delete opts[drop];
  assert.throws(()=>summarizeReceipts([],opts),new RegExp(drop));
 }
});

test('a transport fault is never counted as a category win or loss',()=>{
 const fault={variant:'candidate',status:'aborted',grade:null};
 const rows=[receipt('fault',[arm('baseline'),fault])];
 const data=summarizeReceipts(rows,options);
 const research=data.categories.find(c=>c.category==='research');
 assert.equal(research.losses,0,'an aborted arm is not a model loss');
 assert.equal(research.wins,0);
 assert.equal(research.comparablePairs,0);
 assert.equal(data.criticalRegressions.length,0);
 assert.equal(data.discordantCases.length,0);
});

test('completed pairs and comparable behavioural pairs are reported separately',()=>{
 const budget={variant:'candidate',status:'step-limit',grade:{passed:false,criticalPassed:false,score:0,checks:[{id:'outcome',passed:false}]}};
 const data=summarizeReceipts([receipt('budget',[arm('baseline'),budget])],options);
 assert.equal(data.pairedCompletedCases,0,'a step limit is not a completed pair');
 assert.equal(data.comparableBehavioralPairs,1,'but both arms did produce a behaviour');
 assert.deepEqual(data.criticalRegressions,['one'],'and a budget failure is still a critical regression');
});
