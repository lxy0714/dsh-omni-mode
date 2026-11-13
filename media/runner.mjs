#!/usr/bin/env node
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadProject,localFile,fail,rasterInfo,validateProject} from './project.mjs';
import {validateSvg} from './svg.mjs';
import {fontCoverage} from './fonts.mjs';
import {loadRenderer} from './toolchain.mjs';
import {runProcess,toolVersion,linkedAbort} from './process.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const save=async(f,o)=>fs.writeFile(f,JSON.stringify(o,null,2)+'\n',{flag:'wx'});
function options(args){const [action,...rest]=args,o={action};for(let i=0;i<rest.length;i+=2){const k=rest[i];if(!['--project','--output-root','--name','--tool-env','--ffmpeg','--ffprobe','--timeout-ms','--artifact'].includes(k)||!rest[i+1]||rest[i+1].startsWith('--')||k.slice(2) in o)fail('unknown/repeated/missing CLI option / 命令行参数未知、重复或缺失');o[k.slice(2)]=rest[i+1];}return o;}
function binaries(o){return {ffmpeg:o.ffmpeg??'ffmpeg',ffprobe:o.ffprobe??'ffprobe'};}
export async function doctor(o={}){
 const report={status:'ready',node:process.version,platform:`${process.platform}/${process.arch}`,renderer:null,ffmpeg:null,ffprobe:null,blocked:[]};
 if(Number(process.versions.node.split('.')[0])<24)report.blocked.push('Node >=24 required / 需要Node24+');
 try{const {Resvg,version,nativePackage}=await loadRenderer(o['tool-env']);const bytes=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#ff0000"/></svg>',{font:{loadSystemFonts:false}}).render().asPng();if(rasterInfo(bytes).width!==8)fail('renderer smoke failed / 渲染烟测失败');report.renderer=version;report.rendererNative=nativePackage;}catch(e){report.blocked.push(e.message);}
 for(const [k,v]of Object.entries(binaries(o)))try{report[k]=await toolVersion(v);}catch(e){report.blocked.push(e.message);}
 report.features={h264:false,aac:false,gifPalette:false};
 if(report.ffmpeg)try{const enc=await runProcess(binaries(o).ffmpeg,['-hide_banner','-encoders'],{maxOutput:262144,timeoutMs:10000}),filters=await runProcess(binaries(o).ffmpeg,['-hide_banner','-filters'],{maxOutput:262144,timeoutMs:10000});report.features={h264:/\blibx264\b/.test(enc.stdout),aac:/\baac\b/.test(enc.stdout),gifPalette:/\bpalettegen\b/.test(filters.stdout)&&/\bpaletteuse\b/.test(filters.stdout)};}catch(e){report.blocked.push(e.message);}
 const nodeReady=Number(process.versions.node.split('.')[0])>=24,svgReady=nodeReady&&Boolean(report.renderer),full=svgReady&&Boolean(report.ffmpeg)&&Boolean(report.ffprobe);
 report.perFormat={svg:{ready:svgReady,requires:['node24','resvg2.6.2']},png:{ready:full,requires:['node24','resvg2.6.2','ffmpeg','ffprobe']},gif:{ready:full&&report.features.gifPalette,requires:['node24','resvg2.6.2','ffmpeg-palettegen-paletteuse','ffprobe']},mp4:{ready:full&&report.features.h264&&report.features.aac,requires:['node24','resvg2.6.2','ffmpeg-libx264-aac','ffprobe']}};
 if(report.ffmpeg&&(!report.features.h264||!report.features.aac||!report.features.gifPalette))report.blocked.push('FFmpeg lacks required H264/AAC/palette features / FFmpeg缺少所需编码或调色板功能');
 if(report.blocked.length)report.status='BLOCKED';return report;
}
async function hashFile(file){const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(file,{highWaterMark:65536}))hash.update(chunk);return hash.digest('hex');}
async function inventory(root){const entries=[];let bytes=0,count=0;async function walk(dir,depth){if(depth>8)fail('artifact depth limit / 产物层级超限');for(const name of await fs.readdir(dir)){if(++count>1024)fail('artifact entry limit / 产物文件数超限');const f=path.join(dir,name),st=await fs.lstat(f);if(st.isSymbolicLink())fail('artifact symlink forbidden / 产物禁止软链接');if(st.isDirectory())await walk(f,depth+1);else if(st.isFile()){bytes+=st.size;if(st.size>536870912||bytes>2147483648)fail('artifact byte limit / 产物字节超限');if(!(dir===root&&['manifest.json','.owner.json','.complete.json'].includes(name)))entries.push({path:path.relative(root,f).split(path.sep).join('/'),bytes:st.size,sha256:await hashFile(f)});}else fail('artifact must contain regular files / 产物仅允许常规文件');}}await walk(root,0);return entries.sort((a,b)=>a.path.localeCompare(b.path));}
async function ownedRemove(stage,runId){if(!stage)return;const owner=await json(path.join(stage,'.owner.json')).catch(()=>null);if(owner?.runId!==runId||path.basename(stage)!==`.omni-stage-${runId}`)fail('refuse unowned cleanup / 拒绝清理非本作业目录');const real=await fs.realpath(stage);if(real!==stage)fail('refuse redirected cleanup / 拒绝重定向清理');await fs.rm(stage,{recursive:true,force:false});}
async function publishTree(stage,destination,signal){
 // Name reservation is atomic; publishing the directory is NOT. Commit is written last.
 // Cleanup only removes recorded inode-owned entries, never recursive user paths.
 const created=[];async function track(file,directory){const s=await fs.lstat(file);created.push({file,directory,ino:s.ino,dev:s.dev});}
 const cleanup=async()=>{for(const item of created.toReversed()){const s=await fs.lstat(item.file).catch(()=>null);if(s&&s.ino===item.ino&&s.dev===item.dev)await (item.directory?fs.rmdir(item.file):fs.unlink(item.file)).catch(()=>{});}};
 try{await fs.mkdir(destination);await track(destination,true);
 async function linkDir(from,to){for(const e of await fs.readdir(from,{withFileTypes:true})){if(signal.aborted)throw signal.reason;const src=path.join(from,e.name),dest=path.join(to,e.name);if(e.isDirectory()){await fs.mkdir(dest);await track(dest,true);await linkDir(src,dest);}else if(e.isFile()){await fs.copyFile(src,dest,fs.constants.COPYFILE_EXCL);await track(dest,false);}else fail('unexpected publish entry / 发布项无效');}}
 await linkDir(stage,destination);return cleanup;
 }catch(e){await cleanup();throw e;}
}
async function probe(file,o,signal,commands){const {ffprobe}=binaries(o);const r=await runProcess(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{signal,onCommand:c=>commands?.push(c)});return JSON.parse(r.stdout);}
async function decode(file,o,signal,commands){return runProcess(binaries(o).ffmpeg,['-v','error','-nostdin','-threads','1','-i',file,'-f','null','-'],{signal,onCommand:c=>commands?.push(c)});}
async function verifyFaststart(file){const handle=await fs.open(file,'r');try{const size=(await handle.stat()).size;let position=0,moov=-1,mdat=-1;for(let n=0;n<10000&&position+8<=size;n++){const header=Buffer.alloc(16);await handle.read(header,0,Math.min(16,size-position),position);let length=header.readUInt32BE(0);const type=header.toString('ascii',4,8);if(length===1){const large=header.readBigUInt64BE(8);if(large>BigInt(Number.MAX_SAFE_INTEGER))fail('MP4 box size / MP4箱体超限');length=Number(large);}if(length===0)length=size-position;if(length<8||position+length>size)fail('MP4 box invalid / MP4箱体无效');if(type==='moov')moov=position;if(type==='mdat')mdat=position;position+=length;}if(moov<0||mdat<0||moov>mdat)fail('MP4 faststart verification failed / MP4 faststart验证失败');}finally{await handle.close();}}
function visualStream(info,p,kind){const v=info.streams?.find(s=>s.codec_type==='video');if(!v||v.width!==p.width||v.height!==p.height)fail('output dimensions mismatch / 输出尺寸不符');if(kind==='mp4'&&(v.codec_name!=='h264'||v.pix_fmt!=='yuv420p'))fail('MP4 codec mismatch / MP4编码不符');return v;}
async function verifyOutputs(root,p,o,signal,commands){
 validateProject(p);
 const source=await loadProject(path.join(root,'source/project.json')),coverage=await Promise.all(source.fonts.map(f=>fontCoverage(f.file))),svgOptions={width:p.width,height:p.height,fontFamilies:source.fonts.map(f=>f.family),coverage,assetUris:source.assets.map(a=>`data:${a.info.mime};base64,${a.bytes.toString('base64')}`)};
 const svgDir=await fs.stat(path.join(root,'source/frames')).then(()=>path.join(root,'source/frames'),()=>path.join(root,'.frames'));
 for(let i=0;i<p.frameCount;i++)validateSvg(await fs.readFile(path.join(svgDir,String(i).padStart(6,'0')+'.svg'),'utf8'),svgOptions);
 const results={};for(const format of p.formats){if(format==='svg'){const s=await fs.readFile(path.join(root,'poster.svg'),'utf8');validateSvg(s,svgOptions);results.svg={bytes:Buffer.byteLength(s)};continue;}
 const name={png:'poster.png',gif:'animation.gif',mp4:'animation.mp4'}[format],file=path.join(root,name);const info=await probe(file,o,signal,commands),v=visualStream(info,p,format);await decode(file,o,signal,commands);
 const duration=Number(info.format?.duration??v.duration),expected=p.frameCount*p.fps.den/p.fps.num;
 if(format==='mp4'&&(!Number.isFinite(duration)||Math.abs(duration-expected)>Math.max(.12,p.fps.den/p.fps.num)))fail('MP4 duration mismatch / MP4时长不符');
 if(format==='gif'&&(!Number.isFinite(duration)||Math.abs(duration-expected)>Math.max(.15,p.frameCount*.006)))fail('GIF cadence/duration mismatch / GIF节奏或时长不符');
 if(['gif','mp4'].includes(format)&&Number(v.nb_frames)!==p.frameCount)fail('encoded frame count mismatch / 编码帧数不符');
 if(format==='mp4'){await verifyFaststart(file);const audio=info.streams.filter(s=>s.codec_type==='audio');if(p.audio.choice==='provided'&&!audio.length||p.audio.choice==='silent'&&audio.length)fail('audio decision mismatch / 音频选择不符');if(audio.length){const d=Number(audio[0].duration);if(!Number.isFinite(d)||d<expected-.12||d>expected+.2)fail('encoded audio duration mismatch / 编码音频时长不符');}}
 if(format==='png'){const decoded=await runProcess(binaries(o).ffmpeg,['-v','error','-nostdin','-threads','1','-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','-threads','1','pipe:1'],{signal,binaryOutput:true,maxOutput:p.width*p.height*4,onCommand:c=>commands?.push(c)});if(decoded.stdout.length!==p.width*p.height*4)fail('PNG pixel decode size / PNG解码像素不符');for(let i=3;i<decoded.stdout.length;i+=4)if(decoded.stdout[i]!==255)fail('PNG must be explicitly opaque / PNG必须显式不透明');}
 results[format]={codec:v.codec_name,pixelFormat:v.pix_fmt,width:v.width,height:v.height,frames:v.nb_frames??null,duration:Number.isFinite(duration)?duration:null,fullyDecoded:true,probe:info};
 }
 return results;
}
export async function render(o){
 const required=['project','output-root','name','tool-env'];for(const k of required)if(!o[k])fail(`--${k} required / 必填参数`);
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(o.name))fail('name must be a new simple basename / 名称须为新目录简单名称');
 const timeout=Number(o['timeout-ms']??120000);if(!Number.isSafeInteger(timeout)||timeout<100||timeout>600000)fail('timeout-ms 100..600000 / 超时范围错误');
 const job=await loadProject(o.project),p=job.p,root=await fs.realpath(o['output-root']);if(!(await fs.stat(root)).isDirectory())fail('output-root directory required / 需要输出根目录');
 const destination=path.join(root,o.name);if(await fs.lstat(destination).then(()=>true,()=>false))fail('COLLISION no overwrite / 目录已存在，不覆盖');
 const ready=await doctor(o);if(p.formats.some(f=>!ready.perFormat[f].ready))fail(`BLOCKED / 所需格式依赖未就绪: ${ready.blocked.join('; ')}`);
 const runId=crypto.randomUUID(),stage=path.join(root,`.omni-stage-${runId}`),abort=linkedAbort(timeout),commands=[];let published=false,publishCleanup;
 try{
 await fs.mkdir(stage);await save(path.join(stage,'.owner.json'),{runId});const source=path.join(stage,'source'),frames=path.join(stage,'.frames'),proof=path.join(stage,'proof');await fs.mkdir(source);await fs.mkdir(frames);await fs.mkdir(proof);await fs.mkdir(path.join(source,'assets'));
 const snapshot=structuredClone(p);snapshot.scene='scene.mjs';snapshot.fonts=job.fonts.map(f=>({path:f.file,family:f.family}));
 await fs.copyFile(job.scene,path.join(source,'scene.mjs'),fs.constants.COPYFILE_EXCL);const embedded=[];
 for(let i=0;i<job.assets.length;i++){const a=job.assets[i],ext={"image/png":'.png',"image/jpeg":'.jpg',"image/gif":'.gif'}[a.info.mime],relative=`assets/${a.id}${ext}`;await fs.writeFile(path.join(source,relative),a.bytes,{flag:'wx'});snapshot.assets[i].path=relative;embedded.push({id:a.id,uri:`data:${a.info.mime};base64,${a.bytes.toString('base64')}`});}
 if(job.audio){snapshot.audio.path='assets/audio'+path.extname(job.audio);await fs.copyFile(job.audio,path.join(source,snapshot.audio.path),fs.constants.COPYFILE_EXCL);const a=await probe(path.join(source,snapshot.audio.path),o,abort.signal,commands),stream=a.streams?.find(s=>s.codec_type==='audio'),duration=Number(stream?.duration??a.format?.duration),expected=p.frameCount*p.fps.den/p.fps.num;if(!stream||!Number.isFinite(duration)||duration<expected-.02)fail('audio shorter than timeline or invalid / 音频无效或短于时间线');await decode(path.join(source,snapshot.audio.path),o,abort.signal,commands);}
 await save(path.join(source,'project.json'),snapshot);
 await save(path.join(stage,'.worker.json'),{project:snapshot,scene:path.join(source,'scene.mjs'),toolEnv:await fs.realpath(o['tool-env']),frames,assets:embedded,fonts:job.fonts.map(f=>({path:f.file,family:f.family}))});
 await runProcess(process.execPath,[path.join(HERE,'worker.mjs'),path.join(stage,'.worker.json')],{cwd:source,signal:abort.signal,timeoutMs:timeout,onCommand:c=>commands.push(c)});
 const expectedNames=new Set(Array.from({length:p.frameCount},(_,i)=>String(i).padStart(6,'0')).flatMap(s=>[s+'.svg',s+'.png']));expectedNames.add('font-proof.png');for(const name of await fs.readdir(frames))if(!expectedNames.has(name))fail('unexpected producer resource / 生成器资源未知');
 for(let i=0;i<p.frameCount;i++){const file=path.join(frames,String(i).padStart(6,'0')+'.png');const resolved=await localFile(stage,path.relative(stage,file),33554432),info=rasterInfo(await fs.readFile(resolved));if(info.width!==p.width||info.height!==p.height)fail('producer PNG dimensions mismatch / 生成PNG尺寸不符');}
 if(p.formats.includes('svg'))await fs.copyFile(path.join(frames,'000000.svg'),path.join(stage,'poster.svg'),fs.constants.COPYFILE_EXCL);
 if(p.formats.includes('png'))await fs.copyFile(path.join(frames,'000000.png'),path.join(stage,'poster.png'),fs.constants.COPYFILE_EXCL);
 const ff=binaries(o).ffmpeg,rate=`${p.fps.num}/${p.fps.den}`,input=path.join(frames,'%06d.png');
 if(p.formats.includes('mp4')){
 const args=['-v','error','-nostdin','-n','-threads','1','-framerate',rate,'-i',input];if(job.audio)args.push('-i',path.join(source,snapshot.audio.path));args.push('-map','0:v:0');if(job.audio)args.push('-map','1:a:0','-c:a','aac','-b:a','128k','-t',String(p.frameCount*p.fps.den/p.fps.num));else args.push('-an');args.push('-frames:v',String(p.frameCount),'-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-movflags','+faststart',path.join(stage,'animation.mp4'));
 await runProcess(ff,args,{signal:abort.signal,onCommand:c=>commands.push(c)});
 }
 if(p.formats.includes('gif'))await runProcess(ff,['-v','error','-nostdin','-n','-threads','1','-framerate',rate,'-i',input,'-filter_complex_threads','1','-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0',path.join(stage,'animation.gif')],{signal:abort.signal,onCommand:c=>commands.push(c)});
 const verification=await verifyOutputs(stage,p,o,abort.signal,commands);
 for(const format of p.formats.filter(x=>['mp4','gif'].includes(x))){const name=format==='mp4'?'animation.mp4':'animation.gif';for(const [label,index]of [['first',0],['middle',Math.floor((p.frameCount-1)/2)],['last',p.frameCount-1]])await runProcess(ff,['-v','error','-nostdin','-n','-threads','1','-i',path.join(stage,name),'-vf',`select=eq(n\\,${index})`,'-frames:v','1','-threads','1',path.join(proof,`${format}-${label}.png`)],{signal:abort.signal,onCommand:c=>commands.push(c)});}
 await fs.copyFile(path.join(frames,'000000.png'),path.join(proof,'render-first.png'),fs.constants.COPYFILE_EXCL);if(await fs.stat(path.join(frames,'font-proof.png')).catch(()=>null))await fs.copyFile(path.join(frames,'font-proof.png'),path.join(proof,'font-proof.png'),fs.constants.COPYFILE_EXCL);
 await fs.mkdir(path.join(source,'frames'));for(let i=0;i<p.frameCount;i++){const name=String(i).padStart(6,'0')+'.svg';await fs.rename(path.join(frames,name),path.join(source,'frames',name));}
 // Delete only known, owned intermediates; never user-selected recursive paths.
 for(const name of await fs.readdir(frames))await fs.unlink(path.join(frames,name));await fs.rmdir(frames);await fs.unlink(path.join(stage,'.worker.json'));
 const fonts=[];for(const f of job.fonts)fonts.push({family:f.family,path:f.file,sha256:await hashFile(f.file),redistributed:false});
 const manifest={version:1,runId,settings:p,toolchain:{...ready,nodeExecutable:process.execPath,os:os.platform()},source:{sceneSha256:await hashFile(path.join(source,'scene.mjs')),fonts,assets:job.assets.map(a=>({id:a.id,license:a.license,sha256:sha(a.bytes)}))},commands:commands.map(c=>({executable:c.executable,args:c.args.map(a=>a.replaceAll(stage,'<ARTIFACT>'))})),verification,gifCadence:p.formats.includes('gif')?{requested:p.fps,unit:'centiseconds; quantized by GIF encoder / GIF百分之一秒量化',exactFpsClaim:false}:null,reproduce:{command:'node <BUNDLE>/media/runner.mjs render --project <ARTIFACT>/source/project.json --output-root <AUTHORIZED_OUTPUT_ROOT> --name <NEW_NAME> --tool-env <AUTHORIZED_TOOL_ENV>',externalFontsRequired:true},files:await inventory(stage)};
 await save(path.join(stage,'manifest.json'),manifest);if(abort.signal.aborted)throw abort.signal.reason;
 // No destination exists until every output is finalized and verified.
 publishCleanup=await publishTree(stage,destination,abort.signal);
 if(JSON.stringify(await inventory(destination))!==JSON.stringify(manifest.files))fail('publication inventory mismatch / 发布清单不符');
 if(abort.signal.aborted)throw abort.signal.reason;
 await save(path.join(destination,'.complete.json'),{runId,manifestSha256:await hashFile(path.join(destination,'manifest.json')),fileCount:manifest.files.length});
 published=true;await ownedRemove(stage,runId);
 return {status:'verified',runId,artifact:destination,manifest:path.join(destination,'manifest.json'),proof:path.join(destination,'proof')};
 }finally{abort.close();if(!published&&publishCleanup)await publishCleanup();if(!published)await ownedRemove(stage,runId).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
export async function validate(o){
 if(!o.artifact)fail('--artifact required / 需要产物目录');const root=await fs.realpath(o.artifact),m=await json(path.join(root,'manifest.json'));if(m.version!==1||!Array.isArray(m.files))fail('invalid artifact manifest / 产物清单无效');
 const commit=await json(path.join(root,'.complete.json')).catch(()=>null);if(!commit||commit.runId!==m.runId||commit.manifestSha256!==await hashFile(path.join(root,'manifest.json'))||commit.fileCount!==m.files.length)fail('INCOMPLETE artifact commit missing/mismatch / 产物未完成或提交标记不符');
 const owner=await json(path.join(root,'.owner.json'));if(owner.runId!==m.runId)fail('artifact ownership mismatch / 产物所有权不符');
 const actual=await inventory(root);if(JSON.stringify(actual)!==JSON.stringify(m.files))fail('artifact hashes/inventory mismatch / 产物哈希或文件清单不符');
 const abort=linkedAbort(Number(o['timeout-ms']??120000));try{return {status:'verified',runId:m.runId,verification:await verifyOutputs(root,m.settings,o,abort.signal)}}finally{abort.close();}
}
export async function main(args=process.argv.slice(2)){const o=options(args);if(o.action==='doctor')return doctor(o);if(o.action==='render')return render(o);if(o.action==='validate')return validate(o);fail('usage / 用法: runner.mjs doctor|render|validate (see media/README.md)');}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().then(r=>{console.log(JSON.stringify(r,null,2));if(r.status==='BLOCKED')process.exitCode=2;}).catch(e=>{console.error(JSON.stringify({status:/BLOCKED/.test(e.message)?'BLOCKED':'error',message:e.message}));process.exitCode=1;});
