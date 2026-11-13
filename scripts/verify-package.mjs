import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { testRuntimeRequire, isolatedTestEnv, verifyNodeGate, verifyLockMetadata } from './test-runtime.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const self=createRequire(path.join(root,'package.json'));
const host=testRuntimeRequire();
let YAML;
try{YAML=self('yaml');}catch{YAML=host('yaml');}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(manifest.name,'dsh-omni-mode');
assert.equal(manifest.license,'MIT');
assert.equal(manifest.private,true,'GitHub-only release must not accidentally publish to npm');
const official=host('@deepseek-ai/dsh/package.json');
// A single pinned version cannot serve both the published stable channel and
// the next pre-release, so the gate is an explicit accepted set. Anything
// outside it stays refused rather than silently tolerated.
const acceptedDsh=Array.isArray(manifest.engines.dsh)?manifest.engines.dsh:[manifest.engines.dsh];
assert(acceptedDsh.length>0&&acceptedDsh.every(v=>typeof v==='string'&&/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(v)),'engines.dsh must list exact versions');
assert(new Set(acceptedDsh).size===acceptedDsh.length,'engines.dsh must not repeat a version');
assert(acceptedDsh.includes(official.version),`tested ${official.version} is not in the declared accepted set: ${acceptedDsh.join(', ')}`);
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
console.log(JSON.stringify({check:'PASS',version:manifest.version,presetRows:ids.size,license:manifest.license,compatibleDSH:acceptedDsh,nodeMinimum:manifest.engines.node,currentNode:process.versions.node}));

if(process.argv.includes('--pack')){
 const base=path.join(root,'.verification');fs.mkdirSync(base,{recursive:true});
 const temp=fs.mkdtempSync(path.join(base,'pack-'));
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const [pack]=JSON.parse(execFileSync(npm,['pack','--json','--ignore-scripts','--pack-destination',temp],{cwd:root,encoding:'utf8'}));
 for(const {path:file} of pack.files){
  assert(!/(^|\/)(node_modules|\.verification|\.git|\.env)(\/|$)|\.test\.js$|verification-report\.json$/.test(file),`unexpected release file ${file}`);
 }
 for(const file of ['quality.js','adaptive.js','pool.js','cordis.patch.yml','LICENSE','THIRD_PARTY_NOTICES.md','skills/grilling/SKILL.md','skills/grilling/LICENSE','skills/grilling/SOURCE.md','skills/omni-method/SKILL.md','docs/grilling.md','docs/omni-method.md'])assert(pack.files.some(entry=>entry.path===file),`missing ${file}`);
 const extracted=path.join(temp,'extracted');fs.mkdirSync(extracted);
 execFileSync('tar',['-xzf',path.join(temp,pack.filename),'-C',extracted]);
 execFileSync(process.execPath,[path.join(root,'scripts/check-docs.mjs'),'--package-dir',path.join(extracted,'package')],{stdio:'inherit'});
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
 console.log(JSON.stringify({pack:'PASS',files:pack.entryCount,bytes:pack.size,extractedConsumer:'PASS',bundledSkill:'PASS',missingSkillDecoys:'REJECTED',tarball:path.join(temp,pack.filename)}));
}
