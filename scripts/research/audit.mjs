// Compile reviewed, compact public evidence; full static inventory remains in external cache.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyAudit} from './audit-lib.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// External cache is caller-supplied so no author machine path is baked into the repo.
const CACHE=path.resolve(process.env.OMNI_RESEARCH_CACHE??path.join(ROOT,'.research-cache','omni-upgrade'));
await fs.mkdir(CACHE,{recursive:true});
const target=path.join(ROOT,'research/sources.json'),inventoryPath=path.join(CACHE,'inventory.json');
let data=JSON.parse(await fs.readFile(target,'utf8'));
if(data.compactEvidence) data=JSON.parse(await fs.readFile(inventoryPath,'utf8'));else await fs.writeFile(inventoryPath,JSON.stringify(data,null,2)+'\n');
// Review notes are additive rounds: a later round may correct an earlier decision
// (for example approving a configuration the first pass left pending). Plain lexical
// filename order is wrong here because "reviews.presets-round7.json" sorts before
// "reviews.presets3.json", silently letting the older note win. Sort base notes first,
// then later rounds by round number, so explicit re-reviews always take precedence.
const roundOf=file=>{const match=file.match(/-round(\d+)[a-z]?\.json$/);return match?Number(match[1]):0;};
const noteFiles=(await fs.readdir(path.join(ROOT,'research'))).filter(f=>/^reviews(?:\.[a-z0-9-]+)?\.json$/.test(f)).sort((a,b)=>roundOf(a)-roundOf(b)||a.localeCompare(b));
const notes={reviews:[]};const noteOrigin=new Map();
for(const filename of noteFiles){
 const n=JSON.parse(await fs.readFile(path.join(ROOT,'research',filename),'utf8'));
 for(const review of n.reviews){
  // Later rounds replace the earlier note for the same package instead of appending a
  // duplicate decision the map constructor would resolve by insertion order alone.
  if(noteOrigin.has(review.package))notes.reviews=notes.reviews.filter(r=>r.package!==review.package);
  noteOrigin.set(review.package,filename);notes.reviews.push(review);
 }
}
applyAudit(data,notes);
const reviewed=data.packages.filter(r=>r.learningPoints?.length);
const selectedNames=new Set([...reviewed.map(r=>r.package),...data.audit.selectedPresets.map(p=>p.package),...data.audit.selectedPlugins.map(p=>p.package)]);
const publicPackages=data.packages.filter(r=>selectedNames.has(r.package)).map(r=>{
 const cited=new Set(['package.json',...r.learningPoints.flatMap(p=>p.evidence.map(e=>e.path)),...r.presets.map(p=>p.file),...r.nativeIntegrations.filter(h=>h.kind!=='ctx.effect').slice(0,3).map(h=>h.file),...(r.license.files??[])]);
 return {package:r.package,version:r.version,sourceId:r.sourceId,repository:r.repository,distribution:r.distribution,license:r.license,execution:r.execution,classification:r.classification,learningReview:r.learningReview,learningPoints:r.learningPoints,files:r.files.filter(f=>cited.has(f.path)),presets:r.presets.map(p=>({id:p.id,name:p.name,kind:p.kind,file:p.file,rowId:p.rowId,configSha256:p.configSha256,substantiveSha256:p.audit.substantiveSha256,qualified:p.audit.qualified,duplicateOf:p.audit.duplicateOf,exclusion:p.audit.exclusion,conditionallyActive:p.conditionallyActive,closureFiles:p.closureFiles})),nativeIntegrations:r.nativeIntegrations.filter(h=>h.kind!=='ctx.effect').slice(0,3).map(h=>({...h,excerpt:h.excerpt.slice(0,300)})),risks:r.risks};
});
const ids=new Set(publicPackages.map(p=>p.sourceId));
const result={...data,compactEvidence:true,generatedAt:new Date().toISOString(),packages:publicPackages,sources:data.sources.filter(s=>ids.has(s.id)),inventorySummary:{attemptedPackages:data.packages.length,presetProjectPool:data.counts.presetSourcesRepositoryDeduplicated,nativePluginProjectPool:data.counts.nativePluginSourcesRepositoryDeduplicated,unreviewedPackages:data.packages.filter(p=>!p.learningPoints?.length).length,partialPackages:data.packages.filter(p=>p.status==='partial').map(p=>({package:p.package,version:p.version,error:p.error})),unresolvedRegistrations:data.packages.filter(p=>p.diagnostics?.some(d=>/unresolved runtime/.test(d))).map(p=>({package:p.package,version:p.version,diagnostics:p.diagnostics.filter(d=>/unresolved runtime/.test(d))}))}};
result.method={...result.method,cacheDirectory:'external research cache (not included)',fullInventory:'external-cache/inventory.json',publishedEvidence:'reviewed sources and short proof fragments only'};
await fs.writeFile(target,JSON.stringify(result,null,2)+'\n');
await fs.writeFile(path.join(CACHE,'audited-inventory.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({zh:'静态审阅进度，未运行外部对象',en:'Static review progress; external targets not run',raw:data.audit.rawPresetConfigurations,presets:data.audit.qualifiedPresetConfigurations,presetProjects:data.audit.qualifiedPresetProjects,plugins:data.audit.qualifiedNativePluginProjects,presetGap:data.audit.presetGap,pluginGap:data.audit.pluginGap,reviewedPackages:data.audit.learningReviewedPackages,status:data.status}));
