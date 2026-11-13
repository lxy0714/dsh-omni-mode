import {fail,LIMITS} from './project.mjs';
const TAGS=new Set(['svg','g','rect','circle','ellipse','line','polyline','polygon','path','text','tspan','defs','linearGradient','radialGradient','stop','clipPath','image']);
const ATTRS=new Set('xmlns viewBox width height id x y x1 x2 y1 y2 cx cy r rx ry d points fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin opacity transform font-family font-size font-weight text-anchor dominant-baseline dx dy letter-spacing clip-path gradientUnits gradientTransform offset stop-color stop-opacity href preserveAspectRatio'.split(' '));
function entities(s){return s.replace(/&([^;]+);/g,(_,e)=>{if(e==='amp')return '&';if(e==='lt')return '<';if(e==='gt')return '>';if(e==='quot')return '"';if(e==='apos')return "'";if(/^#(?:[0-9]+|x[0-9a-f]+)$/i.test(e)){const n=e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):Number(e.slice(1));if(n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff))return String.fromCodePoint(n);}fail('unsafe XML entity / 不安全XML实体');});}
export function validateSvg(svg,{width,height,assetUris=[],fontFamilies=[],coverage=[]}){
 if(typeof svg!=='string'||Buffer.byteLength(svg)>LIMITS.maxSvgBytes)fail('SVG byte limit / SVG字节超限');
 if(/<!|<\?|\u0000/.test(svg))fail('SVG declarations/comments forbidden / 禁止SVG声明和注释');
 const stack=[],ids=new Set(),refs=[],texts=[];let cursor=0,roots=0,nodes=0;
 while(cursor<svg.length){if(svg[cursor]!=='<'){let end=svg.indexOf('<',cursor);if(end<0)end=svg.length;const s=entities(svg.slice(cursor,end));if(s.trim()){if(!['text','tspan'].includes(stack.at(-1)))fail('text outside text node / 文字必须在text内');texts.push(s);}cursor=end;continue;}
 const match=/^<(\/)?([A-Za-z][A-Za-z0-9]*)([^<>]*?)(\/?)>/.exec(svg.slice(cursor));if(!match)fail('malformed SVG / SVG语法错误');cursor+=match[0].length;const [,closing,tag,raw,self]=match;if(!TAGS.has(tag))fail(`unsafe/unsupported SVG element / SVG元素不支持: ${tag}`);
 if(closing){if(raw.trim()||self||stack.pop()!==tag)fail('SVG closing mismatch / SVG闭合错误');continue;}
 if(++nodes>10000)fail('SVG node limit / SVG节点超限');if(!stack.length){if(tag!=='svg'||++roots>1)fail('one SVG root required / 仅允许一个SVG根');}else if(tag==='svg')fail('nested SVG forbidden / 禁止嵌套SVG');
 const attrs={};let rest=raw;while(rest.trim()){const a=/^\s+([A-Za-z][A-Za-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(rest);if(!a)fail('SVG attribute syntax / SVG属性语法错误');rest=rest.slice(a[0].length);const key=a[1],v=entities(a[2]??a[3]);if(!ATTRS.has(key)||key in attrs)fail(`unsupported/duplicate SVG attribute / SVG属性不支持或重复: ${key}`);attrs[key]=v;if(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)||(key!=='xmlns'&&/javascript:|https?:|file:|@import|expression\s*\(/i.test(v)))fail('unsafe SVG attribute value / SVG属性值不安全');
 if(key==='href'){if(tag!=='image'||!assetUris.includes(v))fail('unknown image resource / 未授权图像资源');}
 else if(key==='xmlns'){if(tag!=='svg'||v!=='http://www.w3.org/2000/svg')fail('SVG namespace / SVG命名空间错误');}
 else if(/url\s*\(/i.test(v)){const m=/^url\(#([A-Za-z][\w-]*)\)$/.exec(v);if(!m||!['fill','stroke','clip-path'].includes(key))fail('external SVG URL forbidden / 禁止SVG外部URL');refs.push(m[1]);}
 else if(/(?:data:|[\\]|&)/i.test(v))fail('unsafe SVG value / SVG值不安全');
 if(key==='id'){if(!/^[A-Za-z][\w-]*$/.test(v)||ids.has(v))fail('SVG id invalid / SVG标识无效');ids.add(v);}
 if(key==='font-family'&&!fontFamilies.includes(v))fail('font family not explicitly authorized / 字体未明确授权');
 }
 if(tag==='svg'&&Object.keys(attrs).some(k=>!['xmlns','viewBox','width','height'].includes(k)))fail('SVG root accepts dimensions and namespace only / SVG根仅接受尺寸和命名空间');
 if(tag==='svg'&&(attrs.viewBox!==`0 0 ${width} ${height}`||attrs.width!==String(width)||attrs.height!==String(height)))fail('SVG root dimensions/viewBox mismatch / SVG尺寸或viewBox不符');
 if(tag==='image'&&!attrs.href)fail('image needs authorized href / 图像需要已授权href');
 if(['text','tspan'].includes(tag)&&!fontFamilies.length)fail('text needs explicit font files / 文字需要显式字体文件');
 if(!self)stack.push(tag);if(stack.length>32)fail('SVG nesting limit / SVG嵌套超限');
 }
 if(stack.length||roots!==1)fail('incomplete SVG / SVG不完整');for(const ref of refs)if(!ids.has(ref))fail('unknown SVG resource / 未知SVG资源');
 for(const text of texts)for(const ch of text){if(!/\s/u.test(ch)&&!coverage.some(fn=>fn(ch.codePointAt(0))))fail(`font coverage missing / 字体缺字 U+${ch.codePointAt(0).toString(16).toUpperCase()}`);}
 return {nodes,text:texts.join('')};
}
export function opaqueSvg(svg,width,height,background){const i=svg.indexOf('>')+1;return svg.slice(0,i)+`<rect width="${width}" height="${height}" fill="${background}"/>`+svg.slice(i);}
