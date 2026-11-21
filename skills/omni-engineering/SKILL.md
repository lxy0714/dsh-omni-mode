---
name: omni-engineering
description: 通用软件工程、架构/调试/测试/DevOps与CSV/JSON数据契约；按影响面组合实现与独立验收，不把编译成功当运行成功。 / Software engineering, architecture/debugging/testing/DevOps and CSV/JSON data contracts; compose implementation and independent acceptance by impact, not by compilation alone.
---

# 工程与数据契约 / Engineering and data contracts

## 入口与边界 / Entry and boundaries
- 这是同一omni中的专业方法，不切换模型/权限、不安装全局工具。先读真实源码和项目说明，用当前可见文件/终端/测试工具；不执行下载的研究样本。 / This is a specialty inside the same omni, not a model/permission switch or global installer. Read actual source/project instructions and use visible filesystem/shell/test tools; never execute downloaded research subjects.
- 小修直接定位→修改→最小回归；复杂/高风险变更才组合规划、只读审查或独立测试。只读分析不得擅自进入实施。 / For small changes, locate→edit→minimal regression. Compose planning, read-only review or independent tests only for complex/high-risk changes. Analysis-only requests do not authorize implementation.

## 专业交付 / Specialist delivery
1. 定义边界表：`用户输入 | 类型/单位 | 合法边界 | 缺省/错误 | 写入/外部影响 | 验收`；把未写明的规则列为未知，不发明产品政策。 / Define a boundary table: `input | type/unit | valid boundary | default/error | writes/external impact | acceptance`. Mark specification silence as unknown rather than invent product policy.
2. 定位调用链、生命周期、并发/取消、缓存失效和权限交界；区分观察与推断。架构交付包含依赖方向、失败传播、数据所有权及迁移/回滚，不只画框。 / Trace calls, lifecycle, concurrency/cancellation, cache invalidation and authority boundaries; separate observations from inference. Architecture includes dependency direction, failure propagation, data ownership and migration/rollback, not just boxes.
3. 复现真实缺陷，最小改动；每个边界家族至少一条负例。新逻辑补空输入、类型/边界值、取消/超时/重复请求/并发冲突等相关测试；不要破坏正确产物制造失败证据。 / Reproduce real defects and change minimally; add a negative assertion per relevant boundary family, including empty/type/limit/cancellation/timeout/duplicate/concurrent cases. Never damage correct work to fabricate a failing test.
4. 数据库先确认方言、主键、索引、锁/事务和迁移回滚；无连接不能声称查过库。部署先检查实际构建产物、环境配置的脱敏状态、健康探针和可执行回滚；没有发布授权不发布。 / For databases, establish dialect, keys, indexes, locking/transactions and migration rollback; no connection means no query claim. For deployment, inspect real artifacts, redacted config, health probes and executable rollback; do not publish without authorization.
5. 最终交接：`改动 | 实际命令/退出码 | 测试覆盖 | 运行态证据 | 未测边界 | 回滚`。build/lint不等于Host挂载、真实服务或账号验收。 / Handoff: `change | real command/exit | test coverage | runtime evidence | untested boundaries | rollback`. Build/lint is not Host mounting, real-service or account acceptance.

## 可执行数据助手 / Executable data helpers
从此技能目录按需读取 `../../capabilities/README.md` 和 `../../capabilities/catalog.json`；先发现包的绝对位置，不假定用户项目就是包目录。用当前可见shell执行 `node <package-root>/capabilities/runner.mjs list` 获取闭合输入schema。 / Read those resources on demand from this skill directory; discover the actual package root rather than assuming the user project is the package. Use the visible shell and `list` to retrieve closed input schemas.

