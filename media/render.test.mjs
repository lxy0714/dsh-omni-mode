import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {doctor,render,validate} from './runner.mjs';
import {runProcess} from './process.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const env=process.env.OMNI_MEDIA_TOOL_ENV;
const tools={'tool-env':env,ffmpeg:process.env.OMNI_MEDIA_FFMPEG??'ffmpeg',ffprobe:process.env.OMNI_MEDIA_FFPROBE??'ffprobe'};
const base=()=>({version:1,scene:'scene.mjs',width:64,height:48,background:'#112233',fps:{num:12,den:1},frameCount:6,seed:13,formats:['svg','png','gif','mp4'],audio:{decision:'asked',choice:'silent'},fonts:[],assets:[]});
const source=`export function renderFrame({width:w,height:h,index}){return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${w}" height="\${h}" viewBox="0 0 \${w} \${h}"><rect x="\${index*5}" y="8" width="18" height="22" fill="#ffcc00"/></svg>\`;}`;
async function setup(t,p=base(),scene=source){await fs.mkdir(path.join(here,'.test-runs'),{recursive:true});const root=await fs.mkdtemp(path.join(here,'.test-runs/real-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.writeFile(path.join(root,'project.json'),JSON.stringify(p));await fs.writeFile(path.join(root,'scene.mjs'),scene);return {root,options:{...tools,project:path.join(root,'project.json'),'output-root':root,name:'result'}};}
async function ready(t){if(!env){t.skip('BLOCKED no explicit OMNI_MEDIA_TOOL_ENV / 未指定授权媒体工具环境');return false;}const d=await doctor(tools);if(d.status!=='ready'){t.skip(`BLOCKED real dependencies: ${d.blocked.join('; ')}`);return false;}return true;}
async function noStage(root){assert.deepEqual((await fs.readdir(root)).filter(s=>s.startsWith('.omni-stage-')),[]);}
const digest=async file=>crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
test('real PNG/GIF/MP4 full decode + commit + reproducibility / 真渲染解码与复现',async t=>{
 if(!await ready(t))return;const {root,options}=await setup(t);const result=await render(options);assert.equal(result.status,'verified');const verified=await validate({...tools,artifact:result.artifact});assert.equal(verified.status,'verified');
 const manifest=JSON.parse(await fs.readFile(result.manifest));assert.equal(manifest.verification.mp4.codec,'h264');assert.equal(manifest.verification.mp4.pixelFormat,'yuv420p');assert.equal(Number(manifest.verification.mp4.frames),6);assert.equal(manifest.verification.gif.fullyDecoded,true);assert.equal(manifest.gifCadence.exactFpsClaim,false);assert.notEqual(await digest(path.join(result.proof,'mp4-first.png')),await digest(path.join(result.proof,'mp4-last.png')));
 const rerun=await render({...options,project:path.join(result.artifact,'source/project.json'),name:'reproduced'});assert.equal(await digest(path.join(result.artifact,'poster.png')),await digest(path.join(rerun.artifact,'poster.png')));assert.equal(await digest(path.join(result.artifact,'source/frames/000005.svg')),await digest(path.join(rerun.artifact,'source/frames/000005.svg')));
 await fs.writeFile(path.join(result.artifact,'unknown.txt'),'unknown');await assert.rejects(validate({...tools,artifact:result.artifact}),/inventory mismatch/);await fs.unlink(path.join(result.artifact,'unknown.txt'));await fs.unlink(path.join(result.artifact,'.complete.json'));await assert.rejects(validate({...tools,artifact:result.artifact}),/INCOMPLETE/);await noStage(root);
});
test('SVG-only succeeds without encoder executables / SVG无需编码器',async t=>{
 if(!env){t.skip('BLOCKED no explicit OMNI_MEDIA_TOOL_ENV / 未指定授权工具环境');return;}const p=base();p.formats=['svg'];delete p.audio;const {root,options}=await setup(t,p);const result=await render({...options,ffmpeg:'omni-deliberately-missing-ffmpeg',ffprobe:'omni-deliberately-missing-ffprobe'});assert.equal(result.status,'verified');await noStage(root);
});
test('real rational GIF cadence is measured, not exact30fps / 实测GIF量化节奏',async t=>{
 if(!await ready(t))return;const p=base();p.fps={num:30000,den:1001};p.formats=['gif'];const {options}=await setup(t,p);const result=await render(options);const m=JSON.parse(await fs.readFile(result.manifest));assert.equal(m.gifCadence.exactFpsClaim,false);assert.equal(Number(m.verification.gif.frames),6);assert.ok(Math.abs(m.verification.gif.duration-.2002)<.1);
});
test('authorized raster asset is embedded, actual composite renders / 授权位图嵌入并真实合成',async t=>{
 if(!await ready(t))return;const {root,options}=await setup(t);const first=await render(options);await fs.copyFile(path.join(first.artifact,'poster.png'),path.join(root,'supplied.png'));const p=base();p.assets=[{id:'hero',path:'supplied.png',license:'original generated test fixture / 原创代码测试素材'}];await fs.writeFile(path.join(root,'project.json'),JSON.stringify(p));await fs.copyFile(path.join(here,'examples/user-assets/scene.mjs'),path.join(root,'scene.mjs'));const second=await render({...options,name:'composition'});const m=JSON.parse(await fs.readFile(second.manifest));assert.equal(m.source.assets.length,1);assert.match(await fs.readFile(path.join(second.artifact,'source/frames/000000.svg'),'utf8'),/data:image\/png;base64,/);
});
test('actual explicit CJK font render and family mismatch / 显式中文字体实渲染与族校验',async t=>{
 if(!await ready(t))return;const font=process.env.OMNI_MEDIA_TEST_FONT;if(!font){t.skip('BLOCKED no explicit CJK font / 未指定中文字体');return;}
 const p=base();p.width=480;p.height=350;p.fonts=[{path:font,family:'Noto Sans CJK SC'}];const {options,root}=await setup(t,p,await fs.readFile(path.join(here,'examples/chinese/scene.mjs'),'utf8'));const result=await render(options);assert.ok((await fs.stat(path.join(result.proof,'font-proof.png'))).size>1000);
 p.fonts[0].family='Wrong Family';await fs.writeFile(path.join(root,'project.json'),JSON.stringify(p));await assert.rejects(render({...options,name:'badfont'}),/family does not match/);await noStage(root);
});
test('actual audio composition validates duration and stream / 真实音频合成与时长',async t=>{
 if(!await ready(t))return;const p=base();p.formats=['mp4'];p.audio={decision:'asked',choice:'provided',path:'tone.wav'};const {options,root}=await setup(t,p);
 await runProcess(tools.ffmpeg,['-v','error','-nostdin','-n','-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=1','-c:a','pcm_s16le',path.join(root,'tone.wav')]);const result=await render(options);const m=JSON.parse(await fs.readFile(result.manifest));assert.ok(m.verification.mp4.probe.streams.some(s=>s.codec_type==='audio'));assert.ok(m.verification.mp4.duration>=.49);
 await runProcess(tools.ffmpeg,['-v','error','-nostdin','-n','-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=0.1','-c:a','pcm_s16le',path.join(root,'short.wav')]);p.audio.path='short.wav';await fs.writeFile(path.join(root,'project.json'),JSON.stringify(p));await assert.rejects(render({...options,name:'short'}),/shorter/);await noStage(root);
});
test('producer unsafe SVG failure leaves no output/stage / 不安全SVG失败不留产物',async t=>{
 if(!await ready(t))return;const {root,options}=await setup(t,base(),source.replace('<rect x=', '<script x=').replace('/></svg>','/></svg>'));await assert.rejects(render(options),/unsupported SVG/);await noStage(root);await assert.rejects(fs.stat(path.join(root,'result')),{code:'ENOENT'});
});
test('producer actual timeout cleans owned staging only / 真实生产者超时仅清理本作业',async t=>{
 if(!await ready(t))return;const {root,options}=await setup(t,base(),'export function renderFrame(){while(true){}}');await fs.mkdir(path.join(root,'unrelated'));await fs.writeFile(path.join(root,'unrelated/keep'),'keep');await assert.rejects(render({...options,'timeout-ms':'300'}),/TIMEOUT/);await noStage(root);assert.equal(await fs.readFile(path.join(root,'unrelated/keep'),'utf8'),'keep');await assert.rejects(fs.stat(path.join(root,'result')),{code:'ENOENT'});
});
test('SIGTERM actual runner cancels producer, waits and cleans / 真实CLI取消与清理',async t=>{
 if(!await ready(t))return;const {root,options}=await setup(t,base(),'export function renderFrame(){while(true){}}');const args=[path.join(here,'runner.mjs'),'render'];for(const [k,v]of Object.entries(options))args.push('--'+k,v);
 const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});let out='';child.stderr.on('data',b=>out+=b.toString());child.stdout.resume();const finished=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal}));});
 let staged=false;for(let i=0;i<400;i++){if((await fs.readdir(root)).some(s=>s.startsWith('.omni-stage-'))){staged=true;break;}await delay(20);}assert.ok(staged,'runner must reach owned staging');child.kill('SIGTERM');const exit=await finished;assert.equal(exit.code,1);assert.match(out,/CANCELLED/);await noStage(root);await assert.rejects(fs.stat(path.join(root,'result')),{code:'ENOENT'});
});
