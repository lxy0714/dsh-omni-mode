// Maintainer-only static provenance generator. Never imports/evaluates subject packages.
// Explicit inputs: --sources <json> --inventory <json> --cache <dir> --write.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { operations } from './operations.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const hash = data => createHash('sha256').update(data).digest('hex');
const bi = (zh, en) => ({ zh, en });
const args = process.argv.slice(2); const opts = {};
for (let i = 0; i < args.length; i++) { const key = args[i]; if (key === '--write') opts.write = true; else if (['--sources', '--inventory', '--cache'].includes(key) && args[i + 1]) opts[key.slice(2)] = args[++i]; else throw Error('未知或不完整参数 / Unknown or incomplete argument'); }
if (!opts.sources || !opts.inventory || !opts.cache || !opts.write) throw Error('需要显式sources/inventory/cache/write / Explicit --sources --inventory --cache --write required');
const sourceBytes = await fs.readFile(opts.sources), inventoryBytes = await fs.readFile(opts.inventory);
const sources = JSON.parse(sourceBytes), inventory = JSON.parse(inventoryBytes);
const selected = sources.audit.selectedPresets;
if (selected.length !== 100 || new Set(selected.map(s => s.sourceId)).size !== 63) throw Error('批准的100配置/63项目基线改变 / Approved 100-configuration / 63-project baseline changed');
// Exact primary classification supplied by Lead. Keys, not array positions, persist.
const explicit = {
  game: ['game-studio', 'game-concept', 'game-design', 'game-build', 'game-art-audio', 'game-qa', 'game-release', 'game-narrative', 'game-level', 'game-engine'].map(id => `dsh-game-studio-presets#${id}`),
  cyber: ['@yangdcm/dsh-expert-team#expert-team-sec', 'dsh-blue-team-mode#blue', 'dsh-network-engineer#network-engineer', 'dsh-pentester#pentester', 'dsh-redteam-mode#redteam', 'dsh-reverse-mode#reverse-engineering'],
  documents: ['@yujp_vc/ppt-assistant#ppt-assistant', 'dsh-comfyui-control#drawing', 'dsh-draw-mode#draw', 'dsh-pptx-builder#presentations'],
  fiction: ['dsh-novel-solo#novel-solo', 'dsh-story-mode#story', 'liarmttt-tavernweave-dsh#tavernweave'],
  research: ['@ggboy123/dsh-paper-reader#paper-reader', 'clearai-dsh#clearai', 'dsh-aiyayi#aiyayi-retriever', 'dsh-study-mode#study-mode'],
  personalization: ['dsh-aiyayi#aiyayi', 'dsh-foxy#foxy', 'dsh-myself-preset#myself', 'dsh-whale-loli#鲸鱼娘Agent预设', 'dsh-whale-loli#鲸鱼娘活人版Agent预设', 'i-am-yuike#yuike'],
  assistant: ['@maximehu97/dsh-meeting#meeting', '@starwish-ai/xingyuan-dsh#xingyuan', 'dsh-clean-agent#cleanup', 'dsh-travel-planner#travel-planner'],
  molbio: ['dsh-molbio-tools#molbio-lab'],
  business: ['dsh-plugin-maoxuan-pet#maoxuan-pet', 'dsh-tsm-agent#dlr']
};
const categories = [
  ['engineering', '通用工程', 'General engineering', '数据契约、实现、负例测试、架构边界与可复现交接', 'Data contracts, implementation, negative tests, architectural boundaries and reproducible handoff'],
  ['game', '游戏制作', 'Game production', '概念/GDD/实现/美术音频/QA/发布/叙事/关卡/引擎的阶段交付；数值QA', 'Stage deliverables for concept/GDD/build/art-audio/QA/release/narrative/level/engine; numerical QA'],
  ['cyber', '防御安全、网络与逆向', 'Defensive security, networking and RE', '授权范围、静态取证、引用厂商命令、回滚；本地指标提取', 'Authorized scope, static evidence, vendor-command references, rollback and local indicator extraction'],
  ['documents', '文档与视觉演示', 'Documents and visual presentations', '可溯源大纲、图表数据、逐页视觉验收；原生Markdown与独立代码媒体槽', 'Traceable outlines, chart data, per-slide visual acceptance; native Markdown and a separate code-media slot'],
  ['fiction', '小说与叙事', 'Fiction and narrative', '设定/人物/时间线/章节账本、分支状态及独立审读', 'Canon/character/timeline/chapter ledger, branch state and independent review'],
  ['research', '研究与学习', 'Research and learning', '问题拆解、证据账本、来源核验、反证与主动回忆', 'Question decomposition, evidence ledger, source verification, counterevidence and active recall'],
  ['personalization', '陪伴与表达个性化', 'Companion and expression personalization', '从修改差异提取风格；征得同意后才持久化；不冒充身份或承诺无条件服从', 'Infer style from correction diffs; persist only with consent; no identity pretense or unconditional obedience'],
  ['assistant', '个人与工作助理', 'Personal and work assistant', '可用性与承诺分离、待办依赖、本地UTC日程草稿、行程与清理风险', 'Separate availability from commitments, todo dependencies, local UTC calendar drafts, itinerary and cleanup risk'],
  ['molbio', '基础分子生物数据', 'Basic molecular-biology data', 'FASTA/IUPAC格式与长度、GC统计；计算不等于生物学验证', 'FASTA/IUPAC format, length and GC statistics; computation is not biological validation'],
  ['business', '业务语义与决策', 'Business semantics and decisions', 'L1实体/L2共识/L3问题SOP、物理字段映射、可证伪的行动假设', 'L1 entities/L2 consensus/L3 question SOP, physical-column mapping and falsifiable action hypotheses']
].map(([id, zh, en, mzh, men]) => ({ id, label: bi(zh, en), description: bi(mzh, men), skill: `omni-${id}`, sourceRefs: [] }));
const allKeys = new Set(selected.map(s => `${s.package}#${s.id}`));
for (const keys of Object.values(explicit)) for (const key of keys) if (!allKeys.has(key)) throw Error(`分类键不存在 / Classification key absent: ${key}`);
const sourceRefs = [], sourceExcerpts = [], archiveCache = new Map();
async function archiveFiles(pkg) {
  if (archiveCache.has(pkg.package)) return archiveCache.get(pkg.package);
  const url = pkg.distribution.tarball, key = hash(url), buffer = await fs.readFile(path.join(opts.cache, `${key}.bin`));
  if (hash(buffer) !== pkg.distribution.tarballSha256) throw Error(`归档哈希错误 / Archive hash mismatch: ${pkg.package}`);
  const tar = gunzipSync(buffer, { maxOutputLength: 48 * 1024 * 1024 }), files = new Map();
  for (let pos = 0; pos + 512 <= tar.length;) {
    const header = tar.subarray(pos, pos + 512); if (header.every(b => b === 0)) break;
    const str = (start, n) => header.subarray(start, start + n).toString().split('\0')[0];
    const name = [str(345, 155), str(0, 100)].filter(Boolean).join('/');
    const sizeText = str(124, 12).trim(); if (!/^[0-7]+$/.test(sizeText)) throw Error('不支持的tar尺寸 / Unsupported tar size');
    const size = parseInt(sizeText, 8), start = pos + 512; if (start + size > tar.length) throw Error('截断tar / Truncated tar');
    if ([0, 48].includes(header[156])) files.set(name, tar.subarray(start, start + size));
    pos = start + Math.ceil(size / 512) * 512;
  }
  archiveCache.set(pkg.package, files); return files;
}
for (const row of selected) {
  const key = `${row.package}#${row.id}`, domain = Object.entries(explicit).find(([, keys]) => keys.includes(key))?.[0] || 'engineering';
  const pkg = sources.packages.find(p => p.package === row.package && p.version === row.version);
  const full = inventory.packages.find(p => p.package === row.package && p.version === row.version);
  if (!pkg || !full || full.distribution.tarballSha256 !== pkg.distribution.tarballSha256 || !pkg.learningPoints?.length) throw Error(`来源证据不匹配 / Evidence mismatch: ${key}`);
  const learned = pkg.learningPoints[0], files = await archiveFiles(pkg);
  const evidence = [];
  for (const e of learned.evidence) {
    const exactArchivePath = pkg.files.find(f => f.path === e.path)?.archiveUrl?.split('#')[1];
    let found = exactArchivePath && files.has(exactArchivePath) ? [[exactArchivePath, files.get(exactArchivePath)]] : [...files].filter(([p]) => p === e.path || p.endsWith('/' + e.path));
    if (found.length > 1) { const depth = Math.min(...found.map(([p]) => p.split('/').length)); found = found.filter(([p]) => p.split('/').length === depth); }
    if (found.length !== 1 || hash(found[0][1]) !== e.sha256) throw Error(`源文件哈希不匹配 / Source file hash mismatch: ${key}:${e.path}`);
    const excerptId = `${pkg.package}@${pkg.version}:${e.path}`;
    if (!sourceExcerpts.some(x => x.id === excerptId)) { const text = found[0][1].toString('utf8'), needle = text.indexOf(row.id), begin = Math.max(0, needle - 300); sourceExcerpts.push({ id: excerptId, path: e.path, sha256: e.sha256, url: e.url, bytes: found[0][1].length, excerpt: text.slice(begin, begin + 2400), excerptStart: begin, truncated: text.length > 2400, execution: 'static-text-only-never-imported' }); }
    evidence.push({ path: e.path, sha256: e.sha256, url: e.url, excerptId });
  }
  sourceRefs.push({ id: key, domain, package: row.package, version: row.version, sourceId: row.sourceId, configId: row.id, configFile: row.file, configSha256: row.rawConfigSha256, substantiveSha256: row.substantiveSha256, pin: pkg.distribution.commit || pkg.distribution.integrity, tarballSha256: pkg.distribution.tarballSha256, learningPoint: bi(learned.zh, learned.en), selectedReason: row.reason, evidence, runtimeAccepted: false, fullInventoryMatched: true });
  categories.find(c => c.id === domain).sourceRefs.push(key);
}
const outputSpec = {
  'data.validate': ['engineering', '结构化数据校验', 'Structured data validation', '逐列类型/必填/唯一值；CSV保留文本不强制转换', 'Column type/required/unique checks; CSV remains text without coercion', { valid: 'boolean', issues: 'issue[]', rowCount: 'number', columns: 'string[]' }],
  'data.transform': ['engineering', '结构化数据变换', 'Structured data transform', '显式选列/重命名/等值筛选与CSV公式保护', 'Explicit projection/rename/equality filter and CSV formula protection', { columns: 'string[] (JSON output)', rows: 'scalar[][] (JSON output)', text: 'string (CSV output)', rowCount: 'number (CSV output)' }],
  'game.balance': ['game', '游戏数值QA', 'Game numerical QA', '确定性DPS/成本效率和用户阈值检查，不推断实机平衡', 'Deterministic DPS/cost efficiency and user-threshold checks, not playtest balance', { valid: 'boolean', issues: 'issue[]', units: '{id,dps,efficiency}[]', efficiencyRatio: 'number|null', model: 'string' }],
  'fiction.continuity': ['fiction', '设定连续性检查', 'Canon continuity check', '闭区间事实冲突、未知人物与场景断言；不自动解析正文', 'Closed-interval fact conflicts, unknown entities and scene assertions; no automatic prose parsing', { valid: 'boolean', issues: 'issue[]', sceneCount: 'number', limitation: 'string' }],
  'molbio.fasta': ['molbio', 'FASTA基础统计', 'Basic FASTA statistics', 'DNA/RNA IUPAC格式、长度、歧义数和两个GC分母', 'DNA/RNA IUPAC format, lengths, ambiguous counts and two GC denominators', { alphabet: 'dna|rna', records: '{id,length,counts,ambiguous,gcFractionAll,gcFractionCanonical}[]', limitation: 'string' }],
  'business.model': ['business', '实体关系一致性', 'Entity/relation consistency', '字段端点、主键、类型与中间实体检查；不连接数据库', 'Field endpoints, primary keys, types and junction checks; no database connection', { valid: 'boolean', issues: 'issue[]', entityCount: 'number', relationCount: 'number', limitation: 'string' }],
  'research.evidence': ['research', '引用结构覆盖', 'Citation structure coverage', '来源ID/引用覆盖检查，不检索原文或验证事实', 'Source-ID/citation coverage checks, not retrieval or truth verification', { valid: 'boolean', issues: 'issue[]', claimCount: 'number', sourceCount: 'number', limitation: 'string' }],
  'cyber.indicators': ['cyber', '本地指标提取', 'Local indicator extraction', '从已提供文本去重提取IPv4/SHA256；不联网、不判恶意', 'Deduplicate IPv4/SHA256 from supplied text; no network or maliciousness verdict', { ipv4: 'string[]', sha256: 'string[]', limitation: 'string' }],
  'documents.outline': ['documents', 'Markdown文档草稿', 'Markdown document draft', '标题/章节/来源生成可读文档，拒绝失联引用', 'Generate title/sections/sources document, rejecting dangling citations', { text: 'string', issues: 'issue[]', limitation: 'string' }],
  'assistant.todo': ['assistant', '依赖待办草稿', 'Dependency-aware todo draft', '待办依赖闭环/日期检查与Markdown输出；不设提醒', 'Todo cycle/date checks and Markdown output; no reminders', { valid: 'boolean', issues: 'issue[]', text: 'string', limitation: 'string' }],
  'assistant.ics': ['assistant', 'UTC日历草稿', 'UTC calendar draft', '转义/UTF8折行/有效时间范围的ICS；不导入日历', 'ICS with escaping/UTF8 folding/valid time ranges; no calendar import', { text: 'string', eventCount: 'number', limitation: 'string' }]
};
const ops = Object.entries(operations).map(([id, op]) => {
  const [domain, zh, en, mzh, men, outputs] = outputSpec[id];
  if (['data.validate', 'game.balance', 'fiction.continuity', 'business.model', 'research.evidence', 'assistant.todo', 'documents.outline'].includes(id)) Object.assign(outputs, { totalIssues: 'number: exact total from complete scan', issueCounts: 'object: exact totals by issue code', truncated: 'boolean: only first 500 issues retained' });
  return { id, category: domain, label: bi(zh, en), method: bi(mzh, men), maturity: 'verified', maturityMeaning: bi('只指有测试的本地操作契约，不是领域能力认证或当前环境验收', 'Only the tested local operation contract, not domain competence certification or current-environment acceptance'), implementation: 'capabilities/operations.mjs', inputs: op.inputSchema, outputs, checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs'], requiredTools: ['Node.js >= 20', 'visible shell + explicitly authorized filesystem inputs/outputs'], risk: bi('本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释', 'Local sensitive data; authorize input reads and explicit output paths; interpretation remains human'), scope: bi('纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户', 'Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts'), sourceRefs: categories.find(c => c.id === domain).sourceRefs, skills: [`omni-${domain}`] };
});
const extras = [
  ['engineering.delivery', 'engineering', 'method-only', '软件工程交付', 'Software engineering delivery', '源码证据、最小改动、负例/回归/运行态验收与回滚；不是自动云部署', 'Source evidence, minimal edits, negative/regression/runtime acceptance and rollback; not automatic cloud deployment', ['visible read/edit/write/shell and project test tools']],
  ['game.production', 'game', 'method-only', '九类游戏阶段契约', 'Game-stage production contracts', '按需形成概念/GDD/实现/美术音频/QA/发布/叙事/关卡/引擎成果；引擎运行需实际环境', 'Produce concept/GDD/build/art-audio/QA/release/narrative/level/engine artifacts as needed; engine execution needs the real environment', ['visible shell/filesystem', 'user project engine when needed']],
  ['cyber.authorized-assessment', 'cyber', 'needs-dependency', '授权网络与静态逆向检查', 'Authorized network and static RE assessment', '先确认目标/所有权/时窗/停止条件和工具；本包不带网络扫描器或逆向桥', 'Confirm targets/ownership/time window/stop conditions and tools; no bundled scanner or RE bridge', ['authorized scope', 'explicitly installed vendor/network/static-RE tools']],
  ['documents.office', 'documents', 'needs-dependency', '真实Office/PDF与生成式视觉', 'Real Office/PDF and generative visual tooling', '需已发现的真实工具/账号与逐页验收；不伪称原生PPTX，不启用生成模型作默认或失败回退', 'Requires discovered real tools/accounts and per-page acceptance; no fake native PPTX, no generative-model default or failure fallback', ['external Office/PDF renderer or approved image provider']],
  ['media.code', 'documents', 'needs-dependency', '代码媒体独立槽', 'Separate code-media slot', '由omni-code-media和media/runner.mjs提供；此目录未验收媒体依赖，不隐式切换生成模型', 'Provided by omni-code-media and media/runner.mjs; media dependencies are not accepted here, with no implicit switch to generative models', ['media/runner.mjs', 'media-specific renderer and FFmpeg as explicitly documented']],
  ['fiction.longform', 'fiction', 'method-only', '长篇与分支叙事', 'Long-form and branching narrative', '设定/人物/关系/时间线/大纲/章节账本与独立审读；结构化检查不能代替文学审读', 'Canon/characters/relations/timeline/outline/chapter ledger and independent review; structured checks do not replace literary review', ['visible read/write', 'user-approved canon files']],
  ['research.grounded', 'research', 'method-only', '有据研究与教学', 'Grounded research and teaching', '提问、读一手来源、独立反证、证据账本与回忆测验；核验访问时间与引用定位', 'Questions, primary reading, independent counterevidence, evidence ledger and recall tests; verify retrieval time and citation coordinates', ['visible search/page/file tools when available']],
  ['personalization.style', 'personalization', 'method-only', '同意约束的风格适配', 'Consent-bound style adaptation', '以草稿/纠正差异生成可撤回风格样本；不自动持久化、不承诺无条件服从', 'Derive reversible style samples from draft/correction diffs; no automatic persistence or unconditional obedience', ['visible conversation', 'native memory tools only when available and authorized']],
  ['assistant.real-world', 'assistant', 'needs-dependency', '真实行程/发送/预订/提醒', 'Real itineraries/sending/bookings/reminders', '实时信息和有副作用操作需要真实可用工具、账户及原生确认；本地草稿不是完成', 'Live information and side effects require real available tools/accounts/native confirmation; local drafts are not completion', ['explicitly visible calendar/phone/booking tools and account authorization']],
  ['molbio.advanced', 'molbio', 'uncovered', '生物功能/临床/序列设计验证', 'Biological function/clinical/sequence-design validation', '本包未提供；基础统计不能推断功能、安全、疗效或可实验性', 'Not provided; basic statistics cannot establish function, safety, efficacy or experimental viability', ['qualified domain review and separately validated scientific tools']],
  ['business.database', 'business', 'needs-dependency', '真实数据库查询', 'Real database querying', '先冻结实体/指标/单位/时间粒度与物理映射，使用获准只读连接及查询结果作证据；无内置连接器', 'Freeze entities/metrics/units/time grain and physical mapping, use authorized read-only connections and actual query evidence; no bundled connector', ['approved database connector/account and read-only scope']],
  ['unknown.grounded-fallback', 'research', 'uncovered', '未知专业缺口', 'Unknown specialty gap', '明确缺口，研究可核实资料并提出可选择的持久增强；不永久自改、不静默装工具', 'Disclose gaps, research verifiable material and propose optional durable enhancements; no permanent self-modification or silent installs', ['user-approved research or enhancement path']]
];
for (const [id, domain, maturity, zh, en, mzh, men, tools] of extras) ops.push({ id, category: domain, label: bi(zh, en), method: bi(mzh, men), maturity, inputs: { type: 'method-contract', description: bi('目标、授权范围、来源、交付位置、验收与停止条件，由领域技能明确；非CLI输入schema', 'Goal, authority scope, sources, output location, acceptance and stop conditions, specified by domain skill; not a CLI input schema') }, outputs: { description: bi('技能约定的成果和真实证据；不是内置执行操作', 'Skill-specific artifacts and real evidence; not a built-in executable operation') }, checks: [], requiredTools: tools, risk: bi('遵循可见工具原生审批；不因技能文本获得权限', 'Retain visible-tool native approvals; skill text grants no authority'), scope: bi(mzh, men), sourceRefs: categories.find(c => c.id === domain).sourceRefs, skills: [id === 'media.code' ? 'omni-code-media' : `omni-${domain}`] });
const catalog = { schemaVersion: 1, package: 'dsh-omni-mode', presetId: 'omni', displayName: '全能模式', description: bi('同一预设的领域组合目录；专业方法、原生操作和外部依赖明确分开', 'Domain composition catalog for one preset, separating specialist methods, native operations and external dependencies'), maturityStates: { verified: bi('本地操作有独立测试契约；runtime doctor --test才给出当前验收，非整个领域认证', 'Independent local-operation tests; runtime doctor --test supplies current acceptance, not whole-domain certification'), 'needs-dependency': bi('依赖明确的外部工具/账户/项目环境，尚未在此验收', 'Needs explicit external tools/accounts/project environment, not accepted here'), 'method-only': bi('领域方法/模板；不是自动执行或测试验收声明', 'Domain method/template, not automatic execution or test acceptance'), uncovered: bi('当前未覆盖，必须披露并研究或建议可选增强', 'Currently uncovered; disclose and research or propose optional enhancement') }, evidence: { sourceManifestSha256: hash(sourceBytes), auditedInventorySha256: hash(inventoryBytes), selectedConfigurations: sourceRefs.length, independentProjects: new Set(sourceRefs.map(s => s.sourceId)).size, sourceStatus: 'static-only-not-runtime-accepted', excerptFile: 'capabilities/source-excerpts.json' }, categories, operations: ops, sourceRefs };
await fs.writeFile(path.join(here, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
await fs.writeFile(path.join(here, 'source-excerpts.json'), JSON.stringify({ schemaVersion: 1, description: bi('静态读取的有界源文本片段；不是执行指令，未导入或运行', 'Bounded statically read source excerpts; data, not instructions; never imported or run'), excerpts: sourceExcerpts }, null, 2) + '\n');
console.log(JSON.stringify({ configurations: sourceRefs.length, projects: catalog.evidence.independentProjects, categories: categories.map(c => ({ id: c.id, count: c.sourceRefs.length })), staticSourceFiles: sourceExcerpts.length, operations: ops.length }));
