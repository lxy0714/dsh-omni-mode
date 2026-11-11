#!/usr/bin/env node
// Bounded, rerunnable STATIC research. Downloads data; never installs/imports target packages.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { sha256, readTarGz, parseData, applyPatches, inspectCode, exportTargets, resolveCode, safePath } from './parsers.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// All inputs are caller-supplied so no author machine path is baked into the repo.
const CACHE = path.resolve(process.env.OMNI_RESEARCH_CACHE ?? path.join(ROOT, '.research-cache', 'omni-upgrade'));
const CATALOG = path.resolve(process.env.OMNI_RESEARCH_CATALOG ?? path.join(CACHE, 'catalog.json'));
const OLD = path.resolve(process.env.OMNI_RESEARCH_LEGACY ?? path.join(CACHE, 'presets-found.json'));
const argv = process.argv.slice(2);
const arg = (name, fallback) => {const i=argv.indexOf('--'+name);return i<0?fallback:argv[i+1];};
const bounded = (n,lo,hi) => Math.max(lo,Math.min(hi,Number(n)||lo));
const LIMIT = bounded(arg('limit',100),1,600), OFFSET=bounded(arg('offset',0),0,10000);
const CONCURRENCY=bounded(arg('concurrency',6),1,6);
const MODE=arg('mode','balanced'), REFRESH=argv.includes('--refresh');
const ONLY_NAMES=new Set((arg('names','')).split(',').filter(Boolean));
const timeoutMs=15000, maxRetries=1, maxResponseBytes=10*1024*1024;
const VERSION=7;
await fs.mkdir(CACHE,{recursive:true});await fs.mkdir(path.join(ROOT,'research'),{recursive:true});
const catalog=JSON.parse(await fs.readFile(CATALOG,'utf8'));
const catalogCount=catalog.plugins.length;
try{const extra=JSON.parse(await fs.readFile(path.join(ROOT,'research/candidates.json'),'utf8'));for(const p of extra.plugins??[])if(!catalog.plugins.some(c=>c.name===p.name))catalog.plugins.push(p);}catch(e){if(e.code!=='ENOENT')throw e;}
const old=JSON.parse(await fs.readFile(OLD,'utf8'));
const byName=new Map(catalog.plugins.map(p=>[p.name,p]));
const legacySeeds=new Set(old.real??[]), pluginSeeds=new Set(old.plugin??[]), extraSeeds=new Set(old.nopatch??[]);
const knownRepos=new Set(['highho/dsh-game-studio-presets','ninipa/oh-my-dsh-slim','szytree0312/dsh-whale-elite-preset','gongyuancaiji/dsh-presets-zh']);
function score(p) {
 const text=JSON.stringify(p.description??{}), name=p.name, repo=canonicalRepo(p.repository?.url)??'';
 let n=0;
 if(legacySeeds.has(name))n+=500;if(extraSeeds.has(name))n+=200;if(knownRepos.has(repo))n+=900;
 if(/(?:agent[ -]?preset|智能体预设|agent 预设|原生.*预设|register.*preset)/i.test(text))n+=200;
 if(/preset|预设/i.test(name+' '+text))n+=90;
 if(/模式|角色|架构|协作|多智能体|人格|orchestrat|multi.agent|planning/i.test(name+' '+text))n+=35;
 if(/mode|agent|crew|team|cabinet|conductor|evolv|slim|task|plan/i.test(name))n+=20;
 if(pluginSeeds.has(name))n+=MODE==='plugins'?700:20;
 if(p.metadata?.category==='agi')n+=25;
 if(MODE==='plugins' && /plugin|native|原生|Cordis|DSH/i.test(text))n+=50;
 return n;
}
function canonicalRepo(url) {
 if(typeof url!=='string')return null;
 const m=url.replace(/^git\+/,'').match(/github\.com[/:]([^/]+\/[^/#]+)/i);return m?m[1].replace(/\.git$/,'').toLowerCase():null;
}
let candidates=catalog.plugins.filter(p=>p.versions?.some(v=>v.source?.type==='npm')).map(p=>({...p,priority:score(p)})).filter(p=>p.priority>0).sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
if(MODE==='plugins')candidates.sort((a,b)=>(pluginSeeds.has(b.name)-pluginSeeds.has(a.name))||b.priority-a.priority||a.name.localeCompare(b.name));
let slots=0, queue=[], lastRequest=0;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function requestSlot() {if(slots>=6)await new Promise(r=>queue.push(r));slots++;const pause=Math.max(0,100-(Date.now()-lastRequest));lastRequest=Date.now()+pause;if(pause)await delay(pause);}
function releaseSlot(){slots--;queue.shift()?.();}
const netStats={requests:0,cacheHits:0,retries:0,errors:0,bytes:0};
async function get(url,maxBytes=maxResponseBytes) {
 const key=sha256(url), metaPath=path.join(CACHE,key+'.json'), dataPath=path.join(CACHE,key+'.bin');
 try {const m=JSON.parse(await fs.readFile(metaPath,'utf8'));if(m.url===url){const data=await fs.readFile(dataPath);if(sha256(data)===m.sha256 && data.length<=maxBytes){netStats.cacheHits++;return {data,...m,cacheHit:true};}}}catch{}
 let last;
 for(let attempt=0;attempt<=maxRetries;attempt++){
  await requestSlot();netStats.requests++;const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
   const u=new URL(url);if(u.protocol!=='https:' || !['registry.npmjs.org','registry.npmmirror.com','unpkg.com','cdn.jsdelivr.net','raw.githubusercontent.com','codeload.github.com'].includes(u.hostname))throw new Error('URL host not allowed');
   const r=await fetch(url,{signal:controller.signal,redirect:'error',headers:{'user-agent':'DSH-static-research/1.0','accept':'*/*'}});
   if(!r.ok){const e=new Error('HTTP '+r.status);e.status=r.status;throw e;}
   if(Number(r.headers.get('content-length'))>maxBytes){await r.body?.cancel();throw new Error('response content-length limit');}
   let size=0;const chunks=[];for await(const chunk of r.body){size+=chunk.length;if(size>maxBytes)throw new Error('response streaming size limit');chunks.push(chunk);}
   const data=Buffer.concat(chunks), m={url,sha256:sha256(data),bytes:data.length,fetchedAt:new Date().toISOString(),status:r.status};netStats.bytes+=data.length;
   await fs.writeFile(dataPath,data);await fs.writeFile(metaPath,JSON.stringify(m));return {data,...m,cacheHit:false};
  }catch(e){last=e;if(attempt<maxRetries && (!e.status || e.status===429 || e.status>=500)){netStats.retries++;await delay(e.status===429?1800:500);}else break;}
  finally{clearTimeout(timer);releaseSlot();}
 }
 netStats.errors++;throw last;
}
function verifyIntegrity(bytes,integrity) {
 if(typeof integrity!=='string')throw new Error('npm dist.integrity missing');
 const choices=integrity.split(/\s+/).map(x=>x.match(/^(sha512|sha384|sha256|sha1)-([^?]+)(?:\?.*)?$/)).filter(Boolean);
 if(!choices.length)throw new Error('unsupported integrity');
 for(const [,alg,digest] of choices)if(createHash(alg).update(bytes).digest('base64')===digest)return true;
 throw new Error('npm tarball integrity mismatch');
}
function entryPath(pkg,files,base,spec) {
 if(typeof spec!=='string')return null;
 if(spec.startsWith('./')||spec.startsWith('../')){
  const nm='./node_modules/'+pkg.name+'/';if(spec.startsWith(nm))return safePath('package.json',spec.slice(nm.length));
  return safePath(base,spec);
 }
 if(spec===pkg.name)return exportTargets(pkg).map(p=>safePath('package.json',p)).find(p=>files.has(p));
 if(spec.startsWith(pkg.name+'/'))return safePath('package.json',spec.slice(pkg.name.length+1));
 return null;
}
async function inspectPackage(candidate) {
 const ver=candidate.versions.find(v=>v.source?.type==='npm' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(v.version));
 if(!ver)return {package:candidate.name,status:'unsupported-version',reason:'No exact catalog npm version / 无精确 npm 版本'};
 const resultPath=path.join(CACHE,'result-'+sha256(candidate.name+'@'+ver.version)+'.json');
 if(!REFRESH){try{const saved=JSON.parse(await fs.readFile(resultPath,'utf8'));if(saved.collectorVersion===VERSION)return saved;}catch{}}
 const metadataUrl='https://registry.npmjs.org/'+encodeURIComponent(candidate.name)+'/'+encodeURIComponent(ver.version);
 const r={collectorVersion:VERSION,package:candidate.name,version:ver.version,status:'partial',catalog:{repository:candidate.repository??null,description:candidate.description??null,priority:candidate.priority},metadataUrl,checkedAt:new Date().toISOString(),execution:{installed:false,imported:false,executed:false,installScriptsRun:false},diagnostics:[],files:[],presets:[],legacyPresets:[],nativeIntegrations:[],learningPoints:[],learningReview:'pending-human-review'};
 try {
  let published, archive, files, repoPin=null;
  try{
    const metadata=await get(metadataUrl,2*1024*1024);published=JSON.parse(metadata.data.toString('utf8'));
    if(published.name!==candidate.name || published.version!==ver.version)throw new Error('metadata identity mismatch');
    r.distribution={type:'npm',tarball:published.dist?.tarball,integrity:published.dist?.integrity,metadataSha256:metadata.sha256};
    if(published.dist?.unpackedSize>40*1024*1024)throw new Error('declared unpacked size limit');
    archive=await get(published.dist?.tarball);verifyIntegrity(archive.data,published.dist.integrity);r.distribution.tarballSha256=archive.sha256;r.distribution.integrityVerified=true;files=readTarGz(archive.data);
  }catch(e){
    if(e.status!==404 || !candidate.pinnedRepository)throw e;
    repoPin=candidate.pinnedRepository;
    if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repoPin.ownerRepo)||!/^[a-f0-9]{40}$/.test(repoPin.commit))throw new Error('unsafe repository pin');
    const url=`https://codeload.github.com/${repoPin.ownerRepo}/tar.gz/${repoPin.commit}`;archive=await get(url);
    const rawFiles=readTarGz(archive.data);const prefix=[...rawFiles.keys()][0]?.split('/')[0]+'/';files=new Map([...rawFiles].filter(([k])=>k.startsWith(prefix)).map(([k,v])=>[k.slice(prefix.length),v]));
    const bytes=files.get('package.json');if(!bytes)throw new Error('pinned repository root manifest missing');published=JSON.parse(bytes.toString('utf8'));
    if(published.name!==candidate.name||published.version!==ver.version)throw new Error('pinned repository manifest identity mismatch');
    r.metadataUrl=`https://raw.githubusercontent.com/${repoPin.ownerRepo}/${repoPin.commit}/package.json`;
    r.distribution={type:'github-archive',tarball:url,integrity:null,integrityVerified:false,commitPinned:true,commit:repoPin.commit,tarballSha256:archive.sha256,metadataSha256:sha256(bytes)};
  }
  const manifestBytes=files.get('package.json');if(!manifestBytes)throw new Error('archive package.json missing');
  const pkg=JSON.parse(manifestBytes.toString('utf8'));if(pkg.name!==candidate.name || pkg.version!==ver.version)throw new Error('archive manifest identity mismatch');
  r.repository={url:typeof pkg.repository==='string'?pkg.repository:pkg.repository?.url??candidate.repository?.url??null,directory:pkg.repository?.directory??candidate.repository?.directory??null,gitHead:repoPin?.commit??published.gitHead??null};
  r.canonicalRepository=canonicalRepo(r.repository.url);r.sourceId=r.canonicalRepository?'github:'+r.canonicalRepository:'npm:'+pkg.name;
  r.license={declared:pkg.license??published.license??null,files:[]};
  r.manifest={dsh:pkg.dsh??null,exports:pkg.exports??null,main:pkg.main??null,engines:pkg.engines??null,scripts:Object.keys(pkg.scripts??{}),hasInstallScripts:['preinstall','install','postinstall','prepare'].filter(k=>pkg.scripts?.[k]),dependencies:Object.keys(pkg.dependencies??{})};
  const fileIndex=new Map();
  const evidence=(filename,kind)=>{
   const b=files.get(filename);if(!b || b.length>2*1024*1024){r.diagnostics.push('missing/oversized referenced file: '+filename);return null;}
   let e=fileIndex.get(filename);if(!e){e={path:filename,url:repoPin?`https://raw.githubusercontent.com/${repoPin.ownerRepo}/${repoPin.commit}/${filename}`:`https://unpkg.com/${pkg.name}@${pkg.version}/${filename}`,archiveUrl:r.distribution.tarball+(repoPin?'#':'#package/')+filename,sha256:sha256(b),bytes:b.length,kinds:[]};fileIndex.set(filename,e);r.files.push(e);}if(!e.kinds.includes(kind))e.kinds.push(kind);return b.toString('utf8');
  };
  evidence('package.json','manifest');
  for(const filename of files.keys())if(/^readme(?:\.[a-z-]+)?\.md$/i.test(filename))evidence(filename,'documentation');
  for(const filename of files.keys())if(/^(?:licen[cs]e|copying|notice)(?:\.[^/]*)?$/i.test(filename)){evidence(filename,'license');r.license.files.push(filename);}
  const patchValue=pkg.dsh?.bundle?.patch, patches=typeof patchValue==='string'?[patchValue]:Array.isArray(patchValue)?patchValue:[];
  const codeRoots=new Set();const presetKey=new Set();const visitedIncludes=new Set();const inspectedData=new Set();
  const parseFile=(filename,kind)=>{const text=evidence(filename,kind);if(text===null)return null;try{return parseData(text,filename);}catch(e){r.diagnostics.push(filename+': '+e.message);return null;}};
  function addPreset(config,file,kind,row={}) {
   if(!config || typeof config.id!=='string' || !config.id.trim()) {r.diagnostics.push('unresolved preset config: '+file);return;}
   const key=file+':'+config.id;if(presetKey.has(key))return;presetKey.add(key);
   const normalized=JSON.stringify(config);r.presets.push({id:config.id,name:config.name??null,description:config.description??null,kind,file,rowId:row.id??null,disabled:row.disabled??false,conditionallyActive:typeof row.disabled==='object',configSha256:sha256(normalized),config,closureFiles:[]});
   if(Array.isArray(config.plugins))walkRows(config.plugins,file,0,config.id);
  }
  function walkRows(rows,base,depth=0,presetId=null) {
   if(depth>12){r.diagnostics.push('include/group depth limit at '+base);return;}
   if(!Array.isArray(rows))return;
   const listBase=base;
   for(const row of rows){if(!row || typeof row!=='object')continue;
    base=row.__researchBase??listBase;
    if(row.group===true && Array.isArray(row.config))walkRows(row.config,base,depth+1,presetId);
    if(row.name==='@deepseek-ai/dsh-agent-preset')addPreset(row.config,base,'declarative',row);
    if(row.name==='cordis:include' && typeof row.config?.path==='string'){
     const include=entryPath(pkg,files,base,row.config.path);if(!include){r.diagnostics.push('external/unsafe include: '+row.config.path);continue;}
     if(visitedIncludes.has(include)){r.diagnostics.push('include cycle/repeated edge: '+include);continue;}visitedIncludes.add(include);
     const data=parseFile(include,'include');if(Array.isArray(data)){const isPatch=data.some(x=>Array.isArray(x?.insert));const nested=isPatch?applyPatches([],data,r.diagnostics):data;walkRows(nested,include,depth+1,presetId);}
     if(presetId)r.presets.find(p=>p.id===presetId)?.closureFiles.push(include);
    }
    const own=entryPath(pkg,files,base,row.name);if(own && files.has(own) && /\.[cm]?[jt]sx?$/.test(own))codeRoots.add(own);
   }
  }
  let composed=[];
  for(const p of patches){const filename=safePath('package.json',p);if(!filename){r.diagnostics.push('unsafe patch path');continue;}const parsed=parseFile(filename,'bundle-patch');if(!Array.isArray(parsed)){r.diagnostics.push('patch is not an array: '+filename);continue;}
   const anchor=rows=>{for(const row of rows){if(!row||typeof row!=='object')continue;row.__researchBase=filename;if(row.group&&Array.isArray(row.config))anchor(row.config);}};
   for(const patch of parsed){if(Array.isArray(patch?.insert))anchor(patch.insert);else if(patch && typeof patch==='object')patch.__researchBase=filename;}
   composed=applyPatches(composed,parsed,r.diagnostics);inspectedData.add(filename);
  }
  // Preserve the actual introducing patch path across array-valued patches and overrides.
  walkRows(composed,'package.json');
  for(const e of exportTargets(pkg)){const filename=safePath('package.json',e);if(filename&&files.has(filename))codeRoots.add(filename);}
  // Reachable exports and relative imports only; no dependency traversal or arbitrary source scanning.
  const queue=[...codeRoots], visitedCode=new Set();let codeBytes=0;
  while(queue.length && visitedCode.size<70){const filename=queue.shift();if(visitedCode.has(filename))continue;visitedCode.add(filename);
   const text=evidence(filename,'reachable-code');if(text===null)continue;codeBytes+=Buffer.byteLength(text);if(codeBytes>4*1024*1024){r.diagnostics.push('code graph byte limit');break;}
   const code=inspectCode(text,filename);if(code.error){r.diagnostics.push(filename+': '+code.error);continue;}
   for(const spec of code.imports){if(typeof spec!=='string' || !spec.startsWith('.'))continue;const target=resolveCode(files,filename,spec);if(target)queue.push(target);else r.diagnostics.push('unresolved import: '+filename+' -> '+spec);}
   for(const registration of code.registrations){let config=registration.arguments.find(x=>x&&typeof x==='object'&&!Array.isArray(x)&&typeof x.id==='string');if(!config && typeof registration.arguments[0]==='string' && registration.arguments[1] && typeof registration.arguments[1]==='object')config={id:registration.arguments[0],...registration.arguments[1]};
    if(config)addPreset(config,filename,'runtime-static-registration');else r.diagnostics.push('unresolved runtime registration at '+filename+':'+registration.line);
   }
   if(pkg.dsh && code.hooks.length)for(const hook of code.hooks.slice(0,12))r.nativeIntegrations.push({file:filename,...hook,manifestFile:'package.json',reachability:codeRoots.has(filename)?'export-or-patch-entry':'relative-import'});
   for(const dir of code.directories){const dirname=safePath(filename,dir.path);if(!dirname)continue;for(const fp of files.keys())if(fp.startsWith(dirname.replace(/\/$/,'')+'/') && /(?:agent\.cordis|preset|patch)\.(?:ya?ml|json)$/i.test(fp) && !inspectedData.has(fp)){
      inspectedData.add(fp);const data=parseFile(fp,'presetDir-data');if(Array.isArray(data))walkRows(data,fp);r.legacyPresets.push({file:fp,presetDirEvidence:{file:filename,line:dir.line,path:dir.path},status:'legacy-directory-not-current-registration'});
    }}
  }
  if(queue.length)r.diagnostics.push('code graph file limit');
  // Explicit data observations, not unreviewed inferred learning claims.
  r.observations=r.presets.map(p=>({zh:`静态声明/注册预设 ${p.id}；配置哈希 ${p.configSha256}。`,en:`Static declaration/registration of preset ${p.id}; configuration hash ${p.configSha256}.`,evidence:[p.file],reviewed:false}));
  r.classification={presetSource:r.presets.length>0,nativePluginSource:!!pkg.dsh && r.nativeIntegrations.length>0,legacyOnly:r.legacyPresets.length>0 && !r.presets.length,overlap:r.presets.length>0&&r.nativeIntegrations.length>0};
  r.risks={zh:['仅静态研究，未运行；可达不代表实际执行。',...(!r.license.declared?['未声明许可证；禁止据此默认允许复制。']:[]),...(r.manifest.hasInstallScripts.length?['包声明安装生命周期脚本；本研究未执行。']:[]),'动态 JS 表达式保留原文，不求值；动态路径/运行条件需后续审计。'],en:['Static research only, not run; reachability does not prove execution.',...(!r.license.declared?['No declared license; do not assume reuse is permitted.']:[]),...(r.manifest.hasInstallScripts.length?['Package declares lifecycle scripts; none were executed.']:[]),'Dynamic JS remains opaque data; dynamic paths and runtime conditions require audit.']};
  r.status='verified-static';
 }catch(e){r.status='partial';r.error=e.message;}
 await fs.writeFile(resultPath,JSON.stringify(r,null,2)+'\n');return r;
}
const selected=ONLY_NAMES.size?candidates.filter(c=>ONLY_NAMES.has(c.name)):candidates.slice(OFFSET,OFFSET+LIMIT);
console.log(JSON.stringify({event:'start',mode:MODE,offset:OFFSET,selected:selected.length,availableCandidates:candidates.length,concurrency:CONCURRENCY}));
let cursor=0,done=0;const records=[];
async function worker(){while(cursor<selected.length){const c=selected[cursor++];const r=await inspectPackage(c);records.push(r);done++;console.log(JSON.stringify({event:'package',done,total:selected.length,package:r.package,status:r.status,presets:r.presets?.length??0,native:r.classification?.nativePluginSource??false,error:r.error??null}));if(done%10===0)await save();}}
let saving=Promise.resolve();function save(){saving=saving.then(async()=>{
 const results=[];for(const filename of await fs.readdir(CACHE)){if(!filename.startsWith('result-')||!filename.endsWith('.json'))continue;try{const r=JSON.parse(await fs.readFile(path.join(CACHE,filename),'utf8'));if(r.collectorVersion===VERSION)results.push(r);}catch{}}
 const byPackage=new Map();for(const r of results){const prev=byPackage.get(r.package);if(!prev || r.checkedAt>prev.checkedAt)byPackage.set(r.package,r);}
 const all=[...byPackage.values()].sort((a,b)=>a.package.localeCompare(b.package));
 for(const r of all)if(r.catalog)r.catalog.category=byName.get(r.package)?.metadata?.category??null;
 const groups=new Map();for(const r of all){if(!r.sourceId)continue;const list=groups.get(r.sourceId)??[];list.push(r);groups.set(r.sourceId,list);}
 const sources=[];const fingerprints=new Map();
 for(const [id,rs] of groups){const p=rs.filter(r=>r.classification?.presetSource),n=rs.filter(r=>r.classification?.nativePluginSource);const hashes=[...new Set(p.flatMap(r=>r.presets.map(p=>p.configSha256)))].sort();const fingerprint=hashes.length?sha256(hashes.join('|')):null;
  let duplicateOf=null;if(fingerprint){if(fingerprints.has(fingerprint))duplicateOf=fingerprints.get(fingerprint);else fingerprints.set(fingerprint,id);}
  sources.push({id,packages:rs.map(r=>r.package),presetSource:p.length>0&&!duplicateOf,nativePluginSource:n.length>0,overlap:p.length>0&&n.length>0,distinctPresetConfigs:hashes.length,presetFingerprint:fingerprint,duplicateOf,identityConfidence:id.startsWith('github:')?'repository-normalized':'package-only-unconfirmed',forkLineage:'not-independently-verified'});
 }
 const countP=sources.filter(s=>s.presetSource).length,countN=sources.filter(s=>s.nativePluginSource).length;
 const out={schemaVersion:1,collectorVersion:VERSION,generatedAt:new Date().toISOString(),status:'partial',targets:{substantivelyDistinctSelectablePresetConfigurations:100,independentNativePluginProjects:100,unitConfirmation:{zh:'用户经Lead确认：预设按独立可选且配置实质不同计100套，项目数另列；不计重复版本、改名、纯翻译、同构fork。',en:'User confirmed via Lead: 100 independently selectable, substantively distinct preset configurations; project count separate; no repeated versions, renames, pure translations, or isomorphic forks.'}},counts:{catalogEntries:catalogCount,packagesAttempted:all.length,packagesVerifiedStatic:all.filter(r=>r.status==='verified-static').length,presetSourcesRepositoryDeduplicated:countP,nativePluginSourcesRepositoryDeduplicated:countN,presetConfigurations:all.reduce((n,r)=>n+(r.presets?.length??0),0),distinctPresetConfigurations:new Set(all.flatMap(r=>(r.presets??[]).map(p=>p.configSha256))).size,legacyDirectoryFiles:all.reduce((n,r)=>n+(r.legacyPresets?.length??0),0),crossGroupSourceOverlap:sources.filter(s=>s.presetSource&&s.nativePluginSource).length,presetConfigurationRawGap:Math.max(0,100-new Set(all.flatMap(r=>(r.presets??[]).map(p=>p.configSha256))).size),nativePluginOnlyProjectPool:sources.filter(s=>s.nativePluginSource&&!s.presetSource).length,nativePluginSourceGap:Math.max(0,100-countN),reviewedLearningSources:all.filter(r=>r.learningPoints?.length).length},method:{execution:'never',thirdPartyInstallation:'never',githubApi:'not-used',network:{concurrency:CONCURRENCY,timeoutMs,maxRetries,maxResponseBytes},archive:{maxUnpackedBytes:40*1024*1024,maxEntries:12000,extractToFilesystem:false,integrityRequired:true},staticClosure:{maxIncludeDepth:12,maxCodeFiles:70,maxCodeBytes:4*1024*1024,jsTags:'opaque-only-no-eval',entrypoints:'actual patch paths plus manifest exports/main; relative imports only'},deduplication:{repository:'npm/GitHub mirror and repository subpackages collapsed',versions:'one per package; no version multiplication',configuration:'exact structural hash; exact cross-source sets collapsed',forks:'structural exact matches collapsed; fork lineage is NOT verified without additional metadata; counts are provisional upper bounds'},catalogSha256:sha256(await fs.readFile(CATALOG)),candidateSelection:'priority seeds + explicit metadata relevance; only verification, never keywords, qualifies a source',mode:MODE,lastBatch:{offset:OFFSET,limit:LIMIT,selected:selected.length},cacheDirectory:'external research cache (not included)',lastRunNetwork:netStats},sources,packages:all};
 await fs.writeFile(path.join(CACHE,'inventory.json'),JSON.stringify(out,null,2)+'\n');
 await fs.writeFile(path.join(ROOT,'research/sources.json'),JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({event:'checkpoint',attempted:all.length,presetSources:countP,nativePluginSources:countN,presetConfigurations:out.counts.presetConfigurations}));
 });return saving;}
await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));await save();console.log(JSON.stringify({event:'finished',network:netStats}));
