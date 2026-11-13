// Engineering acceptance of shipped local CLI operations, NOT a real-model benchmark.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const file=p=>path.join(ROOT,p);
export function validateCases(cases){
 assert.equal(cases.schemaVersion,1);assert.equal(cases.provenance.heldOut,false);assert.equal(cases.provenance.observedDuringDesign,true);assert.equal(cases.provenance.original40ResultsUnchanged,true);
 assert(cases.purpose.zh&&cases.purpose.en);assert(cases.operationCases.length>=20);assert(cases.scenarioTasks.length>=12);
 const ids=new Set();for(const c of [...cases.operationCases,...cases.scenarioTasks]){assert(typeof c.id==='string'&&!ids.has(c.id),'duplicate/missing case id');ids.add(c.id);}
 for(const c of cases.operationCases){assert(typeof c.operation==='string'&&c.input&&typeof c.input==='object');assert(Boolean(c.errorCode)!==Boolean(c.checks),'exactly one expected error or checks');if(c.checks)assert(c.checks.length>0);}
 for(const c of cases.scenarioTasks){
  assert.equal(c.status,'not-run');assert(c.prompt.zh&&c.prompt.en&&c.acceptance.length>0);
  // Every scenario must ship its own runnable, self-contained fixture; a task
  // that cannot be executed later is not a testable case.
  assert.equal(typeof c.fixture,'string','scenario needs a fixture path: '+c.id);
  assert.equal(c.fixture,'benchmark/domain-fixtures/'+c.id,'fixture path must match the case id');
  const dir=path.join(ROOT,c.fixture);assert(fs.existsSync(dir)&&fs.statSync(dir).isDirectory(),'missing fixture dir: '+c.id);
  const files=fs.readdirSync(dir,{recursive:true}).filter(f=>fs.statSync(path.join(dir,f)).isFile());
  assert(files.length>0,'empty fixture: '+c.id);
  assert(files.includes('README.md'),'fixture needs a README: '+c.id);
 }
 assert.equal(new Set(cases.scenarioTasks.flatMap(c=>c.domains)).size,10,'scenario tasks must span all ten primary categories');
 return cases;
}
export function checkOutput(output,checks){
 const failures=[];
 for(const check of checks){
  assert(Array.isArray(check.path)&&check.path.length<=10);let value=output;
  for(const key of check.path){assert(['string','number'].includes(typeof key));if(value===null||typeof value!=='object'||!Object.hasOwn(value,key)){value=undefined;break;}value=value[key];}
  const actions=Object.keys(check).filter(k=>k!=='path');assert.equal(actions.length,1,'one check action');
  const [action]=actions;assert(['equals','length','contains'].includes(action),'unknown check action');
  try{if(action==='equals')assert.deepEqual(value,check.equals);else if(action==='length'){assert(typeof value==='string'||Array.isArray(value));assert.equal(value.length,check.length);}else{assert.equal(typeof value,'string');assert(value.includes(check.contains));}}
  catch{failures.push({path:check.path,action,expected:check[action],actual:value===undefined?'<missing>':value});}
 }
 return failures;
}
export function evaluateResult(c,result){
 if(result.error||result.signal)return {status:'failed',failure:'process-error',code:result.error?.code??null,signal:result.signal??null};
 if(c.errorCode){let error;try{error=JSON.parse(result.stderr).error;}catch{return {status:'failed',failure:'unstructured-error',exitCode:result.status};}
  return result.status!==0&&error?.code===c.errorCode?{status:'passed',expectedRejection:c.errorCode}:{status:'failed',failure:'wrong-rejection',exitCode:result.status,actual:error?.code??null,expected:c.errorCode};}
 if(result.status!==0)return {status:'failed',failure:'unexpected-exit',exitCode:result.status,stderr:result.stderr.slice(-2000)};
 let output;try{output=JSON.parse(result.stdout);}catch{return {status:'failed',failure:'invalid-json-output'};}
 const failures=checkOutput(output,c.checks);return failures.length?{status:'failed',failure:'checks',checks:failures}:{status:'passed',outputSha256:sha(result.stdout)};
}
const runtimeFiles=['capabilities/runner.mjs','capabilities/operations.mjs','capabilities/schema.mjs'];
function runtimeHashes(){return Object.fromEntries(runtimeFiles.map(p=>[p,fs.existsSync(file(p))?sha(fs.readFileSync(file(p))):null]));}
export function runAcceptance(cases){
 validateCases(cases);const before=runtimeHashes(),results=[];
 for(const c of cases.operationCases){
  if(Object.values(before).some(x=>x===null)){results.push({id:c.id,domain:c.domain,operation:c.operation,status:'blocked',reason:'missing-local-implementation'});continue;}
  const r=spawnSync(process.execPath,[file('capabilities/runner.mjs'),'run',c.operation,'--json',JSON.stringify(c.input)],{cwd:ROOT,encoding:'utf8',timeout:15000,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:''}});
  results.push({id:c.id,domain:c.domain,operation:c.operation,...evaluateResult(c,r)});
 }
 const after=runtimeHashes(),stable=JSON.stringify(before)===JSON.stringify(after);
 return {schemaVersion:1,layer:'native-cli-engineering-acceptance',realModel:false,heldOut:false,caseSetSha256:sha(JSON.stringify(cases)),runtimeHashes:before,sourceStable:stable,node:process.version,platform:process.platform+'/'+process.arch,status:!stable?'unstable-source':results.some(r=>r.status==='failed')?'failed':results.some(r=>r.status==='blocked')?'blocked':'passed',summary:{operationCases:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,blocked:results.filter(r=>r.status==='blocked').length,scenarioTasksNotExecuted:cases.scenarioTasks.length},results,scenarioTasks:cases.scenarioTasks.map(c=>({id:c.id,domains:c.domains,status:'not-run'})),note:{zh:'只验证明确本地CLI契约；未执行领域模型任务，不证明自动路由、专业水平或模型质量提升。设计时已观察实现，这不是未见盲测。',en:'Tests explicit local CLI contracts only. Domain model tasks were not executed; no proof of automatic routing, professional expertise or model-quality gains. Implementation was observed during design: not held-out confirmation.'}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.length===0||(args.length===2&&args[0]==='--out'),'Usage: node accept-domains.mjs [--out <new-receipt.json>]');
 const cases=validateCases(JSON.parse(fs.readFileSync(file('benchmark/domain-acceptance.json'),'utf8'))),receipt=runAcceptance(cases),body=JSON.stringify(receipt,null,2)+'\n';
 if(args.length)fs.writeFileSync(path.resolve(args[1]),body,{flag:'wx',mode:0o600});
 console.log(body);if(receipt.status!=='passed')process.exitCode=1;
}
