// Static classification only: read pinned configuration DATA; never mount/import a subject.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
export const SELECTION_SHA256='6498f93a68a13eed1a07e2ed84a9cae1c5ca3fad44841e1a4a230d6efbd2007a';
const pair=(zh,en)=>({zh,en});
export const CATEGORIES=[
 {id:'engineering',label:pair('工程与通用执行','Engineering and general execution'),adoption:pair('吸收工程角色、交付契约、审查与恢复方法；不把流程/角色变体算成新行业。','Adapt engineering roles, delivery contracts, review and recovery; workflow/role variants are not new industries.')},
 {id:'game',label:pair('游戏开发','Game development'),adoption:pair('提取设计、原型、数值、关卡、测试和发布契约；技能、引擎和素材产出分开验证。','Adapt design, prototype, balance, level, QA and release contracts; verify skills, engines and generated assets separately.')},
 {id:'cyber',label:pair('安全、网络与逆向','Security, networks and reverse engineering'),adoption:pair('吸收防御审计、网络参考和授权测试方法；目标/授权/范围先确定，不导入越权规则。','Adapt defensive audit, network references and authorized testing; require target/authority/scope and reject authorization bypasses.')},
 {id:'visual',label:pair('视觉与演示','Visual media and presentations'),adoption:pair('吸收场景/素材/模板/导出约束；本轮代码视觉走本地渲染，不默认接入生成式图片或视频模型。','Adapt scene, asset, template and export contracts; approved code media uses local rendering, not image/video generation models.')},
 {id:'fiction',label:pair('小说与互动叙事','Fiction and interactive narrative'),adoption:pair('吸收世界观、角色、章节与连续性契约；保留身份边界并核对素材/技能许可。','Adapt canon, characters, chapters and continuity contracts; preserve identity boundaries and check asset/skill licensing.')},
 {id:'research',label:pair('研究、学习与知识工作','Research, learning and knowledge work'),adoption:pair('吸收伴读、证据、检索与教学方法；不把阅读流程当成覆盖所有科学专业。','Adapt reading, evidence, retrieval and teaching methods; reading workflows are not comprehensive scientific expertise.')},
 {id:'personalization',label:pair('陪伴与个性化','Companionship and personalization'),adoption:pair('吸收表达偏好和有边界的记忆使用；不复制无条件服从或未经验证的长记忆承诺。','Adapt expression preferences and bounded memory use; reject unconditional obedience and unverified long-memory claims.')},
 {id:'assistant',label:pair('生活与工作协作','Personal and work assistance'),adoption:pair('吸收会议、行程、整理与待办契约；对外动作及删除使用真实授权，账号/MCP依赖明确列出。','Adapt meetings, travel, cleanup and todo contracts; retain real authority for external actions/deletion and list account/MCP prerequisites.')},
 {id:'molbio',label:pair('分子生物工具','Molecular biology tools'),adoption:pair('保留可核验的序列输入/输出和工具依赖；不把工具声明当实验、临床或全部计算正确的证明。','Retain checkable sequence I/O and tool prerequisites; declarations do not prove experiments, clinical conclusions or universal computational correctness.')},
 {id:'business',label:pair('商业建议与语义建模','Business advice and semantic modeling'),adoption:pair('吸收语义实体/关系和证据约束；区分语料类比、业务后端与真实金融/商业验收。','Adapt semantic entities/relations and evidence constraints; distinguish corpus analogies, business backends and real business/financial acceptance.')},
];
// Human-reviewed primary orientation, anchored to exact identities rather than array positions.
const SPECIAL={
 game:['dsh-game-studio-presets#game-studio','dsh-game-studio-presets#game-concept','dsh-game-studio-presets#game-design','dsh-game-studio-presets#game-build','dsh-game-studio-presets#game-art-audio','dsh-game-studio-presets#game-qa','dsh-game-studio-presets#game-release','dsh-game-studio-presets#game-narrative','dsh-game-studio-presets#game-level','dsh-game-studio-presets#game-engine'],
 cyber:['@yangdcm/dsh-expert-team#expert-team-sec','dsh-blue-team-mode#blue','dsh-network-engineer#network-engineer','dsh-pentester#pentester','dsh-redteam-mode#redteam','dsh-reverse-mode#reverse-engineering'],
 visual:['@yujp_vc/ppt-assistant#ppt-assistant','dsh-comfyui-control#drawing','dsh-draw-mode#draw','dsh-pptx-builder#presentations'],
 fiction:['dsh-novel-solo#novel-solo','dsh-story-mode#story','liarmttt-tavernweave-dsh#tavernweave'],
 research:['@ggboy123/dsh-paper-reader#paper-reader','clearai-dsh#clearai','dsh-aiyayi#aiyayi-retriever','dsh-study-mode#study-mode'],
 personalization:['dsh-aiyayi#aiyayi','dsh-foxy#foxy','dsh-myself-preset#myself','dsh-whale-loli#鲸鱼娘Agent预设','dsh-whale-loli#鲸鱼娘活人版Agent预设','i-am-yuike#yuike'],
 assistant:['@maximehu97/dsh-meeting#meeting','@starwish-ai/xingyuan-dsh#xingyuan','dsh-clean-agent#cleanup','dsh-travel-planner#travel-planner'],
 molbio:['dsh-molbio-tools#molbio-lab'],business:['dsh-plugin-maoxuan-pet#maoxuan-pet','dsh-tsm-agent#dlr'],
};
const assignment=new Map();for(const [category,keys]of Object.entries(SPECIAL))for(const key of keys){assert(!assignment.has(key));assignment.set(key,category);}
export function selectedHash(selected){return hash(JSON.stringify(selected.map(p=>[p.package,p.version,p.id,p.rawConfigSha256])));}
export function flattenRows(rows,ancestor='declared',out=[]){
 for(const row of rows??[]){
  if(!row||typeof row!=='object')continue;
  const activation=ancestor==='disabled'||row.disabled===true?'disabled':ancestor==='conditional'||(row.disabled&&typeof row.disabled==='object')?'conditional':'declared';
  out.push({row,activation});if(row.group&&Array.isArray(row.config))flattenRows(row.config,activation,out);
 }
 return out;
}
const text=value=>typeof value==='string'?value:'';
const TAGS=[['orchestration',/orchestrat|delegat|subagent|协作|委派|编排/i],['recovery',/checkpoint|resum|recover|检查点|断点|恢复/i],['reasoning',/epistem|cogniti|reasoning|认知|推理/i],['context',/context|compact|memory|上下文|压缩|记忆/i],['style',/roleplay|persona|扮演|语气|人设/i]];
export function buildClassification(published,inventory){
 const selected=published.audit.selectedPresets;assert.equal(selected.length,100);assert.equal(selectedHash(selected),SELECTION_SHA256,'selection changed: a new human classification is required');
 const entries=selected.map(pick=>{
  const key=pick.package+'#'+pick.id;
  const fullPackages=inventory.packages.filter(p=>p.package===pick.package&&p.version===pick.version);assert.equal(fullPackages.length,1,'ambiguous package '+key);
  const pkg=fullPackages[0],presets=pkg.presets.filter(p=>p.id===pick.id);assert.equal(presets.length,1,'ambiguous preset '+key);
  const preset=presets[0];assert.equal(preset.configSha256,pick.rawConfigSha256,key);assert.equal(hash(JSON.stringify(preset.config)),pick.rawConfigSha256,'changed config '+key);
  const source=published.packages.find(p=>p.package===pick.package&&p.version===pick.version);assert(source,key);assert.equal(pkg.distribution.tarballSha256,source.distribution.tarballSha256,'changed archive '+key);
  const rows=flattenRows(preset.config.plugins);
  const personas=rows.filter(({row})=>row.name==='@deepseek-ai/dsh-persona');
  const wording=[text(preset.description),text(preset.config.description),...personas.map(({row})=>text(row.config?.prefix))].join('\n');
  const category=assignment.get(key)??'engineering';
  const evidence=source.learningPoints.flatMap(p=>p.evidence).filter((e,i,a)=>a.findIndex(x=>x.path===e.path)===i).map(e=>({path:e.path,url:e.url,sha256:e.sha256}));
  const exact=source.files.find(f=>f.path===pick.file);if(exact&&!evidence.some(e=>e.path===exact.path))evidence.unshift({path:exact.path,url:exact.url,sha256:exact.sha256});
  const declarations=rows.filter(({row})=>!row.group&&typeof row.name==='string').map(({row,activation})=>({id:row.id??null,plugin:row.name,activation}));
  return {key,package:pick.package,version:pick.version,presetId:pick.id,sourceId:pick.sourceId,sourceFile:pick.file,rawConfigSha256:pick.rawConfigSha256,substantiveSha256:pick.substantiveSha256,archiveSha256:source.distribution.tarballSha256,category,
   orientation:CATEGORIES.find(c=>c.id===category).label,
   sourceDescription:text(preset.config.description)||text(preset.description),
   mechanisms:TAGS.filter(([,rx])=>rx.test(wording)).map(([id,rx])=>{const m=rx.exec(wording);return {id,basis:'observed-source-wording-not-efficacy',excerpt:wording.slice(Math.max(0,m.index-55),m.index+100).replace(/\s+/g,' ')};}),
   declaredPlugins:declarations,
   composition:{literalCompletePersona:personas.some(({row})=>row.config?.complete===true),runtimeContextExcluded:personas.some(({row})=>row.config?.includeRuntimeContext===false),presetConditional:!!preset.conditionallyActive,disabledDeclarations:declarations.filter(d=>d.activation==='disabled').length,conditionalDeclarations:declarations.filter(d=>d.activation==='conditional').length},
   learning:pick.reason,adoption:CATEGORIES.find(c=>c.id===category).adoption,
   sourceRisks:source.learningPoints.map(p=>p.risk).filter(Boolean),
   negativeControl:key==='dsh-outsourcing-expert#outsourcing-expert-reverse',
   runtimeStatus:'not-tested',evidence};
 });
 for(const key of assignment.keys())assert(entries.some(e=>e.key===key),'missing reviewed category member '+key);
 const categories=CATEGORIES.map(c=>({...c,count:entries.filter(e=>e.category===c.id).length,projectCount:new Set(entries.filter(e=>e.category===c.id).map(e=>e.sourceId)).size}));
 const result={schemaVersion:1,classificationStatus:'reviewed-static-orientation-not-runtime-certified',selectionSha256:SELECTION_SHA256,execution:{researchObjectsInstalled:false,researchObjectsImported:false,researchObjectsExecuted:false},counts:{configurations:entries.length,projects:new Set(entries.map(e=>e.sourceId)).size,literalCompletePersonas:entries.filter(e=>e.composition.literalCompletePersona).length,conditionallyDeclaredPresets:entries.filter(e=>e.composition.presetConditional).length},categories,entries};
 validateClassification(result,published);return result;
}
export function validateClassification(data,published){
 assert.equal(data.schemaVersion,1);assert.equal(data.selectionSha256,SELECTION_SHA256);assert.equal(selectedHash(published.audit.selectedPresets),SELECTION_SHA256);
 assert.equal(data.entries.length,100);assert.equal(data.counts.configurations,100);assert.equal(data.counts.projects,63);
 assert.equal(new Set(data.entries.map(e=>e.key)).size,100);assert.equal(new Set(data.entries.map(e=>e.sourceId)).size,63);
 const sourceMap=new Map(published.audit.selectedPresets.map(p=>[p.package+'#'+p.id,p]));
 for(const entry of data.entries){
  const original=sourceMap.get(entry.key);assert(original,'unknown entry '+entry.key);
  for(const [a,b]of [['package','package'],['version','version'],['presetId','id'],['sourceId','sourceId'],['rawConfigSha256','rawConfigSha256'],['substantiveSha256','substantiveSha256']])assert.equal(entry[a],original[b],entry.key+' '+a);
  assert.equal(entry.category,assignment.get(entry.key)??'engineering');assert.equal(entry.runtimeStatus,'not-tested');
  assert(entry.orientation.zh&&entry.orientation.en&&entry.adoption.zh&&entry.adoption.en&&entry.learning.zh&&entry.learning.en);
  assert(entry.evidence.length>0);const pkg=published.packages.find(p=>p.package===entry.package&&p.version===entry.version);assert.equal(entry.archiveSha256,pkg.distribution.tarballSha256);
  for(const evidence of entry.evidence){const file=pkg.files.find(f=>f.path===evidence.path);assert(file,entry.key+' unknown evidence');assert.equal(file.sha256,evidence.sha256);assert.equal(file.url,evidence.url);}
  assert(Array.isArray(entry.declaredPlugins));for(const row of entry.declaredPlugins)assert(['disabled','conditional','declared'].includes(row.activation));
 }
 assert.equal(data.counts.literalCompletePersonas,data.entries.filter(e=>e.composition.literalCompletePersona).length);
 assert.equal(data.counts.conditionallyDeclaredPresets,data.entries.filter(e=>e.composition.presetConditional).length);
 assert.equal(data.categories.length,CATEGORIES.length);assert.deepEqual(data.categories.map(c=>c.id),CATEGORIES.map(c=>c.id),'category identities/order must be exact');assert.equal(data.categories.reduce((n,c)=>n+c.count,0),100);
 for(const category of data.categories){assert(CATEGORIES.some(c=>c.id===category.id));assert.equal(category.count,data.entries.filter(e=>e.category===category.id).length);assert.equal(category.projectCount,new Set(data.entries.filter(e=>e.category===category.id).map(e=>e.sourceId)).size);}
 for(const value of Object.values(data.execution))assert.equal(value,false);
 return {classification:'PASS',configurations:100,projects:63,status:data.classificationStatus};
}
const cell=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
export function renderReport(data){
 let out='# 100套预设分类与全能模式融合 / Classifying 100 presets for Omni\n\n[中文](#中文) · [English](#english)\n\n';
 for(const language of ['zh','en']){
  const zh=language==='zh';out+=zh?'## 中文\n\n':'## English\n\n';
  out+=zh?'### 结论与口径\n\n100套固定配置来自63个项目，不是100个专业领域。分类依据实际角色说明、persona、嵌套插件组合及审阅证据，不按名称猜测。全部配置哈希复核匹配原来源；这是任务方向分类，不是专业认证、真实挂载或效果验收。\n\n':'### Findings and counting\n\nThe 100 pinned configurations come from 63 projects, not 100 professional domains. Classification uses actual role descriptions, personas, nested plugin composition and reviewed evidence, not names alone. Every configuration hash matches the original evidence. This is task-orientation analysis, not expertise certification, real mounting or quality acceptance.\n\n';
  out+=zh?'工程/通用执行占60套；游戏10套全部来自一个项目。推理、恢复、记忆、协作和风格是交叉机制，不重复计为领域。引用的原来源措辞只作为数据，不当作全能模式指令。\n\n':'Engineering/general execution accounts for 60 configurations; all 10 game configurations come from one project. Reasoning, recovery, memory, collaboration and style are cross-cutting mechanisms, not extra domains. Quoted source wording is data, not instructions for Omni.\n\n';
  out+=zh?'| 主分类 | 配置数 | 项目数 | 融合方向 |\n|---|---:|---:|---|\n':'| Primary category | Configurations | Projects | Adoption direction |\n|---|---:|---:|---|\n';
  for(const c of data.categories)out+='| '+[c.label[language],c.count,c.projectCount,c.adoption[language]].map(cell).join(' | ')+' |\n';
  out+='\n'+(zh?'各类项目数有交叉，不可相加当作独立项目总数。\n\n':'Category project counts overlap and must not be summed as unique projects.\n\n');
  out+=zh?'### 落地方法与必要边界\n\n':'### Implementation direction and boundaries\n\n';
  const bullets=zh?[
   '继续增强同一omni：稳定核心＋按任务加载的专业模块＋明确的工具适配，不拼接100份完整身份。所有分类纳入增强，不只加强工程。',
   `观察到${data.counts.literalCompletePersonas}套直接完整persona和${data.counts.conditionallyDeclaredPresets}套带条件的预设声明；不能原样覆盖全能核心，也不能把条件/禁用工具计为可用。`,
   '工具作用域需逐个核对：绘图/PPT部分能力是Host级；ComfyUI、游戏技能目录、论文工具、会议/旅行MCP、语义后端和账号均可能是独立依赖。配置里写了名字不等于已安装或已获授权。',
   '代码视觉创作使用本地代码渲染，不自动启用研究来源中的生成式图片/视频后端。有可用素材用素材，没有则从零代码制作；音频需求未明确必须询问。',
   '网络安全支持防御、本地靶场和明确授权测试；负向对照、无条件服从、宣传性倍数和未经验证的超长记忆不得移植为实际能力。',
   '样本未专门覆盖临床、法律、会计/量化金融、广泛统计建模、机械电气/CAD及多数自然科学。这只是该样本的缺口，不证明整个DSH生态没有这些能力；允许可靠检索与工具组合兜底，但必须说明不足。',
   '成熟度分别标已实现并验证、需接入依赖、仅方法参考、未覆盖；方法/工具/产物分别验收，原40题保留作回归，新增领域与跨域案例固定后再测试。',
  ]:[
   'Enhance the same omni: stable core, task-loaded domain methods and explicit adapters, not 100 concatenated identities. Include all categories, not engineering alone.',
   `Observed ${data.counts.literalCompletePersonas} literal complete personas and ${data.counts.conditionallyDeclaredPresets} conditionally declared presets. Do not replace the Omni kernel or count conditional/disabled tools as available.`,
   'Verify scope individually: some drawing/PPT capabilities are Host-wide. ComfyUI, game skill directories, paper tools, meeting/travel MCP, semantic backends and accounts can be separate prerequisites. A configuration name does not establish installation or authority.',
   'Code media uses local programmatic rendering, not automatic activation of researched image/video generation backends. Reuse available authorized assets or create from scratch in code; ask whenever audio requirements are unspecified.',
   'Security covers defense, local labs and explicitly authorized testing. Negative controls, unconditional obedience, marketing multipliers and unverified long-memory claims must not become capabilities.',
   'The sample lacks dedicated clinical, legal, accounting/quantitative-finance, broad statistical modeling, mechanical/electrical/CAD and most natural-science presets. This is a sample gap, not an ecosystem-wide absence. Grounded retrieval/tool fallback is allowed with explicit limitations.',
   'Separate verified, needs-dependency, method-only and uncovered states. Accept methods, tools and artifacts separately; retain the original 40 cases for regression and freeze new domain/cross-domain cases before testing.',
  ];out+=bullets.map(b=>'- '+b).join('\n')+'\n\n';
  out+=zh?'### 全部100项及审阅依据\n\n':'### All 100 configurations and reviewed rationale\n\n';
  out+=zh?'| 配置（固定版本） | 主分类 | 已审阅的区别与可取机制 |\n|---|---|---|\n':'| Configuration (pinned version) | Primary category | Reviewed distinction and mechanism |\n|---|---|---|\n';
  for(const e of data.entries){const ref=e.evidence.find(f=>f.path===e.sourceFile)??e.evidence[0];out+='| '+[`[${cell(e.key)}@${cell(e.version)}](${ref.url})`,cell(e.orientation[language]),cell(e.learning[language])].join(' | ')+' |\n';}
  out+='\n'+(zh?'### 复核与未验证项\n\n':'### Reproduction and untested scope\n\n');
  out+=zh?'运行 `node scripts/research/classify.mjs --verify` 可对公开分类与原证据逐项复核。重新生成需显式给出含完整静态配置的审阅清单：`node scripts/research/classify.mjs --inventory <audited-inventory.json>`；生成过程不执行配置表达式、研究包或安装脚本。\n\n':'Run `node scripts/research/classify.mjs --verify` to compare the published classification with source evidence. Regeneration requires an explicitly supplied reviewed inventory containing full static configurations: `node scripts/research/classify.mjs --inventory <audited-inventory.json>`. Generation executes no configuration expressions, subject packages or install scripts.\n\n';
  out+=(zh?'[机器分类与配置哈希]':'[Machine classification and config hashes]')+'(https://github.com/lxy0714/dsh-omni-mode/blob/main/research/preset-classification.json) · '+(zh?'[原始研究证据]':'[Original research evidence]')+'(https://github.com/lxy0714/dsh-omni-mode/blob/main/research/sources.json)\n\n';
 }
 return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const published=JSON.parse(fs.readFileSync(path.join(ROOT,'research/sources.json'),'utf8'));
 if(process.argv.includes('--verify')){console.log(JSON.stringify(validateClassification(JSON.parse(fs.readFileSync(path.join(ROOT,'research/preset-classification.json'),'utf8')),published)));}
 else{
  const i=process.argv.indexOf('--inventory');assert(i>=0&&process.argv[i+1],'Usage: --verify OR --inventory <reviewed-full-inventory.json> / 请指定复核或完整清单');
  const data=buildClassification(published,JSON.parse(fs.readFileSync(path.resolve(process.argv[i+1]),'utf8')));
  fs.writeFileSync(path.join(ROOT,'research/preset-classification.json'),JSON.stringify(data,null,2)+'\n');
  fs.writeFileSync(path.join(ROOT,'docs/preset-classification.md'),renderReport(data));
  console.log(JSON.stringify(validateClassification(data,published)));
 }
}
