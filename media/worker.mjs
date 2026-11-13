// Executed only in an owned Node child, never imported into the DSH Host.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateProject} from './project.mjs';
import {validateSvg,opaqueSvg} from './svg.mjs';
import {fontCoverage} from './fonts.mjs';
import {loadRenderer} from './toolchain.mjs';
export function randomFor(seed,index){let s=(seed^Math.imul(index+1,0x9e3779b9))>>>0;return ()=>{s=(s+0x6d2b79f5)>>>0;let t=Math.imul(s^(s>>>15),s|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
async function main(){
 const config=JSON.parse(await fs.readFile(process.argv[2],'utf8')),p=validateProject(config.project),{Resvg}=await loadRenderer(config.toolEnv);
 const coverage=await Promise.all(config.fonts.map(f=>fontCoverage(f.path))),assets={};for(let i=0;i<config.fonts.length;i++)if(!coverage[i].families.includes(config.fonts[i].family))throw new Error('font family does not match file / 字体族与字体文件不符');for(const a of config.assets)assets[a.id]=a.uri;
 const module=await import(pathToFileURL(config.scene).href);if(typeof module.renderFrame!=='function')throw new Error('scene must export renderFrame(context) / 场景需导出renderFrame');
 const options={font:{loadSystemFonts:false,fontFiles:config.fonts.map(f=>f.path),defaultFontFamily:config.fonts[0]?.family},background:p.background,fitTo:{mode:'original'}};
 let text='';for(let index=0;index<p.frameCount;index++){
 const context=Object.freeze({width:p.width,height:p.height,background:p.background,fps:Object.freeze({...p.fps}),frameCount:p.frameCount,index,time:index*p.fps.den/p.fps.num,progress:p.frameCount===1?0:index/(p.frameCount-1),seed:p.seed,random:randomFor(p.seed,index),assets:Object.freeze({...assets})});
 let svg=await module.renderFrame(context);const info=validateSvg(svg,{width:p.width,height:p.height,assetUris:Object.values(assets),fontFamilies:config.fonts.map(f=>f.family),coverage});if(!text)text=info.text;
 svg=opaqueSvg(svg,p.width,p.height,p.background);const basename=String(index).padStart(6,'0');await fs.writeFile(path.join(config.frames,basename+'.svg'),svg,{flag:'wx'});
 const png=new Resvg(svg,options).render().asPng();await fs.writeFile(path.join(config.frames,basename+'.png'),png,{flag:'wx'});
 }
 if(text){const chars=Array.from(text).slice(0,54),lines=[];for(let i=0;i<chars.length;i+=18){const escaped=chars.slice(i,i+18).join('').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');lines.push(`<text x="16" y="${48+(i/18)*55}" font-family="${config.fonts[0].family}" font-size="30" fill="#101828">${escaped}</text>`);}const smoke=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200"><rect width="640" height="200" fill="#ffffff"/>${lines.join('')}</svg>`;await fs.writeFile(path.join(config.frames,'font-proof.png'),new Resvg(smoke,options).render().asPng(),{flag:'wx'});}
 process.stdout.write(JSON.stringify({frames:p.frameCount,textProof:Boolean(text)}));
}
if(process.argv[1]===new URL(import.meta.url).pathname)main().catch(error=>{console.error(error.message);process.exitCode=1;});
