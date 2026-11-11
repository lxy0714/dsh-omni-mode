import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const arg=process.argv.indexOf('--package-dir');
if(arg>=0)assert(process.argv[arg+1],'--package-dir requires a path');
const packaged=arg>=0;
const root=packaged?path.resolve(process.argv[arg+1]):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bilingual=(text,where)=>assert(/\p{Script=Han}/u.test(text)&&/[A-Za-z]/.test(text),`Missing Chinese/English text: ${where}`);
const pages=['README.md','README.en.md','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','THIRD_PARTY_NOTICES.md','VERIFICATION.md',...fs.readdirSync(path.join(root,'docs')).filter(file=>file.endsWith('.md')).map(file=>`docs/${file}`)];
for(const file of pages){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 if(file==='README.md'){
  assert(text.includes('[English](README.en.md)'));
  assert((text.match(/\p{Script=Han}/gu)??[]).length>50);
 }else if(file==='README.en.md'){
  assert(text.includes('[中文](README.md)'));
  assert((text.match(/[A-Za-z]+/g)??[]).length>100);
 }else{
  const zh=text.indexOf('## 中文');const en=text.indexOf('## English');
  assert(zh>=0&&en>zh,`Missing language sections: ${file}`);
  assert((text.slice(zh,en).match(/\p{Script=Han}/gu)??[]).length>30,`Incomplete Chinese: ${file}`);
  assert((text.slice(en).match(/[A-Za-z]+/g)??[]).length>15,`Incomplete English: ${file}`);
 }
 for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
  const url=match[1].replace(/^<|>$/g,'');if(/^[a-z][a-z0-9+.-]*:/i.test(url))continue;
  const [target,anchor]=url.split('#');
  const dest=target?path.resolve(root,path.dirname(file),decodeURIComponent(target)):path.join(root,file);
  assert(dest.startsWith(root+path.sep),`Link escapes repository: ${file}`);
  assert(fs.existsSync(dest),`Broken local link: ${file} -> ${url}`);
  if(anchor&&['中文','english'].includes(decodeURIComponent(anchor)))assert(fs.readFileSync(dest,'utf8').includes(`## ${anchor==='english'?'English':'中文'}`),`Missing language anchor: ${file} -> ${url}`);
 }
}
const forms=packaged?[]:['.github/ISSUE_TEMPLATE/bug_report.yml','.github/ISSUE_TEMPLATE/feature_request.yml'];
for(const file of forms){
 const data=YAML.parse(fs.readFileSync(path.join(root,file),'utf8'));
 const walk=(value,key='')=>{
  if(typeof value==='string'&&['name','description','label'].includes(key))bilingual(value,`${file}:${key}`);
  else if(Array.isArray(value))value.forEach(item=>walk(item));
  else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>walk(v,k));
 };
 walk(data);
}
const workflows=packaged?[]:['.github/workflows/ci.yml','.github/workflows/release.yml'];
for(const file of workflows){
 const data=YAML.parse(fs.readFileSync(path.join(root,file),'utf8'));bilingual(data.name,file);
 for(const job of Object.values(data.jobs)){
  bilingual(job.name,`${file}:job`);
  for(const step of job.steps)bilingual(step.name,`${file}:step`);
 }
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
bilingual(manifest.description,'package description');
assert(fs.readFileSync(path.join(root,'LICENSE'),'utf8').startsWith('MIT License\n'));
console.log(JSON.stringify({documentation:'PASS',scope:packaged?'installed package':'source',pages:pages.length,languages:['中文','English'],forms:forms.length,workflows:workflows.length,canonicalLicense:'MIT English original retained'}));
