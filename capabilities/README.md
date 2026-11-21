# 全能模式领域能力 / Omni domain capabilities

同一个包`dsh-omni-mode`、同一个`omni`预设，显示名**全能模式**。`v1.8.0` 提供十类专业方法与 20 个本地操作。根 npm 生产依赖为空；文档检查随包提供固定标准解析器与许可，只在短生命周期工作进程加载，不注入 Host。 / Same package and preset. `v1.8.0` provides ten specialist method areas and twenty local operations. No root npm production dependency; document auditing bundles a pinned licensed parser, loaded only in its short-lived worker, not the Host.

## 发现与真实成熟度 / Discovery and real maturity

- [目录 / Catalog](catalog.json)：schemaVersion 1；中英标签/方法、操作输入schema/输出字段、checks/requiredTools/risk/scope/sourceRefs/skills。`list`提供同一机器可读目录。 / Bilingual labels/methods, input schemas/output fields, checks/tools/risk/scope/sourceRefs/skills; `list` exposes the same machine-readable catalog.
- [静态源文本 / Static source excerpts](source-excerpts.json)：100个精确`package#configId`、63个独立项目，192个实际固定源文件的有界片段。生成时核验归档及完整文件SHA256，与来源清单/完整审计库存匹配；从未安装、导入或执行研究对象。 / 100 exact configuration keys, 63 projects, bounded excerpts of 192 pinned source files. Generation checked archive and full-file hashes against the source manifest/full audited inventory; subject code was never installed/imported/executed.
- 精确主分类 / Exact primary partition：工程60、游戏10（同一highho项目）、安全/网络/RE6、文档/视觉4、小说3、研究/学习4、个性化6、助理4、分子生物1、业务2。 / Engineering60, game10(one highho project), cyber/network/RE6, documents/visual4, fiction3, research/learning4, personalization6, assistant4, molbio1, business2.

四种状态 / Four states:
- `verified`：仅限20个本地操作的测试契约，不是整个领域认证或任意环境的验收。 / Tested contracts for twenty local operations only, not whole-domain competence or arbitrary environment acceptance.
- `needs-dependency`：真实Office/网络/数据库/日程/媒体等外部工具、项目或账号尚需发现与验收。 / Real external tools/project/accounts need discovery and acceptance.
- `method-only`：领域方法、模板与验收指导，不伪装成自动工具。 / Specialist instructions/templates/acceptance, not fake automatic tooling.
- `uncovered`：当前未覆盖，披露缺口、研究一手资料并提出可选择增强；不永久自改。 / Uncovered scope; disclose, research primary evidence and propose optional enhancement, never permanent self-modification.

```sh
node <package-root>/capabilities/runner.mjs list
node <package-root>/capabilities/runner.mjs list game.offline
node <package-root>/capabilities/runner.mjs doctor
node <package-root>/capabilities/runner.mjs status
node <package-root>/capabilities/runner.mjs doctor --test
```

普通doctor/status检查运行文件与目录，installed只指CLI。`--test`在源码仓库运行11个契约测试文件，哈希含全部新模块与固定vendor；报告真实命令/退出码/有界日志。测试文件不随安装包分发，安装态缺少它们会明确unsupported，而不是虚报已测；不影响普通status及实际run。测试无需研究缓存、宿主全局模块或网络。 / Doctor reports local installation only. Source `--test` runs eleven contract suites and fingerprints new modules/vendor. Tests are not shipped: installed-only test requests honestly return unsupported, while status/run still work. No research cache, global module or network is needed.

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
- 报告保留前500条示例，**documents.audit为前200条**；`totalIssues/issueCounts/truncated`说明完整计数与截断。未覆盖语法明确需复核，不把有限语法范围冒充通用审查。 / Reports retain 500 examples, **200 for documents.audit**, with exact counts/truncation. Unsupported syntax requires review rather than a universal audit claim.
- 输出采用同目录独占owned临时文件→完成写入/同步→硬链接no-replace提交；检查目标普通文件、同设备/inode和内容，删除临时文件后再读回。永不覆盖已存在路径；不支持已验证硬链接语义的文件系统fail closed。失败仅清理本次独占创建的临时/未提交目标，不删除已有文件。 / Output uses an exclusive same-directory owned temp, completed write/sync, hardlink no-replace commit, regular-file/device/inode/content checks and readback after temp removal. Never overwrite existing paths; fail closed on unsupported hardlink semantics. Clean only this invocation's owned temp/uncommitted output, never prior files.
- `--root`是canonical路径防错限制，**不是安全沙箱**。返回canonical父目录+文件名并重查父目录；纯Node fs不能完全阻止恶意并发祖先符号链接替换。遵守现有shell审批，不向不可信可并发改动的目录写入。 / Root is canonical path mistake prevention, **not a sandbox**. Canonical parent paths are rechecked, but Node fs cannot eliminate malicious ancestor-symlink races. Keep native shell approval and avoid concurrently attacker-controlled destinations.
- 错误：stderr JSON `{error:{code,message,path?}}`，退出1。结构检查发现业务问题时返回`valid:false`/issues，进程仍退出0；调用方必须读结果，不能只看退出码。 / Errors use stderr JSON and exit1. Domain validation issues return valid:false with exit0; inspect results, not exit status alone.

