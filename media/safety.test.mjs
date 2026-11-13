import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateProject,loadProject,localFile,rasterInfo} from './project.mjs';
import {validateSvg} from './svg.mjs';
import {fontCoverage,checkCoverage} from './fonts.mjs';
import {runProcess} from './process.mjs';
import {loadRenderer} from './toolchain.mjs';
import {render,doctor} from './runner.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const base=()=>({version:1,scene:'scene.mjs',width:64,height:48,background:'#112233',fps:{num:10,den:1},frameCount:2,seed:1,formats:['png'],fonts:[],assets:[]});
const svg=(body='',attrs='')=>`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="0 0 64 48"${attrs}>${body}</svg>`;
const opt={width:64,height:48};
async function tmp(t){await fs.mkdir(path.join(here,'.test-runs'),{recursive:true});const dir=await fs.mkdtemp(path.join(here,'.test-runs/safety-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return dir;}
test('strict schema and rational timeline / 严格模式与有理时间线',()=>{
 assert.equal(validateProject(base()).width,64);for(const patch of [{unknown:true},{width:1},{height:2049},{fps:{num:60,den:0}},{fps:{num:120,den:1}},{frameCount:301},{frameCount:300,fps:{num:1,den:1}},{background:'transparent'},{formats:['png','png']},{formats:['webm']},{seed:-1},{fonts:[{path:'f',family:'X',url:'x'}]},{assets:[{id:'a',path:'x',license:''}]}])assert.throws(()=>validateProject({...base(),...patch}));
 assert.throws(()=>validateProject({...base(),width:2048,height:2048,frameCount:100}),/limit/);
 assert.throws(()=>validateProject({...base(),width:63,formats:['mp4'],audio:{decision:'asked',choice:'silent'}}),/even/);
});
test('audio must be chosen for video, static needs no prompt / 视频需音频选择，静态不问',()=>{
 assert.doesNotThrow(()=>validateProject(base()));for(const audio of [undefined,{}, {decision:'skipped',choice:'silent'},{decision:'asked',choice:'provided'},{decision:'asked',choice:'silent',path:'a.wav'}])assert.throws(()=>validateProject({...base(),formats:['mp4'],audio}));
 assert.doesNotThrow(()=>validateProject({...base(),formats:['mp4'],audio:{decision:'asked',choice:'silent'}}));
});
test('safe SVG subset, unknown resources and XML attacks / SVG子集与资源攻击',()=>{
 assert.equal(validateSvg(svg('<rect width="20" height="20" fill="#ffffff"/>'),opt).nodes,2);
 for(const body of ['<script/>','<foreignObject/>','<animate/>','<set/>','<style/>','<use href="#x"/>','<image href="https://example.org/x.png"/>','<image href="data:image/png;base64,YQ=="/>','<rect onclick="x"/>','<rect style="fill:red"/>','<rect fill="url(https://example.org/x)"/>','<rect fill="url(#unknown)"/>','<rect fill="u\\72l(#x)"/>','<text>中文</text>','<rect id="a"/><rect id="a"/>','<rect fill="&#104;ttps://x"/>','<rect/><g>','<!DOCTYPE x>','<?xml version="1.0"?>'])assert.throws(()=>validateSvg(svg(body),opt),body);
 assert.throws(()=>validateSvg(svg('', ' opacity="0"'),opt),/root/);
 assert.throws(()=>validateSvg(svg('<rect/>').replace('viewBox="0 0 64 48"','viewBox="1 2 3 4"'),opt),/dimensions/);
 assert.throws(()=>validateSvg('x'.repeat(2097153),opt),/byte/);
 assert.throws(()=>validateSvg(svg('<g>'.repeat(33)+'</g>'.repeat(33)),opt),/nesting/);
 assert.throws(()=>validateSvg(svg('<rect/>'.repeat(10000)),opt),/node/);
 assert.doesNotThrow(()=>validateSvg(svg('<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/></linearGradient></defs><rect fill="url(#g)"/>'),opt));
 const uri='data:image/png;base64,YQ==';assert.doesNotThrow(()=>validateSvg(svg(`<image href="${uri}" width="4" height="4"/>`),{...opt,assetUris:[uri]}));
});
test('font coverage refuses missing characters and unknown families / 字体缺字与未知字体族',()=>{
 assert.throws(()=>validateSvg(svg('<text font-family="Other">A</text>'),{...opt,fontFamilies:['Known'],coverage:[()=>true]}),/family/);
 assert.throws(()=>validateSvg(svg('<text font-family="Known">中</text>'),{...opt,fontFamilies:['Known'],coverage:[()=>false]}),/coverage/);
 assert.doesNotThrow(()=>validateSvg(svg('<text font-family="Known">中&amp;A</text>'),{...opt,fontFamilies:['Known'],coverage:[()=>true]}));
 assert.throws(()=>checkCoverage('中',[()=>false]),/missing/);
});
test('canonical containment, symlinks and resource bounds / 规范路径与软链接',async t=>{
 const dir=await tmp(t),project=path.join(dir,'project');await fs.mkdir(project);await fs.writeFile(path.join(dir,'outside.mjs'),'export const x=1');await fs.symlink(path.join(dir,'outside.mjs'),path.join(project,'escape.mjs'));await fs.writeFile(path.join(project,'scene.mjs'),'export const x=1');
 await assert.rejects(localFile(project,'../outside.mjs',1000),/escapes/);await assert.rejects(localFile(project,'escape.mjs',1000),/escapes/);await assert.rejects(localFile(project,path.join(project,'scene.mjs'),1000),/relative/);await assert.rejects(localFile(project,'scene.mjs',1),/byte/);
 await fs.writeFile(path.join(project,'project.json'),JSON.stringify({...base(),scene:'escape.mjs'}));await assert.rejects(loadProject(path.join(project,'project.json')),/escapes/);
 assert.throws(()=>rasterInfo(Buffer.from('<svg/>')),/raster/);
 const fake=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(fake);fake.writeUInt32BE(5000,16);fake.writeUInt32BE(5000,20);await fs.writeFile(path.join(project,'big.png'),fake);await fs.writeFile(path.join(project,'project.json'),JSON.stringify({...base(),assets:[{id:'a',path:'big.png',license:'original test fixture'}]}));await assert.rejects(loadProject(path.join(project,'project.json')),/pixel/);
});
test('font parser reads explicit real Unicode families / 显式真实字体字符表',async t=>{
 const file=process.env.OMNI_MEDIA_TEST_FONT;if(!file){t.skip('BLOCKED no OMNI_MEDIA_TEST_FONT; no font claim / 缺少显式测试字体');return;}
 const covers=await fontCoverage(file);assert.ok(covers(0x4e2d));assert.ok(covers.families.includes('Noto Sans CJK SC'));assert.equal(covers(0x10ffff),false);
});
test('malformed font refuses huge TTC face count / 拒绝恶意字体面数',async t=>{
 const dir=await tmp(t),b=Buffer.alloc(16);b.write('ttcf');b.writeUInt32BE(0xffffffff,8);await fs.writeFile(path.join(dir,'bad.ttc'),b);await assert.rejects(fontCoverage(path.join(dir,'bad.ttc')),/face limit/);
});
test('renderer never resolves profile paths or hoisted modules / 不解析配置档或提升依赖',async t=>{
 const dir=await tmp(t);await fs.writeFile(path.join(dir,'package.json'),JSON.stringify({dependencies:{'@resvg/resvg-js':'^2.6.2'}}));await assert.rejects(loadRenderer(dir),/directly pin/);await assert.rejects(loadRenderer(),/BLOCKED/);
});
test('missing executable is explicit BLOCKED / 缺失程序明确阻塞',async()=>{await assert.rejects(runProcess('omni-no-such-executable-test',[]),/BLOCKED missing executable/);const d=await doctor({'tool-env':'/does-not-exist',ffmpeg:'omni-no-ffmpeg-test',ffprobe:'omni-no-ffprobe-test'});assert.equal(d.status,'BLOCKED');assert.ok(d.blocked.length>=3);});
test('bounded child stderr/stdout / 子进程输出有界',async()=>{
 const r=await runProcess(process.execPath,['-e',"process.stderr.write('x'.repeat(50000));console.log('ok')"]);assert.equal(r.stdout.trim(),'ok');assert.equal(Buffer.byteLength(r.stderr),32768);
 await assert.rejects(runProcess(process.execPath,['-e',"process.stdout.write('x'.repeat(50000))"],{maxOutput:1000}),/output limit/);
});
test('timeout kills owned descendants and waits / 超时清理本作业后代',async t=>{
 const dir=await tmp(t),pidfile=path.join(dir,'pid');const code=`const {spawn}=require('node:child_process');const fs=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(pidfile)},String(c.pid));setInterval(()=>{},1000);`;
 await assert.rejects(runProcess(process.execPath,['-e',code],{timeoutMs:400}),/TIMEOUT/);const pid=Number(await fs.readFile(pidfile,'utf8'));const stat=await fs.readFile(`/proc/${pid}/stat`,'utf8').catch(()=>null);if(stat)assert.match(stat,/\) [ZX] /);
});
test('cancellation kills owned child / 取消清理本作业进程',async()=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new Error('CANCELLED test / 测试取消')),100);await assert.rejects(runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{signal:controller.signal}),/CANCELLED/);clearTimeout(timer);
});
test('collision rejects before rendering, no overwrite / 碰撞拒绝且不覆盖',async t=>{
 const dir=await tmp(t);await fs.writeFile(path.join(dir,'scene.mjs'),'export function renderFrame(){}');await fs.writeFile(path.join(dir,'project.json'),JSON.stringify(base()));await fs.mkdir(path.join(dir,'exists'));await fs.writeFile(path.join(dir,'exists/keep'),'keep');await assert.rejects(render({project:path.join(dir,'project.json'),'output-root':dir,name:'exists','tool-env':dir}),/COLLISION/);assert.equal(await fs.readFile(path.join(dir,'exists/keep'),'utf8'),'keep');
});
