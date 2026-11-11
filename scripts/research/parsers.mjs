// Static-only helpers. Never import/evaluate any researched package.
import { createRequire, stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const require = createRequire(import.meta.url);
function installed(name) {
  try { return require(name); } catch { return require(`/opt/dsh/node_modules/${name}`); }
}
const YAML = installed('yaml');
const acorn = installed('acorn');
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function safePath(base, relative) {
  if (typeof relative !== 'string' || relative.includes('\0') || relative.includes('\\') || /^(?:[a-z]+:|\/)/i.test(relative)) return null;
  const p = path.posix.normalize(path.posix.join(path.posix.dirname(base), relative));
  return p === '..' || p.startsWith('../') ? null : p.replace(/^\.\//, '');
}
// YAML core schema has NO executable JS tags. !!js is an opaque data scalar.
export function parseData(text, filename = '') {
  if (/\.json$/i.test(filename)) return JSON.parse(text);
  const doc = YAML.parseDocument(text, { schema: 'core', customTags: [{tag:'tag:yaml.org,2002:js', resolve: value => ({ $opaqueJs: String(value) })}], uniqueKeys: true, maxAliasCount: 50 });
  if (doc.errors.length) throw new Error(doc.errors.map(e => e.message).join('; '));
  if (doc.warnings.some(w => /unresolved tag/i.test(w.message))) throw new Error('unsupported YAML tag');
  return doc.toJS({ maxAliasCount: 50 });
}
export function readTarGz(bytes, limits = {}) {
  const maxBytes = limits.maxBytes ?? 40 * 1024 * 1024;
  const raw = gunzipSync(bytes, { maxOutputLength: maxBytes });
  const files = new Map(); let longName = null, pax = {}, entries = 0;
  const str = b => b.toString('utf8').split('\0')[0];
  for (let i = 0; i + 512 <= raw.length;) {
    const h = raw.subarray(i, i + 512); i += 512;
    if (h.every(b => b === 0)) break;
    if (++entries > (limits.maxFiles ?? 12000)) throw new Error('archive entry limit');
    const size = parseInt(str(h.subarray(124,136)).trim() || '0',8);
    if (!Number.isSafeInteger(size) || size < 0 || i + size > raw.length) throw new Error('invalid tar size');
    const b = raw.subarray(i, i+size); i += Math.ceil(size/512)*512;
    const type = str(h.subarray(156,157));
    if(type === 'L') { longName = str(b).trim(); continue; }
    if(type === 'x' || type === 'g') { const text = b.toString('utf8'); for(const line of text.split('\n')) {const m=line.match(/^\d+ ([^=]+)=(.*)$/);if(m)pax[m[1]]=m[2];} continue; }
    const prefix = str(h.subarray(345,500));
    let name = pax.path || longName || (prefix ? prefix + '/' : '') + str(h.subarray(0,100));
    pax = {}; longName = null;
    if(type && type !== '0') continue; // no extraction, no symlinks/devices
    name = name.replace(/^package\//,'').replace(/^\.\//,'');
    if(!name || name.startsWith('/') || name.split('/').includes('..') || name.includes('\\')) continue;
    if(files.has(name)) throw new Error('duplicate tar path');
    files.set(name, b);
  }
  return files;
}
export function applyPatches(initial, patches, diagnostics = []) {
  const rows = structuredClone(initial);
  const find = (list,id) => { for(const r of list) {if(r?.id === id)return r; if(r?.group && Array.isArray(r.config)){const t=find(r.config,id);if(t)return t;}} };
  for(const patch of patches) {
    if(!patch || typeof patch !== 'object')continue;
    if(Array.isArray(patch.insert)) {
      const target = patch.id ? find(rows,patch.id) : null;
      if(patch.id && (!target?.group || !Array.isArray(target.config))) {diagnostics.push(`unresolved insert group: ${patch.id}`);continue;}
      (target ? target.config : rows).push(...structuredClone(patch.insert));
    } else if(patch.id) {
      const target=find(rows,patch.id); if(!target){diagnostics.push(`unresolved override: ${patch.id}`);continue;}
      if(patch.name && target.name !== patch.name){diagnostics.push(`override name assertion failed: ${patch.id}`);continue;}
      Object.assign(target, structuredClone(patch));
    } else diagnostics.push('non-insert patch has no id');
  }
  return rows;
}
export function walk(node, visitor, parent=null) {
  if(!node || typeof node !== 'object')return;
  if(node.type)visitor(node,parent);
  for(const [key,value] of Object.entries(node)) {if(key==='parent')continue;if(Array.isArray(value))for(const child of value)walk(child,visitor,node);else if(value && typeof value==='object')walk(value,visitor,node);}
}
function memberName(node) { if(node?.type==='Identifier')return node.name; if(node?.type==='MemberExpression')return memberName(node.object)+'.'+(node.computed ? node.property.value ?? '?' : node.property.name); if(node?.type==='CallExpression')return memberName(node.callee)+'()';return ''; }
export function inspectCode(text, filename) {
  let source=text;
  if(/\.[cm]?tsx?$/.test(filename)) { try { source=stripTypeScriptTypes(text,{mode:'transform',sourceMap:false}); }catch(e){return {error:`TypeScript stripping: ${e.message}`};} }
  let ast; try {ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module',locations:true,allowReturnOutsideFunction:false});}catch(e){return {error:`AST parse: ${e.message}`};}
  // Conservative name resolution: ambiguous/shadowed/mutable names are UNKNOWN.
  const bindings=new Map();const bind=(name,node)=>{if(bindings.has(name))bindings.set(name,null);else bindings.set(name,node);};
  const pattern=n=>{if(!n)return;if(n.type==='Identifier')bind(n.name,null);else if(n.type==='ObjectPattern')for(const p of n.properties)pattern(p.value??p.argument);else if(n.type==='ArrayPattern')for(const x of n.elements)pattern(x);else if(n.type==='AssignmentPattern')pattern(n.left);else if(n.type==='RestElement')pattern(n.argument);};
  walk(ast,(n,parent)=>{
    if(n.type==='VariableDeclarator'){if(n.id.type==='Identifier')bind(n.id.name,parent?.kind==='const'?n.init:null);else pattern(n.id);}
    if(n.type==='FunctionDeclaration' && n.id)bind(n.id.name,n);
    if(/Function/.test(n.type))for(const p of n.params??[])pattern(p);
    if(n.type==='ImportSpecifier'||n.type==='ImportDefaultSpecifier'||n.type==='ImportNamespaceSpecifier')bind(n.local.name,null);
  });
  const value=(n,depth=0,seen=new Set())=>{
    if(!n || depth>12)return undefined;
    if(n.type==='Literal')return n.value;
    if(n.type==='Identifier' && !seen.has(n.name)){const s=new Set(seen);s.add(n.name);return value(bindings.get(n.name),depth+1,s);}
    if(n.type==='TemplateLiteral' && n.expressions.length===0)return n.quasis.map(q=>q.value.cooked).join('');
    if(n.type==='ArrayExpression')return n.elements.map(x=>value(x,depth+1,seen));
    if(n.type==='ObjectExpression'){
      const out={}; for(const p of n.properties){if(p.type==='SpreadElement'){const v=value(p.argument,depth+1,seen);if(v && typeof v==='object')Object.assign(out,v);else for(const key of Object.keys(out))delete out[key];continue;} const k=p.computed?value(p.key,depth+1,seen):p.key.name??p.key.value;if(typeof k==='string')out[k]=value(p.value,depth+1,seen);}return out;
    }
    if(n.type==='BinaryExpression' && n.operator==='+'){const a=value(n.left,depth+1,seen),b=value(n.right,depth+1,seen);if(typeof a==='string'&&typeof b==='string')return a+b;}
    if(n.type==='MemberExpression'){const o=value(n.object,depth+1,seen);const k=n.computed?value(n.property,depth+1,seen):n.property.name;if(o && typeof o==='object')return o[k];}
    // Abstract return-summary only: do NOT interpret statements or invoke functions.
    // A literal baseline returned by a local builder can prove its id; dynamic fields stay unknown.
    if(n.type==='CallExpression' && n.callee.type==='Identifier' && !seen.has('call:'+n.callee.name)){
      const fn=bindings.get(n.callee.name);if(fn && ['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(fn.type)){
        const summary=[];const collect=x=>{if(!x||typeof x!=='object')return;if(x!==fn.body && /Function/.test(x.type))return;if(x.type==='ReturnStatement')summary.push(x.argument);else for(const v of Object.values(x)){if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object')collect(v);}};
        if(fn.body.type!=='BlockStatement')summary.push(fn.body);else collect(fn.body);
        const next=new Set(seen);next.add('call:'+n.callee.name);
        const values=summary.map(x=>value(x,depth+1,next)).filter(v=>v&&typeof v==='object'&&typeof v.id==='string');
        if(values.length && values.every(v=>v.id===values[0].id))return values[0];
      }
    }
    return undefined;
  };
  const imports=[], registrations=[], hooks=[], strings=[], directories=[];
  const addHook=(kind,node)=>hooks.push({kind,line:node.loc.start.line,excerpt:source.slice(node.start,Math.min(node.end,node.start+360))});
  walk(ast,n=>{
    if(n.type==='Literal' && typeof n.value==='string' && n.value.length>40)strings.push({value:n.value,line:n.loc.start.line});
    if(n.type==='TemplateLiteral' && n.expressions.length===0){const s=value(n);if(s?.length>40)strings.push({value:s,line:n.loc.start.line});}
    if((n.type==='ImportDeclaration' || n.type==='ExportAllDeclaration' || n.type==='ExportNamedDeclaration') && n.source)imports.push(n.source.value);
    if(n.type==='ImportExpression' && n.source.type==='Literal')imports.push(n.source.value);
    if(n.type==='CallExpression'){
      const callee=memberName(n.callee);
      if(callee==='require' && n.arguments[0]?.type==='Literal')imports.push(n.arguments[0].value);
      if(/(?:^|\.)agentPresets\.register$/.test(callee)) { const vals=n.arguments.map(a=>value(a));registrations.push({line:n.loc.start.line,arguments:vals,excerpt:source.slice(n.start,Math.min(n.end,n.start+600))});addHook('agentPresets.register',n);}
      else if(/(?:\.register|\.on|\.provide|\.effect|\.set|\.add)$/.test(callee) && /(?:^|\.)(?:ctx|context|[A-Za-z_$]*Ctx|slots|webServer|settings|tools|commands|locale|configForms|sessions|messages|agentPresets)\./.test(callee)) addHook(callee,n);
    }
    if(n.type==='Property' && (n.key.name??n.key.value)==='presetDir') {
      const v=value(n.value);if(typeof v==='string')directories.push({path:v,line:n.loc.start.line,mode:'literal'});
      if(n.value?.type==='NewExpression' && memberName(n.value.callee)==='URL') {const p=value(n.value.arguments[0]);if(typeof p==='string')directories.push({path:p,line:n.loc.start.line,mode:'url-relative'});}
    }
  });
  return {imports,registrations,hooks,strings,directories};
}
export function exportTargets(pkg) {
  const out=[]; const visit=v=>{if(typeof v==='string')out.push(v);else if(v&&typeof v==='object')for(const x of Object.values(v))visit(x);};
  if(pkg.main)out.push(pkg.main);visit(pkg.exports);if(pkg.module)out.push(pkg.module);if(pkg.browser)visit(pkg.browser);
  return [...new Set(out)].filter(p=>/\.[cm]?[jt]sx?$/.test(p)&&!p.includes('*')&&!/\.d\.ts$/.test(p));
}
export function resolveCode(files,base,relative) {
  const p=safePath(base,relative);if(!p)return null;
  for(const candidate of [p,p+'.js',p+'.mjs',p+'.cjs',p+'.ts',p+'/index.js',p+'/index.ts',p.replace(/\.js$/,'.ts')])if(files.has(candidate))return candidate;
  return null;
}
