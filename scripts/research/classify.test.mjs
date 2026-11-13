import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATEGORIES,SELECTION_SHA256,selectedHash,flattenRows,validateClassification,renderReport,buildClassification} from './classify.mjs';
const published=JSON.parse(fs.readFileSync(new URL('../../research/sources.json',import.meta.url),'utf8'));
const classified=JSON.parse(fs.readFileSync(new URL('../../research/preset-classification.json',import.meta.url),'utf8'));

test('frozen classification covers all 100 pinned configs across63 projects once',()=>{
 assert.equal(selectedHash(published.audit.selectedPresets),SELECTION_SHA256);
 assert.deepEqual(validateClassification(classified,published),{classification:'PASS',configurations:100,projects:63,status:'reviewed-static-orientation-not-runtime-certified'});
 assert.deepEqual(Object.fromEntries(classified.categories.map(c=>[c.id,c.count])),{engineering:60,game:10,cyber:6,visual:4,fiction:3,research:4,personalization:6,assistant:4,molbio:1,business:2});
 assert.equal(classified.categories.find(c=>c.id==='game').projectCount,1);
 assert.equal(CATEGORIES.length,10);
});
test('disabled and opaque conditional ancestors propagate without evaluating expressions',()=>{
 const marker={$opaqueJs:'throw new Error("must never execute")'};
 const rows=flattenRows([{id:'g',group:true,disabled:true,config:[{id:'x',name:'tool'}]},{id:'q',group:true,disabled:marker,config:[{id:'y',name:'other'}]}]);
 assert.deepEqual(rows.map(r=>[r.row.id,r.activation]),[['g','disabled'],['x','disabled'],['q','conditional'],['y','conditional']]);
});
test('classification refuses altered evidence identity or unreviewed selection',()=>{
 let bad=structuredClone(classified);bad.entries[0].rawConfigSha256='0'.repeat(64);assert.throws(()=>validateClassification(bad,published));
 bad=structuredClone(classified);bad.entries[0].evidence[0].url='https://invalid.example/pretend';assert.throws(()=>validateClassification(bad,published));
 const changed=structuredClone(published);changed.audit.selectedPresets[0].id='unreviewed';assert.throws(()=>buildClassification(changed,{packages:[]}));
});
test('classification rejects false runtime certification, duplicate entries, categories or counts',()=>{
 for(const modify of [x=>{x.entries[0].runtimeStatus='verified';},x=>{x.entries[1]=x.entries[0];},x=>{x.entries[0].category='game';},x=>{x.categories[0].count++;},x=>{x.categories[5]=x.categories[3];},x=>{x.counts.literalCompletePersonas++;},x=>{x.execution.researchObjectsExecuted=true;}]){
  const bad=structuredClone(classified);modify(bad);assert.throws(()=>validateClassification(bad,published));
 }
});
test('report remains bilingual, complete and explicit about samples, dependencies and audio',()=>{
 const report=renderReport(classified);
 assert.ok(report.includes('## 中文')&&report.includes('## English'));
 for(const entry of classified.entries)assert.ok(report.includes(entry.key));
 for(const fragment of ['不是100个专业领域','game configurations come from one project','音频需求未明确必须询问','not expertise certification','代码视觉创作使用本地代码渲染'])assert.ok(report.includes(fragment),fragment);
 assert.ok(!report.includes('/root/')&&!report.includes('/tmp/'));
});