## 本地操作与输入 / Local operations and inputs

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

### 阶段 C：五项有界操作 / Phase C: Five bounded operations

- `engineering.delivery-check`：必填 `subjectSha256,requiredCheckIds,receipts`。每条回执为 `{checkId,subjectSha256,receiptSha256,outcome}`，状态限 `pass|fail|not-run`；摘要为小写 64 位十六进制。清单 1–500 项，回执最多 500 条；声明和回执各自 ID 唯一，拒绝未知引用。按零基 `requiredIndex` 输出，区分缺回执、错候选、声明失败和声明未跑，不回显输入摘要。只校验所给声明，不读盘、验签、跑测试或部署。 / Required candidate digest, checklist and receipt list. One receipt per declared check, with a lowercase 64-digit hex digest and `pass|fail|not-run`. Reports missing, mismatched, failed and unrun checks in checklist order without echoing digests. No artifact reads, signatures, execution or deployment.
- `game.build-check`：必填 `buildId,targets,builds,testRuns`。目标 `{id,requiredTests}`，构建 `{targetId,buildId,artifactSha256}`，用例 `{targetId,testId,buildId,artifactSha256,outcome}`；同一目标/版本构建或同一目标/版本/用例重复即拒绝。摘要为 64 位十六进制，比对不分大小写。只有当前版本和该目标构建摘要一致的用例能满足清单。最多 32 个目标、每目标 64 项必测、256 条构建、4096 条运行记录；问题计数完整，最多留 500 个示例。不上架，也不读取真游戏工程或实机。 / Required build ID, targets with tests, declared target/build artifacts and test runs bound to target/build/test and digest. Duplicates fail, digest comparison is case-insensitive, and only the current matching artifact can satisfy a test. Up to 32 targets, 64 tests per target, 256 builds and 4096 runs; exact issue totals and up to 500 examples. No real-game, engine/device or publishing action.
- `personalization.style-draft`：`draft` 需要 `{action,scope,current,consent,proposed}`；仅同意为 `true` 才返回双语规则和撤回数据 `undo`。`revert` 需要 `{action,scope,current,undo}`；范围与声明的当前状态都匹配才返回恢复建议。范围为 `current-task|current-draft`，状态只接收 `length,tone,structure` 的枚举。没有原稿、自定义提示、身份字段或记忆写入，也不应用规则。 / `draft` requires current and proposed closed style states, scope and an explicit `consent:true` to produce bilingual suggestions and undo data. `revert` accepts current state and undo data and only proposes restoration if both scope and current state match. Scope is current task/draft; choices are enums for length, tone and structure. No original draft, free prompt, identity data, rule application or memory write.
- `research.quote-check`：必填 `sources:[{id,lines}]`、`quotes:[{id,sourceId,startLine,endLine,quotedLines}]`。位置从 1 开始，两端包含，仅针对所供片段。逐行逐字比对，不换位置或归一化；缺源、越界、行数不符和文字不同分列。全部源与引文最多 20,000 行、1,000,000 UTF-16 代码单元；结果不回显文本/ID，不读取原件、不联网或判断真实性/主张支撑。 / Supply source and quote line arrays with one-based inclusive coordinates within the excerpt. Exact positional comparison: no normalization or lookup elsewhere. Missing source, range, line-count and text mismatches stay distinct. Across all text, up to 20,000 lines and 1,000,000 UTF-16 code units; no raw echo, original-file reads, network, authenticity or claim support assessment.
- `fiction.thread-check`：必填 `chapters:[{id,events:[{threadId,kind}]}]`，`kind` 为 `setup|payoff`。按输入披露顺序，保留提前和重复事件供复核，不倒填、重开或覆盖回收；开放本身不是错误。最多 500 章、每章 1,000 个事件、全部 10,000 个事件。结果以零基位置定位，不写入正文、记忆，不作文学判断。 / Supply chapters and explicit `setup|payoff` events in disclosure order. Early/repeated events remain review findings; later events do not backfill, reopen or replace matches. Open is not an error. Up to 500 chapters, 1,000 events per chapter and 10,000 overall. Zero-based positions only; no prose or memory writes and no literary judgment.

