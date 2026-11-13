# 全能模式领域能力 / Omni domain capabilities

同一个包`dsh-omni-mode`、同一个`omni`预设，显示名**全能模式**。这里提供十类专业方法与11个有独立测试的原生Node操作，不是第二个预设、Host工具注入、模型切换器或自动安装器。根生产依赖为空；运行时只用Node内置模块。 / Same package, one `omni` preset, display name **全能模式**. Ten specialist methods and eleven independently tested native-Node operations, not another preset, Host tool injection, model switcher or installer. Root production dependencies remain empty; runtime imports Node builtins only.

## 发现与真实成熟度 / Discovery and real maturity

- [目录 / Catalog](catalog.json)：schemaVersion 1；中英标签/方法、操作输入schema/输出字段、checks/requiredTools/risk/scope/sourceRefs/skills。`list`提供同一机器可读目录。 / Bilingual labels/methods, input schemas/output fields, checks/tools/risk/scope/sourceRefs/skills; `list` exposes the same machine-readable catalog.
- [静态源文本 / Static source excerpts](source-excerpts.json)：100个精确`package#configId`、63个独立项目，192个实际固定源文件的有界片段。生成时核验归档及完整文件SHA256，与来源清单/完整审计库存匹配；从未安装、导入或执行研究对象。 / 100 exact configuration keys, 63 projects, bounded excerpts of 192 pinned source files. Generation checked archive and full-file hashes against the source manifest/full audited inventory; subject code was never installed/imported/executed.
- 精确主分类 / Exact primary partition：工程60、游戏10（同一highho项目）、安全/网络/RE6、文档/视觉4、小说3、研究/学习4、个性化6、助理4、分子生物1、业务2。 / Engineering60, game10(one highho project), cyber/network/RE6, documents/visual4, fiction3, research/learning4, personalization6, assistant4, molbio1, business2.

四种状态 / Four states:
- `verified`：仅限11个本地操作的独立测试契约，不是整个领域认证或任意环境的验收。 / Independently tested contracts for eleven local operations only, not whole-domain competence or arbitrary environment acceptance.
- `needs-dependency`：真实Office/网络/数据库/日程/媒体等外部工具、项目或账号尚需发现与验收。 / Real external tools/project/accounts need discovery and acceptance.
- `method-only`：领域方法、模板与验收指导，不伪装成自动工具。 / Specialist instructions/templates/acceptance, not fake automatic tooling.
- `uncovered`：当前未覆盖，披露缺口、研究一手资料并提出可选择增强；不永久自改。 / Uncovered scope; disclose, research primary evidence and propose optional enhancement, never permanent self-modification.

```sh
node <package-root>/capabilities/runner.mjs list
node <package-root>/capabilities/runner.mjs doctor
node <package-root>/capabilities/runner.mjs status
node <package-root>/capabilities/runner.mjs doctor --test
```

普通doctor/status只检查本地运行文件/目录，`installed:true`只指CLI存在；不执行测试时`accepted:"not-tested-this-run"`，操作不升为verified。`--test`运行包内3个纯原生测试文件，给实际命令、Node版本、源码/测试哈希、退出码和有界测试输出；测试缺失为unsupported/not accepted，不影响普通status。测试不依赖研究缓存、宿主全局模块或网络。 / Normal doctor/status checks local runtime files/catalog. Installed means local CLI only. Without tests, acceptance is not-tested-this-run and operations are not upgraded to verified. `--test` runs three package-contained native test files and reports command, Node version, hashes, exit and bounded output. Missing tests are unsupported/not accepted but do not break normal status. No research cache/global module/network dependency.

`testsExecuted/localContractTests`是测试证据；`operationInvoked/hostMounted/realServiceAccepted`没有独立证据时保持`not-checked`。**成功测试不等于已挂载Host、登录账号、实际网络/Office/数据库/游戏实机或领域能力认证。** / Test evidence is separate from operation invocation, Host mounting and real-service acceptance, which stay not-checked without independent evidence. **Tests do not accept Host/accounts/networks/Office/databases/playtests or whole domains.**

## 安全调用与明确读写 / Safe calls and explicit I/O

先用当前可见文件/终端工具发现真实包路径。CLI不授予额外文件权限，始终遵守原生审批及用户停止权。输入必须是JSON，不加载脚本、URL、模块、嵌入表达式或网络资源。 / Discover the actual package path with visible tools. The CLI grants no authority; native approvals and stopping remain binding. Inputs are JSON, not scripts/URLs/modules/embedded expressions/network resources.

