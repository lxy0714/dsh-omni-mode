import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { parseData, applyPatches, inspectCode, safePath, readTarGz, resolveCode } from './parsers.mjs';
test('YAML !!js stays data and cannot execute',()=>{
 globalThis.__researchExecutionSentinel=0;
 const p=parseData('x: !!js "globalThis.__researchExecutionSentinel = 1"\ny: [1, 2]');
 assert.deepEqual(p.x,{$opaqueJs:'globalThis.__researchExecutionSentinel = 1'});
 assert.equal(globalThis.__researchExecutionSentinel,0);
 assert.throws(()=>parseData('x: !unrecognized hello'));
 assert.throws(()=>parseData('x: 1\nx: 2'));
});
test('insert, nested group, override-by-id, asserted name',()=>{
 const diagnostics=[];
 const rows=applyPatches([], [{insert:[{id:'g',name:'cordis:group',group:true,config:[{id:'p',name:'preset',config:{a:1,b:2}}]}]},{id:'g',insert:[{id:'q',name:'plugin'}]},{id:'p',config:{a:3}},{id:'q',name:'wrong',disabled:true},{id:'missing',config:{a:1}}],diagnostics);
 assert.deepEqual(rows[0].config[0].config,{a:3});assert.equal(rows[0].config.length,2);assert.equal(rows[0].config[1].disabled,undefined);assert.equal(diagnostics.length,2);
});
test('paths reject escapes and preserve real relative location',()=>{
 assert.equal(safePath('bundle/patch.yml','../presets/a.yml'),'presets/a.yml');
 assert.equal(safePath('package.json','../../outside'),null);assert.equal(safePath('package.json','https://evil.test/a'),null);assert.equal(safePath('package.json','/absolute'),null);
 assert.equal(resolveCode(new Map([['src/b.ts','']]),'src/index.ts','./b.js'),'src/b.ts');
});
test('AST reads genuine registration and ignores comment/string decoys',()=>{
 const r=inspectCode(`// ctx.agentPresets.register({id:'fake'})\nconst decoy="ctx.agentPresets.register({id:'fake2'})";\nconst definition={id:'actual',name:'Actual',plugins:[]};\nexport function apply(ctx){ctx.agentPresets.register(definition);ctx.on('session/created',()=>{});run.toolStarts.add('not-native');this.managedAgents.set('x',1);}\nimport './helper.js';`,'index.js');
 assert.equal(r.registrations.length,1);assert.equal(r.registrations[0].arguments[0].id,'actual');assert.deepEqual(r.imports,['./helper.js']);assert.equal(r.hooks.length,2);
});
test('local builder return summary is static and shadowed ids remain unknown',()=>{
 const r=inspectCode(`const definition={id:'baseline',plugins:[]};function build(ctx){if(!ctx.base)return definition;return {...definition,plugins:dynamic(ctx)};}export function apply(ctx){ctx.agentPresets.register(build(ctx));}`,'builder.js');
 assert.equal(r.registrations[0].arguments[0].id,'baseline');
 const s=inspectCode(`const definition={id:'wrong'};function apply(ctx,definition){ctx.agentPresets.register(definition);}`,'shadow.js');assert.equal(s.registrations[0].arguments[0],undefined);
 const t=inspectCode(`const definition={id:'wrong',...unknown};function apply(ctx){ctx.agentPresets.register(definition);}`,'spread.js');assert.equal(t.registrations[0].arguments[0].id,undefined);
});
test('opaque calls cannot synthesize a registration object',()=>{
 const r=inspectCode(`export function apply(ctx){ctx.agentPresets.register(JSON.parse('{"id":"fake"}'));}`,'index.js');
 assert.equal(r.registrations.length,1);assert.equal(r.registrations[0].arguments[0],undefined);
});
test('TypeScript stripping and presetDir are data only',()=>{
 const r=inspectCode(`export function apply(ctx: any){ctx.agentPresets.register({id:'ts',presetDir:new URL('./presets/',import.meta.url)});}`,'index.ts');
 assert.equal(r.registrations[0].arguments[0].id,'ts');assert.equal(r.directories[0].path,'./presets/');
});
function tar(entries){const chunks=[];for(const [name,body,type='0']of entries){const h=Buffer.alloc(512);h.write(name);h.write((body.length).toString(8).padStart(11,'0')+'\0',124);h.write(type,156);chunks.push(h,Buffer.from(body),Buffer.alloc((512-body.length%512)%512));}chunks.push(Buffer.alloc(1024));return gzipSync(Buffer.concat(chunks));}
test('tar is in-memory, does not extract symlinks/traversal, has size limits',()=>{
 const files=readTarGz(tar([['package/package.json','{}'],['package/../../escape','no'],['package/link','destination','2']]));assert.deepEqual([...files.keys()],['package.json']);assert.throws(()=>readTarGz(tar([['package/big','123456789']]),{maxBytes:8}));assert.throws(()=>readTarGz(tar([['package/a','1'],['package/a','2']])));
});
