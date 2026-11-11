// Build bounded, hash-checked reading packets from cached, unexecuted source data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readTarGz,sha256} from './parsers.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// External cache is caller-supplied so no author machine path is baked into the repo.
const CACHE=path.resolve(process.env.OMNI_RESEARCH_CACHE??path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),'.research-cache','omni-upgrade'));
const args=process.argv.slice(2);const arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const group=arg('group','presets'),offset=Number(arg('offset',0)),limit=Math.min(30,Number(arg('limit',10)));
const s=JSON.parse(await fs.readFile(path.join(ROOT,'research/sources.json'),'utf8'));
const seen=new Set();
const categoryOrder=['security','memory','workflow','dev','tools','model','session','skill','docs','notify','remote','usage','vision','browser','identity','voice','market','agi','ui','theme','fun'];
let packages=s.packages.filter(r=>group==='presets'?r.presets.length:r.classification?.nativePluginSource&&!r.classification?.presetSource);
if(group==='plugins')packages.sort((a,b)=>categoryOrder.indexOf(a.catalog?.category??'ui')-categoryOrder.indexOf(b.catalog?.category??'ui')||a.package.localeCompare(b.package));
packages=packages.filter(r=>{if(seen.has(r.sourceId))return false;seen.add(r.sourceId);return true;});
const selected=packages.slice(offset,offset+limit);let out=`# 审阅包 / Reading packet: ${group} ${offset}–${offset+selected.length}\n\n仅静态数据，未运行。README为有界节选，不代表完整阅读。 / Static data, not run. README excerpts are bounded, not complete reading.\n\n`;
for(const r of selected){
 const archive=await fs.readFile(path.join(CACHE,sha256(r.distribution.tarball)+'.bin'));if(sha256(archive)!==r.distribution.tarballSha256)throw new Error('Archive SHA mismatch');let files=readTarGz(archive);
 if(r.distribution.type==='github-archive'){const prefix=[...files.keys()][0]?.split('/')[0]+'/';files=new Map([...files].filter(([k])=>k.startsWith(prefix)).map(([k,v])=>[k.slice(prefix.length),v]));}
 const readme=r.files.find(f=>f.path==='README.md')??r.files.find(f=>f.kinds.includes('documentation'));
 const text=readme?files.get(readme.path)?.toString('utf8')??'':'';
 const intro=text.replace(/```[\s\S]*?```/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').slice(0,650);
 out+=`## ${r.package}@${r.version}\nRepository: ${r.sourceId}\nLicense: ${JSON.stringify(r.license.declared)}\nREADME: ${readme?.path??'MISSING'} SHA256 ${readme?.sha256??''}\n\n${intro}\n\n`;
 if(group==='presets'){
  for(const p of r.presets){const rows=[];const flat=rs=>{for(const row of rs??[]){if(!row||typeof row!=='object')continue;rows.push(row);if(row.group&&Array.isArray(row.config))flat(row.config);}};flat(p.config.plugins);
   const personas=rows.filter(row=>/persona|prompt|identity/.test(row.name??'')).map(row=>({plugin:row.name,config:row.config}));
   out+=`### Preset ${p.id}\nKind: ${p.kind}; file: ${p.file}; SHA256 ${r.files.find(f=>f.path===p.file)?.sha256}\nDescription: ${p.description??''}\nComposition (${rows.length} rows): ${rows.filter(row=>!row.name?.startsWith('@deepseek-ai/')).map(row=>row.name).filter(Boolean).join(', ')}\nPersona: ${JSON.stringify(personas).slice(0,850)}\n\n`;
  }
 }
 const hooks=r.nativeIntegrations.filter(h=>h.kind!=='ctx.effect').slice(0,group==='presets'?1:2);
 for(const h of hooks)out+=`### Key implementation ${h.file}:${h.line} (${h.kind})\nSHA256 ${r.files.find(f=>f.path===h.file)?.sha256}\n\n${h.excerpt.slice(0,260)}\n\n`;
}
const filename=path.join(CACHE,'review-packets',`${group}-${offset}.md`);await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,out);console.log(JSON.stringify({path:filename,group,total:packages.length,offset,count:selected.length,packages:selected.map(r=>r.package)}));