- `data.validate`：CSV/JSON列类型、必填/唯一值。CSV保持字符串，仅校验数字/布尔文本，不自动转换。 / Column type/required/uniqueness checks. CSV retains strings and validates lexical numbers/booleans without coercion.
- `data.transform`：按显式选列、重命名、严格等值筛选生成JSON/CSV。CSV输出默认拒绝潜在公式，获用户同意后用`formulaPolicy:"escape"`加单引号；不会执行公式。 / Explicit projection, renaming and strict-equality filtering to JSON/CSV. CSV rejects potential formulas by default; use `formulaPolicy:"escape"` with consent to prefix a quote, never execute a formula.

最小校验输入 / Minimal validation input:
```json
{"format":"csv","text":"id,amount\nA,10\nB,20\n","fields":[{"name":"id","type":"string","required":true,"unique":true},{"name":"amount","type":"number","required":true}]}
```
变换的JSON表以`columns:string[]`和`rows:scalar[][]`表达；行宽必须一致，列名不得重复；不会猜隐藏schema。 / JSON tables use `columns:string[]` and `rows:scalar[][]`; row widths match and column names are unique. Never guess a hidden schema.

## 显式影响图与回归建议 / Explicit impact graph and regression advice
`engineering.impact`是无文件/网络/源码执行副作用的纯数据操作：只求声明图中的改动模块、所有反向依赖闭包及覆盖这些模块的测试ID，不自动解析所有语言，也不运行测试。先用`list`核对当前安装版本的闭合schema；`verified`仅指本地契约测试，不能把输入声明或静态覆盖当成全仓库事实。 / A pure data operation with no filesystem/network/source-execution effects. It finds changed modules, their complete reverse-dependency closure and all tests declaring coverage of those modules. It neither parses every language nor runs tests. Discover the installed closed schema with `list`; local contract verification is not repository-wide verification of declarations or coverage.

### 从获准真实文件建立输入 / Build input from authorized real files
1. 确认获准根目录、改动基线和可读文件；只读真实工程说明、包/构建清单、相关导入与测试配置，必要时读取既有覆盖报告并记下版本/时间。用当前可见读取/搜索工具，不下载或执行源码来“发现”依赖，不越界扫描。 / Establish the authorized root, change baseline and readable files. Read actual project instructions, manifests/build declarations, relevant imports and test configuration; inspect existing coverage reports with their version/time when useful. Use visible read/search tools, not downloaded/source execution or out-of-scope scans.
2. 为已核实边界分配大小写敏感模块ID，`modules:[{id,paths:[{kind:"file"|"directory",path}]}]`列明精确文件或目录。`file`只匹配本身；`directory`匹配本身及`path + "/"`下的所有路径，不是字符串任意前缀。重叠规则保留全部匹配模块，不按最长前缀漏掉父模块。 / Assign case-sensitive module IDs to inspected boundaries. File rules are exact; directory rules match the directory itself and slash-delimited descendants. All overlapping owners are included, not only the longest-prefix owner.
3. 逐边附上人工可复核的来源记录，再填`dependencies:[{from,to}]`：**from依赖to**，例如UI导入core就是`{"from":"ui","to":"core"}`；core改动才沿反向边影响UI。本操作不保存来源文件或证明关系真实；证据另列。未查清的动态导入、生成文件、插件注入、外部依赖/配置或图外模块必须写入`unknowns:string[]`并在`scope:string`说明范围，不能猜成无依赖。合法环和自环会有界报告，不阻断闭包。 / Record independently reviewable source evidence for each edge, then declare **from depends on to**. Core changes propagate backwards to UI, not vice versa. The operation does not retain source files or authenticate relationships; keep evidence separately. Put unresolved dynamic/generated/plugin/external/config/out-of-graph dependencies in `unknowns` and describe the graph in `scope`; do not infer their absence. Cycles and self-loops are bounded and reported, not rejected.
4. 从真实测试配置/现有报告核实`tests:[{id,covers:moduleId[]}]`。`covers`只是显式模块关系，不是行/分支覆盖证明；所有相交测试都会入选，不做贪心最小集合。`covers:[]`明确表示该测试覆盖未知，会触发保守全套建议。`changedPaths:string[]`取获准基线的完整文件级改动列表，包含新增、删除以及重命名前后路径；配置/锁文件也不能漏掉，不映射的路径会报告缺口。 / Verify test IDs and declared module links from real test configuration/reports. These links are not line/branch coverage proof. Select every intersecting test, not a greedy subset. Empty covers means unknown coverage and triggers conservative full-suite advice. Supply complete authorized file-level changes, including additions, deletions, both sides of renames, configuration and lockfiles; unmapped paths remain explicit gaps.