## 测试与源码 / Tests and sources

### 阶段B新增输入 / New Phase B inputs

- `game.offline`：显式安全整数秒`elapsedSeconds,maxOfflineSeconds`，有理`efficiency`，`rounding`及`resources:[{id,ratePerSecond,rewardCap}]`。有理数是`{numerator,denominator}`规范十进制字符串，分母正。完整乘积只取整一次后收益cap，不结转余数、不读游戏存档。 / Explicit safe seconds, rational efficiency/rates, rounding and per-invocation reward caps; exact product then one rounding then cap, no fractional carry/save reads.
- `game.growth`：`base`整数字符串、`multiplier`有理数、`levels`和`rounding`；每等级独立`base*(p/q)^level`，不逐级取整，不暗设平衡cap。四种取整为floor/ceil/half-up/half-even；大整数保持字符串。128位输入、4096位保留中间整数、131072位总数字输出与乘法工作量限制见[游戏方法](../skills/omni-game/SKILL.md)。 / Independent exact powers, explicit rounding, no hidden gameplay cap; bounded large integers remain strings. See the game skill for execution guards.
- `engineering.impact`：`scope,modules:[{id,paths:[{kind:file|directory,path}]}],dependencies:[{from,to}],tests:[{id,covers}],changedPaths`，可选`unknowns`。from依赖to，反向闭包选全部相关测试；未知/覆盖缺口建议full-suite，但仍只有声明测试ID，真实全套须另发现/执行。操作自身`testsExecuted:false`。 / Declared dependency/coverage graph, reverse impact closure and conservative fallback; IDs are not shell commands and actual tests remain unexecuted until a caller runs them.
- `documents.audit`：`documents:[{path,markdown}]`，可选`assets,requiredHeadings,checkHeadingLevels,checkUnparsedSyntax`。固定CommonMark/GitHub Slugger核验供给包；脚注扩展/其他HTML/目录/资源片段明确复核，未解析候选可为字面文本。定义观察绑定已核验的0.31.2实现，定义问题明确为全文块位置，不猜行内坐标。5秒/96MiB V8 old-space/8MiB输出工作进程限不是安全沙箱/总RSS保证，不抓网页、不核实目标文件或文献真伪。 / Pinned standard AST audit, explicit unsupported/intent review and honest document-wide definition locations; bounded trusted worker, no source-truth/target-file/network acceptance.

```sh
node --test capabilities/operations.test.mjs \
  capabilities/runner.test.mjs capabilities/catalog.test.mjs \
  capabilities/game-idle.test.mjs capabilities/engineering-impact.test.mjs \
  capabilities/documents-audit.test.mjs \
  capabilities/engineering-delivery.test.mjs capabilities/game-build-check.test.mjs \
  capabilities/style-draft.test.mjs capabilities/research-quotes.test.mjs \
  capabilities/fiction-threads.test.mjs
```

