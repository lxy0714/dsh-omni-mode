import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { testRuntimeRequire } from './test-runtime.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const self=createRequire(path.join(root,'package.json'));
const host=testRuntimeRequire();
let YAML;
try{YAML=self('yaml');}catch{YAML=host('yaml');}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(manifest.name,'dsh-omni-mode');
assert.equal(manifest.license,'MIT');
assert.equal(manifest.private,true,'GitHub-only release must not accidentally publish to npm');
assert.equal(manifest.engines.dsh,host('@deepseek-ai/dsh/package.json').version);
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
console.log(JSON.stringify({check:'PASS',version:manifest.version,presetRows:ids.size,license:manifest.license,compatibleDSH:manifest.engines.dsh}));

if(process.argv.includes('--pack')){
 const base=path.join(root,'.verification');fs.mkdirSync(base,{recursive:true});
 const temp=fs.mkdtempSync(path.join(base,'pack-'));
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const [pack]=JSON.parse(execFileSync(npm,['pack','--json','--ignore-scripts','--pack-destination',temp],{cwd:root,encoding:'utf8'}));
 for(const {path:file} of pack.files){
  assert(!/(^|\/)(node_modules|\.verification|\.git|\.env)(\/|$)|\.test\.js$|verification-report\.json$/.test(file),`unexpected release file ${file}`);
 }
 for(const file of ['quality.js','adaptive.js','pool.js','cordis.patch.yml','LICENSE','THIRD_PARTY_NOTICES.md','skills/grilling/SKILL.md','skills/grilling/LICENSE','skills/grilling/SOURCE.md','docs/grilling.md'])assert(pack.files.some(entry=>entry.path===file),`missing ${file}`);
 const extracted=path.join(temp,'extracted');fs.mkdirSync(extracted);
 execFileSync('tar',['-xzf',path.join(temp,pack.filename),'-C',extracted]);
 execFileSync(process.execPath,[path.join(root,'scripts/check-docs.mjs'),'--package-dir',path.join(extracted,'package')],{stdio:'inherit'});
 const output=execFileSync(process.execPath,[path.join(root,'integration.mjs')],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024,env:{...process.env,DSH_TEST_BASE:host.resolve('@deepseek-ai/dsh/package.json'),DSH_TEST_PACKAGE_DIR:path.join(extracted,'package')}});
 const report=JSON.parse(output);
 assert.equal(report.result,'PASS');
 assert(report.reports.every(entry=>entry.bundledSkill==='grilling'&&entry.bundledSkillLoaded===true),'extracted package must expose the bundled grilling skill');
 console.log(JSON.stringify({pack:'PASS',files:pack.entryCount,bytes:pack.size,extractedConsumer:'PASS',bundledSkill:'PASS',tarball:path.join(temp,pack.filename)}));
}