路径必须是规范POSIX相对路径；拒绝绝对/盘符路径、`.`/`..`、空段/尾斜杠、反斜杠、控制/格式字符和glob括号/通配符，不做URL解码、shell展开或静默归一化。ID须匹配`[A-Za-z0-9][A-Za-z0-9._:-]*`且非保留原型名称；模块ID/测试ID各自唯一，坏边/未知覆盖ID、重复边/覆盖/同模块路径/改动路径严格拒绝。图不读磁盘，符号链接真实归属须由获准读取者另行核实，不构成路径沙箱。 / Paths must be canonical relative POSIX literals: no absolute/drive paths, dot segments, empty segments/trailing slash, backslash, control/format characters or glob syntax. No decoding, expansion or silent normalization. Module/test IDs are unique within their respective namespaces; malformed/dangling/duplicate relationships fail closed. The operation never inspects disk or resolves symlinks; authorized readers must establish real ownership separately. This is not a filesystem sandbox.

上限：500模块、每模块32路径且总4096规则、5000依赖边、2000测试且总20000覆盖关系、1000改动路径、100项未知；字符串亦有界。完整扫描并精确计数问题，仅保留前500个`issues`示例；必须读取`totalIssues/issueCounts/truncated`，不能因示例截断忽略缺口。 / Bounds: 500 modules, 32 paths/module and 4096 total rules, 5000 edges, 2000 tests and 20000 total coverage links, 1000 changed paths and 100 unknowns; strings are bounded too. Scan/count every issue and retain only the first 500 examples. Read exact totals/counts and truncation, not just samples.

最小声明图示例（只是示例，不代表用户仓库） / Minimal declared-graph example, not a claim about the user's repository:
```json
{"scope":"仅人工核对的ui/core声明图 / Inspected ui/core declarations only","modules":[{"id":"ui","paths":[{"kind":"directory","path":"apps/ui"}]},{"id":"core","paths":[{"kind":"directory","path":"packages/core"}]}],"dependencies":[{"from":"ui","to":"core"}],"tests":[{"id":"ui-test","covers":["ui"]},{"id":"core-test","covers":["core"]}],"changedPaths":["packages/core/index.js"],"unknowns":[]}
```
获准输入准备好后调用`node <package-root>/capabilities/runner.mjs run engineering.impact --input <authorized-impact.json>`，或按既有`--json`方式传显式数据；不向输入加入可执行表达式。上例返回`changedModules:["core"]`、`affectedModules:["core","ui"]`和两个测试ID，`testsExecuted:false`。 / Invoke the operation on the authorized explicit JSON, not executable expressions. This example affects core and UI and suggests both test IDs, but executes none.

解读`recommendation.mode`：无声明改动为`none`，不是全仓库已无改动；覆盖闭合时为`targeted`。未知改动、受影响模块无覆盖、测试覆盖未知、显式未知或无测试，均保守给`full-suite`。此时`selectedTests`只包含所有**已声明**测试，仍须发现真实全套，不能把该数组冒充全仓库测试。始终保留`scope.kind:"declared-graph-only"`、`wholeRepositoryVerified:false`、`testsExecuted:false`/`testExecution:"not-run"`及局限说明。 / None means no changes supplied, not a clean-repository claim. Targeted is scoped to declarations. Unmapped changes, uncovered affected modules, unscoped tests, explicit unknowns or absent tests yield full-suite advice. Its selectedTests lists all **declared** tests only; discover the actual full suite separately. Preserve declared-only scope, false whole-repository verification and tests-not-run markers.