```sh
node <package-root>/capabilities/runner.mjs run molbio.fasta \
  --input <explicit-authorized-input.json>
node <package-root>/capabilities/runner.mjs run assistant.ics \
  --input <explicit-authorized-input.json> --text \
  --out <explicit-new-output.ics> --allow-write \
  --root <authorized-directory>
```

- `--input`明确授权读取该普通JSON文件；若先前没有用户读取授权，应先取得。`--json '<JSON>'`直接提供数据、不读源文件；敏感输入优先文件，命令行参数可能被进程列表记录。二者必须且只能选一个。 / `--input` names the authorized regular JSON file; obtain authority first if absent. `--json` supplies data without reading a file; prefer files for sensitive input because argv may be visible. Exactly one is required.
- 默认stdout返回JSON，`--text`只对有`text`字段的操作输出原始文档/CSV。默认不写用户文件。写入须同时指定新路径和`--allow-write`；该标志不是权限绕过或用户确认的替代品。 / Default JSON stdout; `--text` emits actual document/CSV only when present. No default file writes. Explicit new path and allow-write are required, not substitutes for authorization.
- 输入不超过2MiB、普通文件且拒绝末端符号链接；schema拒绝未知字段/错误类型/非有限数字/保留对象键。字符串/数组有上限，结果不超过8MiB。 / Input ≤2MiB, regular file, no leaf symlink. Schemas reject unknown fields/types/nonfinite numbers/reserved object keys. Strings/arrays are bounded; result ≤8MiB.
- 问题报告完整扫描输入，保留**前500条**示例；`totalIssues`与`issueCounts`是精确总数，`truncated:true`明确截断，不静默漏检。 / Reports scan all input and retain **first500** samples; exact totals/counts and an explicit truncated flag prevent silent omission.
- 输出采用同目录独占owned临时文件→完成写入/同步→硬链接no-replace提交；检查目标普通文件、同设备/inode和内容，删除临时文件后再读回。永不覆盖已存在路径；不支持已验证硬链接语义的文件系统fail closed。失败仅清理本次独占创建的临时/未提交目标，不删除已有文件。 / Output uses an exclusive same-directory owned temp, completed write/sync, hardlink no-replace commit, regular-file/device/inode/content checks and readback after temp removal. Never overwrite existing paths; fail closed on unsupported hardlink semantics. Clean only this invocation's owned temp/uncommitted output, never prior files.
- `--root`是canonical路径防错限制，**不是安全沙箱**。返回canonical父目录+文件名并重查父目录；纯Node fs不能完全阻止恶意并发祖先符号链接替换。遵守现有shell审批，不向不可信可并发改动的目录写入。 / Root is canonical path mistake prevention, **not a sandbox**. Canonical parent paths are rechecked, but Node fs cannot eliminate malicious ancestor-symlink races. Keep native shell approval and avoid concurrently attacker-controlled destinations.
- 错误：stderr JSON `{error:{code,message,path?}}`，退出1。结构检查发现业务问题时返回`valid:false`/issues，进程仍退出0；调用方必须读结果，不能只看退出码。 / Errors use stderr JSON and exit1. Domain validation issues return valid:false with exit0; inspect results, not exit status alone.

## 11个实际操作与输入 / Eleven real operations and inputs

完整、闭合的输入schema在目录/`list`中；下面写明语义，未知字段不接受。通用issue结构为`{code,path,message}`；报告型操作附`totalIssues/issueCounts/truncated`。 / Full closed schemas are in catalog/list; unknown fields are rejected. Common issue records have code/path/message; report operations include exact totals/counts/truncation.

### data.validate — 数据校验 / Data validation
必填`format:"csv"|"json", fields:[{name,type:"string"|"number"|"boolean",required?,unique?}]`。CSV需`text`，JSON需`table:{columns:string[],rows:scalar[][]}`，不得混用。表头唯一、行宽相等；CSV保留字符串，数字/布尔做严格文本校验，JSON不强转类型；空字符串/null按缺失处理。 / Required format/fields; CSV text versus JSON table are exclusive. Unique columns/matching widths; lexical CSV validation without coercion, strict JSON types, empty/null as missing.
输出`valid,issues,rowCount,columns`；缺列/必填/类型/唯一性问题明确列出。 / Returns validity/issues/row count/columns with explicit missing/type/uniqueness findings.

