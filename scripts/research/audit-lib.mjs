import {sha256} from './parsers.mjs';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
export function substantiveConfig(config){
 const cleanRow=row=>{if(!row||typeof row!=='object')return row;const out={};for(const [key,v]of Object.entries(row)){if(['id','__researchBase'].includes(key))continue;if(key==='name'&&typeof v==='string')out[key]=v.replace(/(@deepseek-ai\/[^@/]+)@[^/]+/,'$1');else if(key==='config'&&row.group&&Array.isArray(v))out[key]=v.map(cleanRow);else out[key]=v;}return out;};
 const out={};for(const [k,v]of Object.entries(config)){if(['id','name','description','order','__researchBase'].includes(k))continue;out[k]=k==='plugins'&&Array.isArray(v)?v.map(cleanRow):v;}return stable(out);
}
export function applyAudit(data,notes={reviews:[]}){
 const noteMap=new Map((notes.reviews??[]).map(n=>[n.package,n]));
 const definitions=[],nativeProjects=[],configSeen=new Map(),sourceSeen=new Set();
 for(const pkg of data.packages){
  const n=noteMap.get(pkg.package);const matched=n&&n.version===pkg.version;
  const readme=pkg.files?.find(f=>f.path==='README.md')??pkg.files?.find(f=>f.kinds.includes('documentation'));
  const cited=(matched?n.evidencePaths??[]:[]).map(p=>pkg.files.find(f=>f.path===p)).filter(Boolean);
  const reviewed=!!matched&&!!readme&&cited.length===(n.evidencePaths??[]).length&&cited.length>0;
  pkg.learningReview=reviewed?'reviewed-bounded-readme-and-key-fragment':'pending-human-review';
  pkg.learningPoints=reviewed?[{zh:n.zh,en:n.en,evidence:[{path:readme.path,sha256:readme.sha256,url:readme.url,scope:'bounded README excerpt'},...cited.map(f=>({path:f.path,sha256:f.sha256,url:f.url,scope:'key implementation/composition fragment'}))],risk:{zh:n.riskZh??'仅学习机制；未运行，需单独做兼容性和权限验证。',en:n.riskEn??'Study the mechanism only; not run, with compatibility and permission validation still required.'}}]:[];
  for(const preset of pkg.presets??[]){
   const normalized=substantiveConfig(preset.config),hash=sha256(JSON.stringify(normalized));
   const previous=configSeen.get(hash);if(!previous)configSeen.set(hash,`${pkg.package}#${preset.id}`);
   const excluded=matched?(n.excludedPresets??[]).find(x=>x.id===preset.id):null;
   const approved=reviewed&&(n.presetIds??[]).includes(preset.id)&&!excluded;
   const entry={package:pkg.package,version:pkg.version,sourceId:pkg.sourceId,id:preset.id,file:preset.file,substantiveSha256:hash,rawConfigSha256:preset.configSha256,reviewed,qualified:approved&&!previous,duplicateOf:previous??null,exclusion:excluded??null,reason:approved?{zh:n.presetRationaleZh??n.zh,en:n.presetRationaleEn??n.en}:{zh:excluded?.zh??'未完成独立可选性、实质差异与谱系审阅。',en:excluded?.en??'Selectable identity, substantive difference, and lineage review is incomplete.'}};
   preset.audit=entry;definitions.push(entry);
  }
  if(reviewed&&n.group==='plugins'&&pkg.classification?.nativePluginSource&&!n.lineageOf&&!sourceSeen.has(pkg.sourceId)){
   sourceSeen.add(pkg.sourceId);nativeProjects.push({package:pkg.package,version:pkg.version,sourceId:pkg.sourceId,overlapsPresetProject:pkg.classification.presetSource,manifestFile:'package.json',evidence:cited.map(f=>({path:f.path,sha256:f.sha256,url:f.url})),learning:pkg.learningPoints[0],lineageStatus:'reviewed-no-known-duplicate-not-exhaustive-fork-proof'});
  }
 }
 const eligible=definitions.filter(d=>d.qualified);const selectedPresets=eligible.slice(0,100),selectedPlugins=nativeProjects.slice(0,100);
 const overlap=[...new Set(selectedPresets.map(d=>d.sourceId))].filter(id=>selectedPlugins.some(p=>p.sourceId===id));
 // The overlap a reader actually cares about is repository-level: a selected preset
 // project that also ships native plugin integration. Reporting only the intersection of
 // the two chosen 100-item subsets would understate it, so both figures are published.
 const inventoryOverlap=(data.sources??[]).filter(s=>new Set(selectedPresets.map(d=>d.sourceId)).has(s.id)&&s.nativePluginSource).map(s=>s.id).sort();
 data.audit={status:eligible.length>=100&&nativeProjects.length>=100?'complete-static-not-runtime-tested':'partial',unit:data.targets.unitConfirmation,rawPresetConfigurations:definitions.length,qualifiedPresetConfigurations:eligible.length,qualifiedPresetProjects:new Set(eligible.map(d=>d.sourceId)).size,qualifiedNativePluginProjects:nativeProjects.length,selectedPresetConfigurations:selectedPresets.length,selectedNativePluginProjects:selectedPlugins.length,selectedPresetProjects:new Set(selectedPresets.map(d=>d.sourceId)).size,crossGroupProjectOverlap:overlap,crossGroupInventoryOverlap:inventoryOverlap,presetGap:Math.max(0,100-eligible.length),pluginGap:Math.max(0,100-nativeProjects.length),exactStructuralDuplicates:definitions.filter(d=>d.duplicateOf).length,manuallyExcludedPresets:definitions.filter(d=>d.exclusion).length,learningReviewedPackages:data.packages.filter(p=>p.learningPoints?.length).length,selectedPresets,selectedPlugins,presetDecisions:definitions,limitations:{zh:['独立可选性指来源清单的静态注册，不代表所有预设能在同一profile同时共存。','实质去重删除显示id/名/描述/排序与行id后比较工具组合、persona、隔离、禁用等结构；纯翻译/已知fork另人工排除。','无真实DSH加载、模型效果、安全运行或全面GitHub fork谱系测试。'],en:['Selectability refers to static source registration, not simultaneous coexistence in one profile.','Substantive dedup removes display id/name/description/order and row ids, then compares tools, persona, isolation, disabled flags; pure translations and known forks are manually excluded.','No real DSH mounting, model-quality, safe-runtime, or exhaustive GitHub fork-lineage tests were performed.']}};
 data.status=data.audit.status==='partial'?'partial':'complete-static-not-runtime-tested';
 data.counts.reviewedLearningSources=data.audit.learningReviewedPackages;
 return data;
}
