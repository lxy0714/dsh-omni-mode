import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { testRuntimeRequire, isolatedTestEnv, verifyNodeGate, verifyLockMetadata } from './test-runtime.mjs';
import { RUNTIME_FILES } from '../capabilities/runtime-files.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const self=createRequire(path.join(root,'package.json'));

const host=testRuntimeRequire();
const hostRoot=path.dirname(host.resolve('@deepseek-ai/dsh/package.json'));
// Reuse the semver the Harness itself resolves, without adding a dependency.
const semverModule=()=>{
 for(const base of [path.join(hostRoot,'@deepseek-ai/dsh-app-boot/package.json')]){
  try{const req=createRequire(base);return req('semver');}catch{}
 }
 return host('semver');
};

let YAML;
try{YAML=self('yaml');}catch{YAML=host('yaml');}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(manifest.name,'dsh-omni-mode');
assert.equal(manifest.license,'MIT');
assert.equal(manifest.private,true,'GitHub-only release must not accidentally publish to npm');
const official=host('@deepseek-ai/dsh/package.json');
// The Harness requires engines.dsh to be a semver *string* range and resolves it
// with includePrerelease. The declared range must admit the version under test.
assert.equal(typeof manifest.engines.dsh,'string','engines.dsh must be a string; the Harness rejects an array');
const semver=semverModule();
const acceptedDsh=semver.validRange(manifest.engines.dsh);
assert(acceptedDsh,'engines.dsh must be a valid semver range');
assert(semver.satisfies(official.version,manifest.engines.dsh,{includePrerelease:true}),`tested ${official.version} is outside the declared range ${manifest.engines.dsh}`);
// Enumerate exact version precedences. A continuous interval would also admit
// untested nested prereleases such as rc.4.1. Each run exercises one actual SDK.
const compatibleDsh=['0.2.2-rc.1','0.2.2-rc.2','0.2.2-rc.3','0.2.2-rc.4','0.2.2-rc.5'];
assert.equal(manifest.engines.dsh,compatibleDsh.join(' || '),'engines.dsh must enumerate the compatibility census');
const {evaluatePluginCompatibility,getDshRuntimeVersion}=await import(pathToFileURL(host.resolve('@deepseek-ai/dsh-app-boot')));
assert.equal(getDshRuntimeVersion(),official.version,'DSH CLI and app-boot must be the same version');
assert.equal(evaluatePluginCompatibility(manifest),undefined,'the selected official Host must accept the manifest without an exemption');
for(const accepted of compatibleDsh){
 assert.equal(evaluatePluginCompatibility(manifest,{},accepted),undefined,`engines.dsh must admit ${accepted}`);
}
for(const rejected of ['0.2.1-rc.5','0.2.2-alpha.3','0.2.2-rc.0','0.2.2-rc.1.1','0.2.2-rc.4.1','0.2.2-rc.5.1','0.2.2-rc.6','0.2.2','0.2.3-rc.1']){
 const result=evaluatePluginCompatibility(manifest,{},rejected);
 assert.equal(result?.exempted,false,`engines.dsh must reject ${rejected} without exemption`);
 assert.equal(result?.requirements['engines.dsh'],manifest.engines.dsh,`expected the manifest gate to reject ${rejected}`);
}
verifyNodeGate(manifest.engines.node,official.engines.node);
verifyLockMetadata(manifest,JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8')));
assert.equal(manifest.repository.url,'git+https://github.com/lxy0714/dsh-omni-mode.git');
for(const file of ['quality.js','adaptive.js','pool.js','LICENSE','THIRD_PARTY_NOTICES.md','README.md','README.en.md','CHANGELOG.md'])assert(fs.existsSync(path.join(root,file)),file);
const skillDir=path.join(root,'skills','grilling');
for(const file of ['SKILL.md','LICENSE','SOURCE.md']){
 const text=fs.readFileSync(path.join(skillDir,file),'utf8');
 assert(text.trim().length>0,`empty vendored skill file: ${file}`);
}
{
 const body=fs.readFileSync(path.join(skillDir,'SKILL.md'));
 const blob=createRequire(import.meta.url)('node:crypto').createHash('sha1')
   .update(Buffer.concat([Buffer.from(`blob ${body.length}\0`),body])).digest('hex');
 assert.equal(blob,'d2f09a18e6a6c65c55f1271ba08dfeaf06f0bed3','vendored grilling differs from the documented upstream blob');
 assert(!/https?:\/\/(?!github\.com\/mattpocock)/.test(fs.readFileSync(path.join(skillDir,'SOURCE.md'),'utf8')),'unexpected upstream host in SOURCE.md');
}
assert(fs.readFileSync(path.join(root,'skills/omni-method/SKILL.md'),'utf8').trim().length>0,'own execution method must be packaged');
for(const file of ['quality.js','adaptive.js','pool.js']){
 execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
 const text=fs.readFileSync(path.join(root,file),'utf8');
 assert(!/\/root\/|\/sdcard\/|\/opt\/dsh/.test(text),`machine path in ${file}`);
}
const doc=YAML.parseDocument(fs.readFileSync(path.join(root,'cordis.patch.yml'),'utf8'),{customTags:[{tag:'tag:yaml.org,2002:js',resolve:value=>({__jsExpr:value})}]});
assert.equal(doc.errors.length,0,String(doc.errors));assert.equal(doc.warnings.length,0,String(doc.warnings));
const preset=doc.toJS()[0].insert[0];assert.equal(preset.config.id,'omni');assert.equal(preset.config.name,'全能模式');
const ids=new Set();
async function walk(rows){for(const row of rows){assert(!ids.has(row.id),`duplicate ${row.id}`);ids.add(row.id);if(row.group)await walk(row.config);else{
 const require=row.name.startsWith('dsh-omni-mode')?self:host;
 const mod=await import(pathToFileURL(require.resolve(row.name)));
 const Config=mod.Config??mod.default?.Config;
 if(Config&&row.config&&row.id!=='skill-filesystem')Config(row.config);
}}}
await walk(preset.config.plugins);
for(const suffix of ['', '/adaptive','/pool']){
 self.resolve(`dsh-omni-mode${suffix}`);
 for(const lang of ['zh','en']){
  const {meta}=JSON.parse(fs.readFileSync(self.resolve(`dsh-omni-mode${suffix}/locale/${lang}.json`),'utf8'));assert(meta.title&&meta.description);
 }
 const icon=self.resolve(`dsh-omni-mode${suffix}/icon`);assert(fs.statSync(icon).size<256*1024);
}
console.log(JSON.stringify({check:'PASS',version:manifest.version,presetRows:ids.size,license:manifest.license,compatibleDSH:manifest.engines.dsh,acceptedDsh,nodeMinimum:manifest.engines.node,currentNode:process.versions.node}));

if(process.argv.includes('--pack')){
 const base=path.join(root,'.verification');fs.mkdirSync(base,{recursive:true});
 const temp=fs.mkdtempSync(path.join(base,'pack-'));
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const [pack]=JSON.parse(execFileSync(npm,['pack','--json','--ignore-scripts','--pack-destination',temp],{cwd:root,encoding:'utf8'}));
 for(const {path:file} of pack.files){
   assert(!/(^|\/)(node_modules|\.verification|\.git|\.env)(\/|$)|\.test\.[cm]?js$|(^|\/)(?:build-test-evidence\.mjs|test-evidence\.json|\.omni-evidence-[^/]+)(?:\/|$)|verification-report\.json$/.test(file),`unexpected release file ${file}`);
 }
  for(const file of ['quality.js','adaptive.js','pool.js','cordis.patch.yml','LICENSE','THIRD_PARTY_NOTICES.md','skills/grilling/SKILL.md','skills/grilling/LICENSE','skills/grilling/SOURCE.md','skills/omni-method/SKILL.md','docs/grilling.md','docs/omni-method.md'])assert(pack.files.some(entry=>entry.path===file),`missing ${file}`);
  for(const file of [...RUNTIME_FILES,'README.md','source-excerpts.json'])assert(pack.files.some(entry=>entry.path===`capabilities/${file}`),`missing capability runtime ${file}`);
 const extracted=path.join(temp,'extracted');fs.mkdirSync(extracted);
 execFileSync('tar',['-xzf',path.join(temp,pack.filename),'-C',extracted]);
  execFileSync(process.execPath,[path.join(root,'scripts/check-docs.mjs'),'--package-dir',path.join(extracted,'package')],{stdio:'inherit'});
  const cli=path.join(extracted,'package/capabilities/runner.mjs');
  const cleanEnv={...process.env,NODE_OPTIONS:''};delete cleanEnv.NODE_TEST_CONTEXT;
  const invoke=(id,input)=>{const r=spawnSync(process.execPath,[cli,'run',id,'--json',JSON.stringify(input)],{encoding:'utf8',env:cleanEnv,timeout:15000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
  assert.equal(invoke('game.offline',{elapsedSeconds:2,maxOfflineSeconds:1,efficiency:{numerator:'1',denominator:'1'},rounding:'floor',resources:[{id:'r',ratePerSecond:{numerator:'3',denominator:'2'},rewardCap:'9'}]}).resources[0].awardedAmount,'1');
  assert.equal(invoke('game.growth',{base:'9007199254740993',multiplier:{numerator:'2',denominator:'1'},levels:[1],rounding:'floor'}).values[0].amount,'18014398509481986');
  assert.equal(invoke('engineering.impact',{scope:'extracted-package probe',modules:[{id:'m',paths:[{kind:'file',path:'m.js'}]}],dependencies:[],tests:[{id:'t',covers:['m']}],changedPaths:['m.js']}).recommendation.mode,'targeted');
  assert.equal(invoke('documents.audit',{documents:[{path:'a.md',markdown:'# A\n[x](#a)'}]}).valid,true);
   assert.equal(invoke('documents.audit',{documents:[{path:'a.md',markdown:'# A\n`<a id="ghost"></a>`\n[x](#ghost)'}]}).issueCounts.MISSING_ANCHOR,1);
   const subject='a'.repeat(64),receipt='b'.repeat(64);
   const delivery=invoke('engineering.delivery-check',{subjectSha256:subject,requiredCheckIds:['test','rollback'],receipts:[{checkId:'test',subjectSha256:subject,receiptSha256:receipt,outcome:'pass'}]});
   assert.deepEqual(delivery.results.map(x=>x.blockerCode),[null,'MISSING_RECEIPT']);
   assert.equal(delivery.checksExecuted,false);
   const game=invoke('game.build-check',{buildId:'current',targets:[{id:'fixture',requiredTests:['smoke']}],builds:[{targetId:'fixture',buildId:'current',artifactSha256:subject}],testRuns:[{targetId:'fixture',testId:'smoke',buildId:'current',artifactSha256:receipt,outcome:'pass'}]});
   assert.equal(game.issueCounts.TEST_ARTIFACT_MISMATCH,1);
   assert.equal(game.testsExecuted,false);
   const originalStyle={length:'default',tone:'default',structure:'default'};
   const style={length:'concise',tone:'direct',structure:'bullets'};
   const consent={action:'draft',scope:'current-task',current:originalStyle,proposed:style};
   assert.equal(invoke('personalization.style-draft',{...consent,consent:false}).status,'consent-required');
   const drafted=invoke('personalization.style-draft',{...consent,consent:true});
   assert.equal(drafted.memoryWritten,false);
   const restored=invoke('personalization.style-draft',{action:'revert',scope:'current-task',current:drafted.proposedState,undo:drafted.undo});
   assert.equal(restored.status,'revert-draft');assert.deepEqual(restored.proposedState,originalStyle);
   const quotes=invoke('research.quote-check',{sources:[{id:'excerpt',lines:['first','second']}],quotes:[{id:'q1',sourceId:'excerpt',startLine:2,endLine:2,quotedLines:['second']},{id:'q2',sourceId:'excerpt',startLine:1,endLine:1,quotedLines:['second']}]});
   assert.deepEqual(quotes.results.map(x=>x.status),['matched','text-mismatch']);
   assert.equal(quotes.sourceAuthenticityVerified,false);
   const fiction=invoke('fiction.thread-check',{chapters:[{id:'first',events:[{threadId:'a',kind:'payoff'},{threadId:'b',kind:'setup'}]},{id:'second',events:[{threadId:'a',kind:'setup'},{threadId:'a',kind:'payoff'}]}]});
   assert.deepEqual(fiction.threads.map(x=>x.status),['paid-off','open']);
   assert.equal(fiction.issueCounts.PAYOFF_BEFORE_SETUP,1);assert.equal(fiction.storyEvaluated,false);
  const unsupported=spawnSync(process.execPath,[cli,'doctor','--test'],{encoding:'utf8',env:cleanEnv,timeout:15000});
  assert.equal(unsupported.status,1);assert.equal(JSON.parse(unsupported.stdout).evidence.supported,false);
 const output=execFileSync(process.execPath,[path.join(root,'integration.mjs')],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024,env:{...process.env,DSH_TEST_BASE:host.resolve('@deepseek-ai/dsh/package.json'),DSH_TEST_PACKAGE_DIR:path.join(extracted,'package')}});
 const report=JSON.parse(output);
 assert.equal(report.result,'PASS');
 assert(report.reports.every(entry=>entry.bundledSkill==='grilling'&&entry.bundledSkillLoaded===true&&entry.bundledSkillExact===true&&entry.methodSkillLoaded===true&&entry.methodSkillExact===true),'extracted package must expose both exact bundled skills');
 // A plausible external skill must not repair a tarball missing its own skill.
 // Do not touch the source package or change official provider precedence.
 const original=path.join(extracted,'package');
 for(const name of ['grilling','omni-method']){
  const missing=path.join(temp,`missing-${name}`);
  fs.cpSync(original,missing,{recursive:true,filter:file=>file!==path.join(original,'skills',name,'SKILL.md')});
  const negativeEnv=isolatedTestEnv(path.join(temp,`external-${name}`));
  const decoyText=`---\nname: ${name}\ndescription: External same-name decoy\n---\nExternal method, not the packaged skill.\n`;
  for(const skillRoot of [path.join(negativeEnv.DSH_HOME,'skills'),path.join(negativeEnv.DSH_AGENTS_HOME,'skills'),negativeEnv.DSH_BUNDLED_SKILL_DIR]){
   const file=path.join(skillRoot,name,'SKILL.md');
   fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,decoyText);
  }
  // integration also plants project .dsh/.agents same-suffix decoys for both names.
  const negative=spawnSync(process.execPath,[path.join(root,'integration.mjs')],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024,
   env:{...negativeEnv,DSH_TEST_BASE:host.resolve('@deepseek-ai/dsh/package.json'),DSH_TEST_PACKAGE_DIR:missing}});
  fs.writeFileSync(path.join(temp,`missing-${name}.stdout.log`),negative.stdout??'');
  fs.writeFileSync(path.join(temp,`missing-${name}.stderr.log`),negative.stderr??'');
  assert(!negative.error&&!negative.signal,'missing-skill test must fail an assertion, not time out or crash');
  assert.notEqual(negative.status,0,'a package missing its skill must fail even with external same-name decoys');
  assert((negative.stderr??'').includes(`bundled ${name} skill must be discoverable`),'negative must fail the exact package skill lookup');
 }
   console.log(JSON.stringify({pack:'PASS',files:pack.entryCount,bytes:pack.size,extractedConsumer:'PASS',newCapabilityInvocations:12,runtimeOnlyTests:'honestly-unsupported',bundledSkill:'PASS',missingSkillDecoys:'REJECTED',tarball:path.join(temp,pack.filename)}));
}
