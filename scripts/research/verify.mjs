// Offline verification of public evidence against integrity-checked cached archives.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readTarGz,sha256} from './parsers.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// External cache is caller-supplied so no author machine path is baked into the repo.
const CACHE=path.resolve(process.env.OMNI_RESEARCH_CACHE??path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),'.research-cache','omni-upgrade'));
const s=JSON.parse(await fs.readFile(path.join(ROOT,'research/sources.json'),'utf8'));
const schema=JSON.parse(await fs.readFile(path.join(ROOT,'research/sources.schema.json'),'utf8'));
for(const k of schema.required)assert.ok(k in s,`required ${k}`);
assert.equal(s.schemaVersion,1);assert.equal(s.method.execution,'never');
const hex=/^[a-f0-9]{64}$/;let checkedFiles=0,checkedArchives=0;
for(const p of s.packages){
 for(const key of ['package','version','sourceId','distribution','execution','files','presets','nativeIntegrations','learningPoints'])assert.ok(key in p,`${p.package}: ${key}`);
 for(const value of Object.values(p.execution))assert.equal(value,false,`${p.package}: execution invariant`);
 const d=p.distribution;assert.ok(hex.test(d.tarballSha256));const archive=await fs.readFile(path.join(CACHE,sha256(d.tarball)+'.bin'));
 assert.equal(sha256(archive),d.tarballSha256,`${p.package}: archive SHA`);checkedArchives++;
 if(d.type==='npm'){
  assert.equal(d.integrityVerified,true);assert.ok(d.integrity);
  assert.ok(d.integrity.split(/\s+/).some(sri=>{const m=sri.match(/^(sha512|sha384|sha256|sha1)-([^?]+)/);return m&&createHash(m[1]).update(archive).digest('base64')===m[2];}),`${p.package}: npm SRI`);
 }else{assert.equal(d.type,'github-archive');assert.equal(d.commitPinned,true);assert.match(d.commit,/^[a-f0-9]{40}$/);assert.ok(d.tarball.endsWith('/'+d.commit));}
 let files=readTarGz(archive);
 if(d.type==='github-archive'){const prefix=[...files.keys()][0]?.split('/')[0]+'/';files=new Map([...files].filter(([k])=>k.startsWith(prefix)).map(([k,v])=>[k.slice(prefix.length),v]));}
 const manifest=JSON.parse(files.get('package.json').toString('utf8'));assert.equal(manifest.name,p.package);assert.equal(manifest.version,p.version);
 const indexed=new Map(p.files.map(f=>[f.path,f]));
 for(const f of p.files){assert.ok(hex.test(f.sha256));assert.match(f.url,/^https:\/\//);assert.ok(!f.path.startsWith('/')&&!f.path.split('/').includes('..'));assert.equal(sha256(files.get(f.path)),f.sha256,`${p.package}: ${f.path}`);assert.equal(files.get(f.path).length,f.bytes);if(d.type==='github-archive')assert.ok(f.url.includes('/'+d.commit+'/'));else assert.ok(f.url.includes('@'+p.version+'/'));checkedFiles++;}
 for(const preset of p.presets){assert.ok(indexed.has(preset.file),`${p.package}: preset file`);assert.ok(hex.test(preset.configSha256));}
 for(const hook of p.nativeIntegrations)assert.ok(indexed.has(hook.file),`${p.package}: integration file`);
 for(const point of p.learningPoints){assert.ok(point.zh&&point.en);assert.ok(point.evidence.length>=2);assert.ok(point.evidence.some(e=>e.scope==='bounded README excerpt'));for(const ref of point.evidence){assert.ok(indexed.has(ref.path),`${p.package}: learning reference`);assert.equal(indexed.get(ref.path).sha256,ref.sha256);}}
}
if(s.audit){
 const a=s.audit;assert.equal(a.presetGap,Math.max(0,100-a.qualifiedPresetConfigurations));assert.equal(a.pluginGap,Math.max(0,100-a.qualifiedNativePluginProjects));
 assert.equal(new Set(a.selectedPresets.map(p=>p.substantiveSha256)).size,a.selectedPresets.length,'selected preset structural uniqueness');
 assert.equal(new Set(a.selectedPlugins.map(p=>p.sourceId)).size,a.selectedPlugins.length,'selected plugin project uniqueness');
 assert.equal(a.selectedPresets.length,Math.min(100,a.qualifiedPresetConfigurations));assert.equal(a.selectedPlugins.length,Math.min(100,a.qualifiedNativePluginProjects));
 if(a.presetGap||a.pluginGap)assert.equal(s.status,'partial');
 const overlap=[...new Set(a.selectedPresets.map(p=>p.sourceId))].filter(id=>a.selectedPlugins.some(p=>p.sourceId===id));assert.deepEqual(a.crossGroupProjectOverlap,overlap);
}
const publicText=JSON.stringify(s);assert.ok(!publicText.includes('/root/workspace/.research/'),'private cache path leaked');assert.ok(!publicText.includes('/root/workspace/dsh-omni-mode/'),'private checkout path leaked');
console.log(JSON.stringify({zh:'离线证据验证通过；研究对象未运行',en:'Offline evidence verification passed; researched targets not run',packages:s.packages.length,archives:checkedArchives,files:checkedFiles,status:s.status}));