### 真实跑测（独立步骤） / Real test execution (separate step)
读取该工程已批准的测试命令与环境要求，先核对测试ID对应的真实命令；不得把输入测试ID直接当shell命令。按授权实际运行相关测试；有full-suite建议时发现并运行真实全套（不可用就明确未执行/缺依赖），再按风险补集成/运行态验收。单列`cwd | 基线/输入标识 | 实际命令 | exit | 测试数/失败项 | 环境 | 未测边界`；静态选择、build/lint和本操作的退出0都不等于真实跑测通过。 / Read approved project commands/environment requirements and map IDs to real commands; never execute supplied IDs as shell. Actually run authorized selected tests, or discover/run the real full suite when advised; report missing tools/tests honestly. Add integration/runtime checks by risk. Separately record cwd, baseline/input identity, actual command, exit, test counts/failures, environment and untested boundaries. Static selection/build/lint/operation exit0 is not passing real tests.

### 回滚（独立步骤） / Rollback (separate step)
实施前保存获准范围的基线与用户现有改动，列出本次可逆改动、恢复步骤和验证命令；只有实际实施后才需要执行回滚。失败时只撤回本次自有差异，保留用户/其他执行者工作；不默认`reset --hard`、清理目录、覆盖原件或发布。本操作只返回建议，不改项目、profile，不执行回滚，也不授予执行命令或发布的权限。 / Before implementation, preserve the authorized baseline and existing user edits; specify reversible changes, restore steps and validation commands. Roll back only changes actually made by this task, preserving others' work. No default hard reset, directory cleanup, overwrite or release. This operation only advises: no project/profile mutations, rollback execution or authority escalation.

## 授权与验收 / Authority and acceptance

`engineering.delivery-check` 核对明确提供的交付清单及回执。先用 CLI `list` 核对 schema；为同一候选收集获准证据，显式列出 `requiredCheckIds`，把回执绑定到候选摘要；按 `requiredIndex` 对回原清单。错候选的通过不能补当前检查，缺项/失败/未跑分别报告。无阻断只表示给定声明一致，仍须另查来源、实际执行、回滚和最终授权。不把目标路径、未脱敏凭证或可执行命令塞进输入。 / `engineering.delivery-check` checks a supplied delivery checklist and receipts. Discover the schema, collect authorized evidence for one candidate and bind receipts to its digest. Map each `requiredIndex` back to the original list. Mismatched, missing, failed and unrun checks do not pass. A clean declaration is not execution, rollback, artifact verification or final approval. Do not supply secrets, target paths or commands.
`run <operation> --input <explicit-json-file>`只读明确输入；`--json <JSON>`不读源文件；需要写新文件时明确`--out <path> --allow-write`，永不覆盖。可用`--root <authorized-directory>`收窄路径。原生审批仍有效；CLI标志不替代人类授权。 / `--input` reads only the explicitly named input; `--json` reads no source file. Writes require explicit `--out <path> --allow-write`, never overwrite. Use `--root` to narrow paths. Native approvals remain in force; CLI flags do not replace human authority.

`doctor --test`给出当前测试/哈希证据；只证明这些本地输入契约，不证明整个工程领域已验收。 / `doctor --test` returns current tests/hash evidence, establishing only these local input contracts, not the whole engineering domain.

来源：目录中60个精确配置键及其已固定源文件/learningPoints；重点学习专家团的边界负例、深度模式的来源定位、工作流的原始反馈与真实退出码。静态研究不是执行验收。 / Provenance: the catalog's 60 exact configuration keys and pinned source files/learningPoints, especially boundary negatives, source coordinates, verbatim feedback and real exits. Static research is not runtime acceptance.
