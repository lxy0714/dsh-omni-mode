// Maintainer-only deterministic local-operation metadata. Static source provenance
// is retained separately, never re-audited or re-labelled by a native refresh.
import { operations } from './operations.mjs';
const SPECS = [
  {
    "id": "data.validate",
    "category": "engineering",
    "label": {
      "zh": "结构化数据校验",
      "en": "Structured data validation"
    },
    "method": {
      "zh": "逐列类型/必填/唯一值；CSV保留文本不强制转换",
      "en": "Column type/required/unique checks; CSV remains text without coercion"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "rowCount": "number",
      "columns": "string[]",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "data.transform",
    "category": "engineering",
    "label": {
      "zh": "结构化数据变换",
      "en": "Structured data transform"
    },
    "method": {
      "zh": "显式选列/重命名/等值筛选与CSV公式保护",
      "en": "Explicit projection/rename/equality filter and CSV formula protection"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "columns": "string[] (JSON output)",
      "rows": "scalar[][] (JSON output)",
      "text": "string (CSV output)",
      "rowCount": "number (CSV output)"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "game.balance",
    "category": "game",
    "label": {
      "zh": "游戏数值QA",
      "en": "Game numerical QA"
    },
    "method": {
      "zh": "确定性DPS/成本效率和用户阈值检查，不推断实机平衡",
      "en": "Deterministic DPS/cost efficiency and user-threshold checks, not playtest balance"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "units": "{id,dps,efficiency}[]",
      "efficiencyRatio": "number|null",
      "model": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "fiction.continuity",
    "category": "fiction",
    "label": {
      "zh": "设定连续性检查",
      "en": "Canon continuity check"
    },
    "method": {
      "zh": "闭区间事实冲突、未知人物与场景断言；不自动解析正文",
      "en": "Closed-interval fact conflicts, unknown entities and scene assertions; no automatic prose parsing"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "sceneCount": "number",
      "limitation": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "molbio.fasta",
    "category": "molbio",
    "label": {
      "zh": "FASTA基础统计",
      "en": "Basic FASTA statistics"
    },
    "method": {
      "zh": "DNA/RNA IUPAC格式、长度、歧义数和两个GC分母",
      "en": "DNA/RNA IUPAC format, lengths, ambiguous counts and two GC denominators"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "alphabet": "dna|rna",
      "records": "{id,length,counts,ambiguous,gcFractionAll,gcFractionCanonical}[]",
      "limitation": "string"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "business.model",
    "category": "business",
    "label": {
      "zh": "实体关系一致性",
      "en": "Entity/relation consistency"
    },
    "method": {
      "zh": "字段端点、主键、类型与中间实体检查；不连接数据库",
      "en": "Field endpoints, primary keys, types and junction checks; no database connection"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "entityCount": "number",
      "relationCount": "number",
      "limitation": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "research.evidence",
    "category": "research",
    "label": {
      "zh": "引用结构覆盖",
      "en": "Citation structure coverage"
    },
    "method": {
      "zh": "来源ID/引用覆盖检查，不检索原文或验证事实",
      "en": "Source-ID/citation coverage checks, not retrieval or truth verification"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "claimCount": "number",
      "sourceCount": "number",
      "limitation": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "cyber.indicators",
    "category": "cyber",
    "label": {
      "zh": "本地指标提取",
      "en": "Local indicator extraction"
    },
    "method": {
      "zh": "从已提供文本去重提取IPv4/SHA256；不联网、不判恶意",
      "en": "Deduplicate IPv4/SHA256 from supplied text; no network or maliciousness verdict"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "ipv4": "string[]",
      "sha256": "string[]",
      "limitation": "string"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "documents.outline",
    "category": "documents",
    "label": {
      "zh": "Markdown文档草稿",
      "en": "Markdown document draft"
    },
    "method": {
      "zh": "标题/章节/来源生成可读文档，拒绝失联引用",
      "en": "Generate title/sections/sources document, rejecting dangling citations"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "text": "string",
      "issues": "issue[]",
      "limitation": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "assistant.todo",
    "category": "assistant",
    "label": {
      "zh": "依赖待办草稿",
      "en": "Dependency-aware todo draft"
    },
    "method": {
      "zh": "待办依赖闭环/日期检查与Markdown输出；不设提醒",
      "en": "Todo cycle/date checks and Markdown output; no reminders"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[]",
      "text": "string",
      "limitation": "string",
      "totalIssues": "number: exact total from complete scan",
      "issueCounts": "object: exact totals by issue code",
      "truncated": "boolean: only first 500 issues retained"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "assistant.ics",
    "category": "assistant",
    "label": {
      "zh": "UTC日历草稿",
      "en": "UTC calendar draft"
    },
    "method": {
      "zh": "转义/UTF8折行/有效时间范围的ICS；不导入日历",
      "en": "ICS with escaping/UTF8 folding/valid time ranges; no calendar import"
    },
    "implementation": "capabilities/operations.mjs",
    "outputs": {
      "text": "string",
      "eventCount": "number",
      "limitation": "string"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感数据；先获准读输入，写入须明确路径；输出仍须人工解释",
      "en": "Local sensitive data; authorize input reads and explicit output paths; interpretation remains human"
    },
    "scope": {
      "zh": "纯本地、有界数据计算；无网络/动态导入/嵌入代码执行；无外部账户",
      "en": "Pure local bounded data computation; no network/dynamic imports/embedded-code execution or external accounts"
    }
  },
  {
    "id": "game.offline",
    "category": "game",
    "label": {
      "zh": "精确离线收益",
      "en": "Exact offline rewards"
    },
    "method": {
      "zh": "显式秒上限/有理效率/产速/取整/收益cap；非负十进制字符串精确计算",
      "en": "Explicit time cap/rational efficiency/rates/rounding/reward caps; exact nonnegative decimal-string arithmetic"
    },
    "implementation": "capabilities/game-idle.mjs",
    "outputs": {
      "creditedSeconds": "safe integer",
      "discardedSeconds": "safe integer",
      "resources": "{id,exactAmount:{numerator,denominator},roundedAmount,awardedAmount,rewardCap,capped}[]; large integers remain strings",
      "rounding": "floor|ceil|half-up|half-even",
      "model": "string"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs",
      "capabilities/game-idle.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感输入；范围与规则由调用方明确，建议不是实际外部验收",
      "en": "Sensitive local input; caller-declared scope and rules, not external acceptance"
    },
    "scope": {
      "zh": "完整乘积一次取整后收益cap；不读存档、改游戏、结转余数或替用户定平衡",
      "en": "One rounding after the full product, then reward cap; no save reads, game edits, fractional carry or invented balance"
    }
  },
  {
    "id": "game.growth",
    "category": "game",
    "label": {
      "zh": "精确成长曲线",
      "en": "Exact growth curve"
    },
    "method": {
      "zh": "每请求等级独立base×有理倍率的等级次幂后一次取整，保持顺序和重复",
      "en": "Independently evaluate base times rational multiplier power per requested level, round once, preserve order/duplicates"
    },
    "implementation": "capabilities/game-idle.mjs",
    "outputs": {
      "base": "integer string",
      "multiplier": "reduced {numerator,denominator} strings",
      "values": "{level,exactAmount:{numerator,denominator},amount}[]; strings",
      "rounding": "floor|ceil|half-up|half-even",
      "model": "string"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs",
      "capabilities/game-idle.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感输入；范围与规则由调用方明确，建议不是实际外部验收",
      "en": "Sensitive local input; caller-declared scope and rules, not external acceptance"
    },
    "scope": {
      "zh": "有界整数/有理数，不逐级取整或暗设游戏值cap；不是经济/引擎验收",
      "en": "Bounded exact arithmetic, not rounded recurrence or a hidden gameplay cap; not economy/engine acceptance"
    }
  },
  {
    "id": "engineering.impact",
    "category": "engineering",
    "label": {
      "zh": "声明图影响与回归选择",
      "en": "Declared-graph impact and regression selection"
    },
    "method": {
      "zh": "from依赖to，求反向闭包与全部相关测试；未知/覆盖缺口建议全量",
      "en": "from depends on to; reverse closure/all intersecting tests, conservative full-suite on unknowns/coverage gaps"
    },
    "implementation": "capabilities/engineering-impact.mjs",
    "outputs": {
      "changedModules": "string[]",
      "affectedModules": "string[]",
      "relatedTests": "declared test IDs[]",
      "selectedTests": "declared test IDs[]",
      "unmappedPaths": "string[]",
      "uncoveredModules": "string[]",
      "cycles": "{moduleIds,affected}[]",
      "recommendation": "{mode:none|targeted|full-suite,reasons,selectionScope,requiresWholeSuiteDiscovery,message}",
      "testsExecuted": "false",
      "issues": "issue[] (first 500)",
      "totalIssues": "exact integer",
      "issueCounts": "exact totals per code",
      "truncated": "boolean",
      "scope": "declared graph only; wholeRepositoryVerified:false"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs",
      "capabilities/engineering-impact.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感输入；范围与规则由调用方明确，建议不是实际外部验收",
      "en": "Sensitive local input; caller-declared scope and rules, not external acceptance"
    },
    "scope": {
      "zh": "只验证供给图/覆盖声明，不解析任意源码或证明声明真实；full-suite仍须发现真实全套并实际跑测",
      "en": "Declared graph/coverage only; no arbitrary-source understanding or truth guarantee. Discover/execute the actual whole suite separately"
    }
  },
  {
    "id": "documents.audit",
    "category": "documents",
    "label": {
      "zh": "标准Markdown正文包核验",
      "en": "Standard Markdown bundle audit"
    },
    "method": {
      "zh": "标准AST核对跨文档目标/锚点/引用及结构；未解析候选与脚注扩展明确复核",
      "en": "Standard AST checks supplied targets/anchors/references/structure; unparsed candidates and footnote extensions require review"
    },
    "implementation": "capabilities/documents-audit.mjs",
    "outputs": {
      "valid": "boolean",
      "issues": "issue[] (first 200), accurate block ranges not fabricated inline positions",
      "totalIssues": "exact integer",
      "issueCounts": "exact totals per code",
      "truncated": "boolean",
      "documents": "{path,headings}[]",
      "parsedLinks": "number",
      "resolvedLinks": "number",
      "externalLinks": "structural URL count; not fetched",
      "parser": "pinned CommonMark/GitHub Slugger; rawHTMLRendered:false; footnoteExtensionsValidated:false",
      "unparsedSyntaxChecked": "boolean: explicit scope",
      "executionBoundary": "short-lived worker: 5000ms/96MiB V8 old space/8MiB output; not a sandbox or total-RSS bound",
      "actualFilesystemChecked": "false: supplied inventory, no user-target inspection",
      "externalContentFetched": "false"
    },
    "checks": [
      "capabilities/operations.test.mjs",
      "capabilities/runner.test.mjs",
      "capabilities/catalog.test.mjs",
      "capabilities/documents-audit.test.mjs"
    ],
    "requiredTools": [
      "Node.js >=24.9.0",
      "visible shell + explicitly authorized filesystem inputs/outputs"
    ],
    "risk": {
      "zh": "本地敏感输入；范围与规则由调用方明确，建议不是实际外部验收",
      "en": "Sensitive local input; caller-declared scope and rules, not external acceptance"
    },
    "scope": {
      "zh": "固定随包标准解析器仅Doc工作进程加载；不读取用户目标/联网/渲染；HTML/目录/资源片段/脚注扩展须另核验，候选可为字面文本",
      "en": "Pinned bundled parser loads only in the Doc worker; no user-target reads/network/rendering. HTML/directory/asset fragments/footnotes need review; candidates may be literal text"
    }
  },
  {
    id: 'engineering.delivery-check', category: 'engineering',
    label: { zh: '交付证据清单核对', en: 'Delivery evidence checklist' },
    method: { zh: '对照候选摘要与声明的必需检查，报告缺失、错候选、失败或未执行', en: 'Compare required checks and candidate digest with declared receipts; report missing, mismatched, failed and unrun checks' },
    implementation: 'capabilities/engineering-delivery.mjs',
    outputs: { allRequiredDeclaredPass: 'boolean; declared input only', results: 'requiredIndex (zero-based), status, blockerCode; input order', totalBlockers: 'exact count', blockerCounts: 'four exact counters', filesRead: 'false', signaturesVerified: 'false', checksExecuted: 'false', deploymentPerformed: 'false' },
    checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs', 'capabilities/engineering-delivery.test.mjs'],
    requiredTools: ['Node.js >=24.9.0', 'visible shell + explicitly authorized filesystem inputs/outputs'],
    risk: { zh: '清单或回执可由提供方遗漏或错误声明；不得用作真实发布授权', en: 'Declarations can omit checks or misstate results; no release authorization' },
    scope: { zh: '只比对声明，不读制品、不验签、不跑测试、不操作部署', en: 'Supplied declarations only; no artifact reads, signatures, test execution or deployment' }
  },
  {
    id: 'game.build-check', category: 'game',
    label: { zh: '游戏构建与测试清单核对', en: 'Game build and test checklist' },
    method: { zh: '按目标平台和当前构建标识对账，测试须绑定同一制品摘要', en: 'Match declared target/build IDs and bind every required test to that artifact digest' },
    implementation: 'capabilities/game-build-check.mjs',
    outputs: { valid: 'boolean; supplied declarations only', targets: 'target and required test results, in declared order', issues: 'up to 500 issue examples', totalIssues: 'exact count', issueCounts: 'exact by code', truncated: 'boolean', artifactsVerified: 'false', buildsExecuted: 'false', testsExecuted: 'false' },
    checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs', 'capabilities/game-build-check.test.mjs'],
    requiredTools: ['Node.js >=24.9.0', 'visible shell + explicitly authorized filesystem inputs/outputs'],
    risk: { zh: '旧版本记录不能补齐当前；声明不是设备、测试或上架验收', en: 'Stale records cannot credit the current build; declarations are not device, test or store acceptance' },
    scope: { zh: '只用供给数据，不开工程或引擎、不查证制品、不执行或上传', en: 'Supplied data only; no project or engine access, artifact verification, execution or upload' }
  },
  {
    id: 'personalization.style-draft', category: 'personalization',
    label: { zh: '可撤回的临时风格建议', en: 'Reversible scoped style draft' },
    method: { zh: '只有明确同意才构造临时建议；撤回需匹配供给的当前状态和范围', en: 'Draft only on explicit consent; undo checks the supplied current state and scope' },
    implementation: 'capabilities/style-draft.mjs',
    outputs: { scope: 'current-task or current-draft', status: 'draft, consent-required, revert-draft or undo-conflict', rules: 'bilingual fixed labels for length, tone and structure', proposedState: 'enum-only state or null', undo: 'scoped data or null; not an authorization token', memoryWritten: 'false', profileChanged: 'false', rulesApplied: 'false' },
    checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs', 'capabilities/style-draft.test.mjs'],
    requiredTools: ['Node.js >=24.9.0', 'visible shell + explicitly authorized filesystem inputs/outputs'],
    risk: { zh: '临时风格不是身份、授权或长期偏好；不接收原稿或任意提示', en: 'Scoped suggestions are not identity, authority or durable preference; no original draft or arbitrary prompt inputs' },
    scope: { zh: '只生成建议，不应用、不持久化、不改事实或安全边界', en: 'Draft output only; no application, persistence or changes to facts or safety boundaries' }
  },
  {
    id: 'research.quote-check', category: 'research',
    label: { zh: '所供片段引文位置核对', en: 'Supplied excerpt quotation check' },
    method: { zh: '在所供行数组的声明区间逐行等值；不归一化或搜索别处', en: 'Compare exact lines at the declared interval, with no normalization or search elsewhere' },
    implementation: 'capabilities/research-quotes.mjs',
    outputs: { valid: 'boolean; zero issues in supplied quotations only', results: 'zero-based quote index, status, counts and optional first mismatch coordinate', issues: 'up to 500 examples; no raw text/ID echo', totalIssues: 'exact count', issueCounts: 'exact per code', sourceFilesRead: 'false', externalContentFetched: 'false', sourceAuthenticityVerified: 'false', claimSupportEvaluated: 'false' },
    checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs', 'capabilities/research-quotes.test.mjs'],
    requiredTools: ['Node.js >=24.9.0', 'visible shell + explicitly authorized filesystem inputs/outputs'],
    risk: { zh: '断章取义或伪造来源仍可能逐字匹配；不把相等当真实性或论点支撑', en: 'A fabricated or out-of-context excerpt can still match; equality is not authenticity or claim support' },
    scope: { zh: '仅所供片段内从1开始的闭区间；不读原件、不联网、不解析PDF', en: 'One-based inclusive positions inside supplied lines only; no original-file access, network or PDF parsing' }
  },
  {
    id: 'fiction.thread-check', category: 'fiction',
    label: { zh: '章节伏笔与回收账本', en: 'Chapter setup/payoff ledger' },
    method: { zh: '按章与事件数组先后匹配首个伏笔和其后的首个回收；开放不是错误', en: 'Match first setup and first later payoff in input array order; open is not an error' },
    implementation: 'capabilities/fiction-threads.mjs',
    outputs: { needsReview: 'boolean for early or repeated declarations, not a story judgment', threads: 'status open, paid-off or payoff-only; zero-based input positions', statusCounts: 'exact by status', issues: 'first 500 review examples', totalIssues: 'exact count', issueCounts: 'exact by code', proseRead: 'false', storyEvaluated: 'false', memoryWritten: 'false' },
    checks: ['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs', 'capabilities/fiction-threads.test.mjs'],
    requiredTools: ['Node.js >=24.9.0', 'visible shell + explicitly authorized filesystem inputs/outputs'],
    risk: { zh: '闪回、悬念与重复线索可能是作者有意设计；复核不是判错', en: 'Flashbacks, suspense and repeated clues can be intentional; review is not an error verdict' },
    scope: { zh: '只处理单叙述线供给事件，不读写小说正文、不合并分支、不推断故事时间', en: 'Supplied events on one narrative only; no prose I/O, branch merging or story-time inference' }
  }
];

const bi = (zh, en) => ({ zh, en });
export function makeNativeCatalogEntries(categories) {
  const indexed = new Map(SPECS.map(x => [x.id, x]));
  if (indexed.size !== SPECS.length || indexed.size !== Object.keys(operations).length) throw Error('Native metadata/registry cardinality mismatch');
  return Object.entries(operations).map(([id, op]) => {
    const spec = indexed.get(id), category = categories.find(c => c.id === spec?.category);
    if (!spec || !category || !Array.isArray(category.sourceRefs)) throw Error('Native metadata/category missing: ' + id);
    return { ...structuredClone(spec), maturity: 'verified', maturityMeaning: bi('只指有测试的本地操作契约，不是领域能力认证或当前环境验收', 'Only the tested local operation contract, not domain competence certification or current-environment acceptance'),
      inputs: structuredClone(op.inputSchema), sourceRefs: [...category.sourceRefs], skills: ['omni-' + spec.category] };
  });
}
export function refreshNativeCatalog(existing) {
  const next = structuredClone(existing);
  if (next.evidence?.selectedConfigurations !== 100 || next.evidence?.independentProjects !== 63 || next.sourceRefs?.length !== 100) throw Error('Approved source baseline changed');
  for (const op of next.operations) if (op.maturity === 'verified' && !Object.hasOwn(operations, op.id)) throw Error('Unregistered verified entry: ' + op.id);
  const before = JSON.stringify({ ...next, operations: undefined });
  const extras = next.operations.filter(op => !Object.hasOwn(operations, op.id));
  next.operations = [...makeNativeCatalogEntries(next.categories), ...extras];
  if (JSON.stringify({ ...next, operations: undefined }) !== before) throw Error('Immutable source provenance changed');
  return next;
}
