// Public metadata discovery only. HEAD paths never qualify an evidence source.
// No imports, installation, shelling out, GitHub API, auth headers, or target execution.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256} from './parsers.mjs';
// External cache is caller-supplied so no author machine path is baked into the repo.
const CACHE=path.resolve(process.env.OMNI_RESEARCH_CACHE??path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),'.research-cache','omni-upgrade'));
const repos=process.argv.slice(2);
if(!repos.length)throw new Error('Pass exact known owner/repository names');
async function get(url){const key=sha256(url),p=path.join(CACHE,key+'.discovery.json');try{return JSON.parse(await fs.readFile(p,'utf8'));}catch{}
 let result;for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(url,{signal:controller.signal,redirect:'error'});if(!r.ok){if(r.status>=500&&attempt===0)continue;result={url,status:r.status};break;}let size=0;const chunks=[];for await(const b of r.body){size+=b.length;if(size>2*1024*1024)throw new Error('response size limit');chunks.push(b);}const b=Buffer.concat(chunks);result={url,status:r.status,sha256:sha256(b),text:b.toString('utf8'),discoveryOnly:true};break;}catch(e){result={url,error:e.message};}finally{clearTimeout(timer);}
 }await fs.writeFile(p,JSON.stringify(result,null,2)+'\n');return result;
}
for(const repo of repos){if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Invalid exact repository');const manifest=await get('https://raw.githubusercontent.com/'+repo+'/HEAD/package.json');let pkg;try{pkg=JSON.parse(manifest.text);}catch{}const commits=await get('https://github.com/'+repo+'/commits/HEAD.atom');console.log(JSON.stringify({repository:repo,manifestStatus:manifest.status,package:pkg?.name,version:pkg?.version,dsh:pkg?.dsh,manifestCache:path.join(CACHE,sha256(manifest.url)+'.discovery.json'),commitStatus:commits.status,commitIds:commits.text?.match(/\/commit\/[a-f0-9]{40}/g)?.slice(0,3),commitCache:path.join(CACHE,sha256(commits.url)+'.discovery.json')}));}
