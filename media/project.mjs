import fs from 'node:fs/promises';
import path from 'node:path';
export const LIMITS = Object.freeze({maxPixels:4194304,maxFrames:300,maxTotalPixels:314572800,maxSvgBytes:2097152,maxAssetBytes:16777216,maxAssets:16,maxFonts:8,maxFontBytes:33554432,maxAudioBytes:67108864,maxSeconds:30});
export function fail(message){throw new Error(message);}
export function strict(o, keys, label){if(!o || typeof o!=='object'||Array.isArray(o)) fail(`${label}: expected object / 需要对象`);for(const k of Object.keys(o))if(!keys.includes(k)) fail(`${label}: unknown field / 未知字段 ${k}`);}
function integer(n,min,max,label){if(!Number.isSafeInteger(n)||n<min||n>max)fail(`${label}: integer ${min}..${max} / 整数越界`);}
export function validateProject(p){
 strict(p,['version','scene','width','height','background','fps','frameCount','seed','formats','audio','fonts','assets'],'project');
 if(p.version!==1)fail('version: expected 1 / 需要版本1');
 if(typeof p.scene!=='string'||!p.scene.endsWith('.mjs'))fail('scene: standalone .mjs required / 需要独立mjs源码');
 integer(p.width,2,2048,'width');integer(p.height,2,2048,'height');if(p.width*p.height>LIMITS.maxPixels)fail('pixel limit / 像素超限');
 if(!/^#[0-9a-f]{6}$/i.test(p.background))fail('background: opaque #RRGGBB required / 需要不透明背景');
 strict(p.fps,['num','den'],'fps');integer(p.fps.num,1,60000,'fps.num');integer(p.fps.den,1,10000,'fps.den');
 const rate=p.fps.num/p.fps.den;if(rate<1||rate>60)fail('fps outside 1..60 / 帧率越界');
 integer(p.frameCount,1,LIMITS.maxFrames,'frameCount');integer(p.seed,0,4294967295,'seed');
 if(p.frameCount/rate>LIMITS.maxSeconds||p.width*p.height*p.frameCount>LIMITS.maxTotalPixels)fail('timeline/work limit / 时间线或工作量超限');
 if(!Array.isArray(p.formats)||!p.formats.length||new Set(p.formats).size!==p.formats.length||p.formats.some(x=>!['svg','png','gif','mp4'].includes(x)))fail('formats: svg/png/gif/mp4 only / 格式错误');
 if(p.formats.includes('mp4')&&(p.width%2||p.height%2))fail('MP4 requires even dimensions / MP4宽高必须偶数');
 if(p.audio===undefined&&p.formats.some(f=>['gif','mp4'].includes(f)))fail('AUDIO_CHOICE_REQUIRED: ask user, skipped answer is not consent / 必须询问音频，跳过不代表同意');
 if(p.audio!==undefined){strict(p.audio,['decision','choice','path'],'audio');
 if(p.audio.decision!=='asked'||!['silent','provided'].includes(p.audio.choice))fail('AUDIO_CHOICE_REQUIRED: record explicit user choice; not an authorization mechanism / 记录明确音频选择，不是授权机制');
 if(p.audio.choice==='provided'&&(typeof p.audio.path!=='string'||!p.formats.includes('mp4')))fail('provided audio needs local path and mp4 / 提供音频需要路径与MP4');
 if(p.audio.choice==='silent'&&p.audio.path!==undefined)fail('silent audio must not carry path / 静音不能带音频路径');}
 if(!Array.isArray(p.fonts)||p.fonts.length>LIMITS.maxFonts)fail('fonts: explicit array required / 需要显式字体数组');
 // A font may live outside the project (users bring their own licensed font), but
 // that must be an explicit, acknowledged choice: an escaping relative path is a
 // mistake, and an outside path requires externalAuthorization so nothing is
 // silently read from the filesystem just because it happens to be readable.
 for(const f of p.fonts){strict(f,['path','family','externalAuthorization'],'font');if(typeof f.path!=='string'||typeof f.family!=='string'||!f.family||!/^[-\w\s\u3400-\u9fff]+$/u.test(f.family))fail('invalid explicit font / 显式字体无效');
  if(!path.isAbsolute(f.path)&&/^\.\.(\/|$)/.test(path.normalize(f.path)))fail('font path escapes the project; use an absolute path with externalAuthorization / 字体路径逃逸项目；项目外字体请用绝对路径并声明授权');
  if(path.isAbsolute(f.path)&&f.externalAuthorization!==true)fail('font outside the project requires externalAuthorization:true / 项目外字体需显式声明 externalAuthorization:true');}
 if(!Array.isArray(p.assets)||p.assets.length>LIMITS.maxAssets)fail('assets limit / 素材超限');
 const ids=new Set();for(const a of p.assets){strict(a,['id','path','license'],'asset');if(!/^[a-z][a-z0-9_-]{0,39}$/i.test(a.id)||ids.has(a.id)||typeof a.path!=='string'||typeof a.license!=='string'||!a.license.trim())fail('asset needs unique id, path and license / 素材需要唯一ID、路径和授权');ids.add(a.id);}
 return p;
}
export function contained(root,target){return target===root||target.startsWith(root+path.sep);}
export async function localFile(root,relative,maxBytes){
 if(typeof relative!=='string'||!relative||path.isAbsolute(relative))fail('project-local relative path required / 需要项目内相对路径');
 const candidate=await fs.realpath(path.resolve(root,relative));if(!contained(root,candidate))fail('path escapes project (including symlink) / 路径或软链接逃逸项目');
 const st=await fs.stat(candidate);if(!st.isFile()||st.size>maxBytes)fail('resource type/byte limit / 资源类型或字节超限');return candidate;
}
export function rasterInfo(b){
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {mime:'image/png',width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
 if(b.length>=10&&/^GIF8[79]a$/.test(b.toString('ascii',0,6)))return {mime:'image/gif',width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
 if(b.length>4&&b[0]===255&&b[1]===216){let i=2;while(i+4<b.length){if(b[i++]!==255)break;let marker=b[i++];if(marker===217||marker===218)break;let n=b.readUInt16BE(i);if(n<2||i+n>b.length)break;if([192,193,194].includes(marker))return {mime:'image/jpeg',height:b.readUInt16BE(i+3),width:b.readUInt16BE(i+5)};i+=n;}}
 fail('asset must be bounded PNG/JPEG/GIF raster / 素材仅支持有界PNG/JPEG/GIF');
}
export async function loadProject(filename){
 const file=await fs.realpath(filename),root=path.dirname(file);const st=await fs.stat(file);if(st.size>65536)fail('project JSON too large / 项目JSON超限');const p=validateProject(JSON.parse(await fs.readFile(file,'utf8')));
 const scene=await localFile(root,p.scene,262144),assets=[];
 for(const a of p.assets){const file=await localFile(root,a.path,LIMITS.maxAssetBytes),bytes=await fs.readFile(file),info=rasterInfo(bytes);if(!info.width||!info.height||info.width*info.height>LIMITS.maxPixels)fail('asset pixel limit / 素材像素超限');assets.push({...a,file,bytes,info});}
 if(assets.reduce((n,a)=>n+a.bytes.length,0)>33554432)fail('total asset byte limit / 素材总字节超限');
 const fonts=[];for(const f of p.fonts){
  // Inside the project, reuse the same containment helper as assets; outside it,
  // the explicit externalAuthorization above is the acknowledgement.
  const file=f.externalAuthorization===true&&path.isAbsolute(f.path)?await fs.realpath(f.path):await localFile(root,f.path,LIMITS.maxFontBytes);
  const st=await fs.stat(file);if(!st.isFile()||st.size>LIMITS.maxFontBytes)fail('font limit / 字体超限');fonts.push({...f,file});}
 const audio=p.audio?.choice==='provided'?await localFile(root,p.audio.path,LIMITS.maxAudioBytes):null;
 return {p,file,root,scene,assets,fonts,audio};
}