[操作测试 / Operation tests](https://github.com/lxy0714/dsh-omni-mode/blob/main/capabilities/operations.test.mjs)使用独立手算/负例，含500事实124,750冲突的有界报告、复合主键、ICS控制字、坏URL/IPv4。 [CLI测试 / CLI tests](https://github.com/lxy0714/dsh-omni-mode/blob/main/capabilities/runner.test.mjs)验证真实读写/不覆盖/删除temp后读回/解包式原生消费；ENOSPC与异常link语义是**明确模拟的错误回归**，不是实盘磁盘故障或所有文件系统认证。[目录测试 / Catalog tests](https://github.com/lxy0714/dsh-omni-mode/blob/main/capabilities/catalog.test.mjs)只读随包目录、片段和十个技能，不依赖研究目录/缓存。这些测试只在源码仓库，不随安装包分发；未发布改动须用当前工作树。 / Tests use independent calculations and negatives, real filesystem CLI consumption, and explicit fault mocks, not real disk-fault/all-filesystem certification. Source-only tests are not shipped; unreleased revisions require the current working tree.

以下**仅供源码仓库内的维护者**（`build-catalog.mjs`、测试文件与 `test-evidence.json` 都不随安装包发布，安装用户无需也无法运行）；这不是运行或安装研究对象： / The block below is **only for maintainers inside the source repository** — `build-catalog.mjs`, the test files and `test-evidence.json` are not shipped, so installed users neither need nor can run them. This never executes or installs research subjects:
```sh
node capabilities/build-catalog.mjs \
  --sources <approved-sources.json> \
  --inventory <audited-inventory.json> \
  --cache <authorized-static-cache-directory> --write
```
只写本目录的catalog/source-excerpts，不联网；批准的100配置/63项目基线变化会失败，需要人工重审。 / Writes only this directory's catalog/excerpts, no network. Changed approved 100/63 baseline fails for manual review.

只更新本地操作元数据用`node capabilities/build-catalog.mjs --refresh-native --write`；保留来源投影和非原生条目，**不是重新审查100套来源**。固定解析器来源/许可见[vendor记录](vendor/provenance.json)，维护者可运行`node scripts/vendor-document-parser.mjs --check`；该维护脚本不随包发布。 / Native-only refresh preserves source provenance/extras and is **not a new source audit**. Vendoring provenance records exact archives/licenses; the source-only checker is not shipped.

维护者可用 `node capabilities/build-test-evidence.mjs --write` 实跑清单中的本地契约测试并刷新证据，`--check` 核对固定输入清单、确切命令和执行记录。失败、跳过或空执行均拒绝刷新；并发生成器互斥。若异常退出遗留锁，不会自动抢锁；先确认无生成器在写入，再由维护者处理。生成器和证据仅供源码使用，不是签名证明或宿主验收。 / Maintainers can use `node capabilities/build-test-evidence.mjs --write` to run the listed local contract suites and refresh the record. `--check` validates the fixed input inventory, exact command and recorded execution. Failure, skips or empty execution prevent refresh; cooperating writers are mutually exclusive. A crash may leave a lock; confirm no generator is writing before removing it manually. The generator and record are source-only, not signed proof or Host acceptance.

## 领域组合与局限 / Composition and limits
当前预设的路由由主集成负责；读取需要的一个领域技能，跨领域成果按依赖组合，不能把十个技能当十个同义人格或十个自动执行器。未知领域组合有据研究而非假装掌握；持久增强需要用户选择。 / Routing belongs to the preset integration. Load the relevant specialist skill and compose by artifact dependencies, not ten synonym personas/executors. Unknown domains use grounded research; lasting enhancements need user choice.

媒体槽为`omni-code-media`/`media/runner.mjs`，由独立实现与实际依赖测试负责，此目录保持needs-dependency。没有默认/失败时的ComfyUI或生图模型回退。真实Office、数据库、网络、引擎与提醒工具不在本地原生助手中伪造。 / Separate code-media implementation/dependency tests own that slot, which remains needs-dependency here. No ComfyUI/image-model default/failure fallback. No fake Office/database/network/engine/reminder tools.