### data.transform — 数据变换 / Data transform
同样的输入表，另需`select:string[],outputFormat:"json"|"csv"`；可选`rename:[{from,to}],filter:{column,equals:scalar},formulaPolicy:"reject"|"escape"`。严格等值筛选、保留顺序/类型，不排序/推断字段/执行表达式。JSON输出`columns,rows`；CSV输出`text,rowCount`，RFC4180引号/CRLF。 / Same table plus explicit projection/output format; optional renames/equality filter/formula policy. Strict equality and preserved order/types, no sort/inference/evaluation. JSON table or quoted CRLF CSV output.
CSV中字符串前导空白后的`=,+,-,@`默认拒绝（包括表头），显式escape才加单引号；数值类型负数不当公式。 / Reject potential formula-leading strings including headers by default; explicit escape prefixes a quote. Typed negative numbers are not formulas.

### game.balance — 数值QA / Numerical QA
必填`units:[{id,hp,damage,interval,cost}]`，可选`maxEfficiencyRatio>=1`。hp/interval/cost正、damage非负，ID唯一。计算DPS、DPS/cost、正效率最大/最小比及零输出/用户阈值问题；hp仅校验，不参与生存能力模型。 / Positive HP/interval/cost, nonnegative damage, unique IDs. Computes DPS, DPS/cost, positive-efficiency ratio and zero-output/user-threshold issues; HP is validated only.
输出`valid,issues,units:[{id,dps,efficiency}],efficiencyRatio,model`。无护甲/命中/移动/随机/实机反馈，不代表完整平衡验证。 / No armor/accuracy/movement/randomness/playtest feedback; not full balance acceptance.

### fiction.continuity — 设定连续性 / Canon continuity
必填`entities:string[],facts:[{entity,key,value:scalar,from,to}],scenes:[{id,time,mentions:string[],assertions:[{entity,key,value}]}]`。同单位非负时间，事实闭区间；ID唯一。列出未知实体、重叠不同事实、无支撑/不匹配场景断言。 / Common nonnegative time units, closed fact intervals and unique IDs; reports unknown entities, overlapping unequal facts and unsupported/mismatched assertions.
输出`valid,issues,sceneCount,limitation`。不解析正文、推断年龄或评判文学。 / No prose parsing, age inference or literary verdict.

### molbio.fasta — 基础序列统计 / Basic sequence statistics
必填`text,alphabet:"dna"|"rna"`。FASTA标题首token为唯一ID，至少一个非空记录；IUPAC DNA或RNA字母表严格分开，空白行忽略/行端裁去/大小写归一，不允许内部空格/缺口/数字；最多10,000记录。 / Unique first header tokens, nonempty records, strict separate DNA/RNA IUPAC; blank/edge whitespace and case normalized, not internal spaces/gaps/digits. ≤10,000 records.
输出每条`id,length,counts,ambiguous,gcFractionAll,gcFractionCanonical`；GC全长分母与仅标准碱基分母分开，无标准碱基后者为null，不概率分配歧义。**非临床、功能、结构、毒性、设计或实验验证。** / Separate all-base/canonical denominators; canonical GC null with no canonical bases, no ambiguity probabilities. **Not clinical/functional/structural/toxicity/design/experimental validation.**

### business.model — 语义结构一致性 / Semantic model consistency
必填`entities:[{id,fields:[{name,type:"string"|"number"|"boolean"|"date",primary?,nullable?,unique?}]}],relations:[{from:{entity,field},to:{entity,field},cardinality:"one-to-one"|"many-to-one"|"one-to-many"|"many-to-many"}]`。检查重复/主键/端点/类型/基数。 / Checks duplicates/keys/endpoints/types/cardinality.
单字段关系要求相应端点独立唯一；复合主键单成员非唯一，除非显式unique，需复合映射时列问题而不谎报通过。多对多需显式中间实体。输出`valid,issues,entityCount,relationCount,limitation`；只查声明结构，不连库/SQL或证明真实数据完整性。 / Single-field endpoints require independent uniqueness; composite-key components are not unique unless explicitly declared. Report unsupported composite mapping, require junction entities. Declared structure only, no DB/SQL/actual data integrity claim.

### research.evidence — 引用结构覆盖 / Citation structure coverage
必填`sources:[{id,title,url}],claims:[{id,text,sourceIds:string[]}]`。来源/主张ID唯一，URL经URL解析且HTTP(S)/非空hostname，列出空引用/不存在ID。输出`valid,issues,claimCount,sourceCount,limitation`。 / Unique IDs, parsed HTTP(S) URL with hostname; reports empty/missing citations.
**不联网、不核验来源真实性/时效、原文支持关系、引文或结论真伪。** / **No network/authenticity/currency/entailment/quotation/truth verification.**

