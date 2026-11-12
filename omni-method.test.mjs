// Composition/content regression tests, not evidence of real-model task improvement.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
const raw=fs.readFileSync(new URL('./skills/omni-method/SKILL.md',import.meta.url),'utf8');
const frontmatter=raw.match(/^---\n([\s\S]+?)\n---\n/);
const composition=YAML.parseDocument(fs.readFileSync(new URL('./cordis.patch.yml',import.meta.url),'utf8'),{customTags:[{tag:'tag:yaml.org,2002:js',resolve:value=>({opaque:value})}]}).toJS();
const declaration=composition[0].insert[0];
const prefix=declaration.config.plugins.find(p=>p.id==='persona').config.prefix;

test('execution method is a discoverable bilingual skill with a narrow trigger',()=>{
 assert.ok(frontmatter);const meta=YAML.parse(frontmatter[1]);
 assert.equal(meta.name,'omni-method');assert.ok(meta.description.includes('复杂任务'));assert.ok(meta.description.includes('skip simple'));
 assert.ok(raw.includes('## 中文'));assert.ok(raw.includes('## English'));
 assert.ok(raw.includes('不必加载') || meta.description.includes('不必加载'));
});
test('existing omni preset defers method loading instead of adding a second preset or inlining its body',()=>{
 assert.equal(declaration.id,'preset-omni');assert.equal(declaration.config.id,'omni');assert.equal(declaration.config.name,'全能模式');
 assert.equal(composition.flatMap(p=>p.insert??[]).filter(r=>r.name==='@deepseek-ai/dsh-agent-preset').length,1);
 assert.ok(prefix.includes('按需加载本预设内置的 omni-method'));assert.ok(prefix.includes('用户已指定完整步骤时不必加载'));
 assert.ok(!prefix.includes('### 1. 对齐成果契约'),'the full method stays out of the base persona');
 assert.ok(prefix.includes('grilling'),'existing interview rule remains');
});
test('method keeps authority, source integrity and truthful validation constraints visible',()=>{
 for(const fragment of ['拒绝或用户未回答不能被模拟成批准','摘要不是真实验收','来源引用不是本地路径','最后一次修改后的真实成果','Stop on user pause/cancellation'])assert.ok(raw.includes(fragment),fragment);
});
test('v1.5 core runtime and upstream grilling remain byte-for-byte unchanged',()=>{
 const expected={
  'quality.js':'f0bb863148310169fd93e71974e003e34135be1eac8aaebad19950302cabb200',
  'adaptive.js':'05a44856c3d11240d1fd590d64f56f71796597439f8d46d08a5a6d3f47f3d66a',
  'pool.js':'451c9591174fc0fc25381f040fc6ddff93930ea0fcc9fe1ef1364df5498a9d49',
  'skills/grilling/SKILL.md':'a146842ed93ca43d833550fa9adf02e58cb63c83fea9d4b4522995b82242d4e2',
 };
 for(const [file,sha]of Object.entries(expected))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(file,import.meta.url))).digest('hex'),sha,file);
});
test('adoption document references exactly pinned evidence present in the reviewed source inventory',()=>{
 const doc=fs.readFileSync(new URL('./docs/omni-method.md',import.meta.url),'utf8');
 const inventory=JSON.parse(fs.readFileSync(new URL('./research/sources.json',import.meta.url),'utf8'));
 const urls=new Set(inventory.packages.flatMap(p=>p.files.map(f=>f.url)));
 const cited=[...doc.matchAll(/https:\/\/unpkg\.com\/[^)\s]+/g)].map(m=>m[0]);
 assert.ok(cited.length>=12,'both languages cite the pinned references');
 for(const url of cited)assert.ok(urls.has(url),url);
 assert.ok(doc.includes('不是模型行为改善'));assert.ok(doc.includes('not behavioral gains'));
});