### cyber.indicators — 本地指标提取 / Local indicator extraction
必填`text`；输出去重排序`ipv4,sha256,limitation`。IPv4是完整token、四个0–255十进制段，无前导零（单0例外），不从`1.2.3.4.5`截前缀；SHA256为64十六进制字符串并小写。 / Full canonical decimal IPv4 tokens with no leading zeros, not dotted prefixes; SHA256 is a lowercased 64-hex string.
**不扫描/连接/DNS/威胁情报/判恶意/归因，不验证日志真实性。** / **No scanning/connections/DNS/intelligence/maliciousness/attribution/log-authenticity check.**

### documents.outline — Markdown草稿 / Markdown draft
必填`title,sections:[{heading,body,sourceIds?}],sources:[{id,title,url}]`。生成实际标题/章节/来源文本；缺失ID或坏URL报错，无引用章节列提示。输出`text,issues,limitation`及计数；正文保留Markdown，作为数据不执行。**不是Office/PDF，不证明引用内容。** / Generates actual Markdown; missing references/bad URLs error, uncited sections flagged. Body stays Markdown data. **Not Office/PDF or source-content verification.**

### assistant.todo — 依赖待办 / Dependency-aware todo
必填`title,items:[{id,text,done:boolean,dependsOn:string[],due?:"YYYY-MM-DD"}]`。ID唯一，依赖存在/无环，日期有效，已完成任务的未完成依赖列问题；输出`valid,issues,text,limitation`。**不创建提醒或调度任务。** / Unique IDs, existing acyclic dependencies, real dates; flags unfinished prerequisites. **No reminders/schedules.**

### assistant.ics — UTC日历草稿 / UTC calendar draft
必填`events:[{uid,summary,start,end,description?,location?}]`。唯一UID，严格有效`YYYY-MM-DDTHH:mm:ssZ`，结束晚于开始；TEXT转义/非法控制字符拒绝/75 UTF8字节折行。DTSTAMP取给定start以保持确定性，是草稿非发送时间证据。输出`text,eventCount,limitation`。**不解析时区/夏令时/自然语言，不导入/发邀请/预约。** / Unique UIDs, strict UTC second timestamps, valid ordering, escaping/control rejection/75-octet folding. Deterministic DTSTAMP=start is draft metadata. **No timezone/DST/NL parsing, imports/invites/bookings.**

## 测试与源码 / Tests and sources

```sh
node --test capabilities/operations.test.mjs \
  capabilities/runner.test.mjs capabilities/catalog.test.mjs
```

[操作测试 / Operation tests](operations.test.mjs)使用独立手算/负例，含500事实124,750冲突的有界报告、复合主键、ICS控制字、坏URL/IPv4。 [CLI测试 / CLI tests](runner.test.mjs)验证真实读写/不覆盖/删除temp后读回/解包式原生消费；ENOSPC与异常link语义是**明确模拟的错误回归**，不是实盘磁盘故障或所有文件系统认证。[目录测试 / Catalog tests](catalog.test.mjs)只读随包目录、片段和十个技能，不依赖研究目录/缓存。 / Tests use independent calculations and negatives, real filesystem CLI consumption, and explicitly simulated ENOSPC/abnormal-link regressions, not real disk-fault/all-filesystem certification. Metadata tests need only shipped files.

维护者可显式重建静态来源目录；这不是运行或安装研究对象： / Maintainers may explicitly regenerate static provenance, never executing/installing research subjects:
```sh
node capabilities/build-catalog.mjs \
  --sources <approved-sources.json> \
  --inventory <audited-inventory.json> \
  --cache <authorized-static-cache-directory> --write
```
只写本目录的catalog/source-excerpts，不联网；批准的100配置/63项目基线变化会失败，需要人工重审。 / Writes only this directory's catalog/excerpts, no network. Changed approved 100/63 baseline fails for manual review.

## 领域组合与局限 / Composition and limits
当前预设的路由由主集成负责；读取需要的一个领域技能，跨领域成果按依赖组合，不能把十个技能当十个同义人格或十个自动执行器。未知领域组合有据研究而非假装掌握；持久增强需要用户选择。 / Routing belongs to the preset integration. Load the relevant specialist skill and compose by artifact dependencies, not ten synonym personas/executors. Unknown domains use grounded research; lasting enhancements need user choice.

媒体槽为`omni-code-media`/`media/runner.mjs`，由独立实现与实际依赖测试负责，此目录保持needs-dependency。没有默认/失败时的ComfyUI或生图模型回退。真实Office、数据库、网络、引擎与提醒工具不在本地原生助手中伪造。 / Separate code-media implementation/dependency tests own that slot, which remains needs-dependency here. No ComfyUI/image-model default/failure fallback. No fake Office/database/network/engine/reminder tools.
