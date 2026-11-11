# 冻结任务与独立评分 / Frozen tasks and independent grading

## 中文

### 范围与现状

这是以 **v1.5.0** 为基线的 **40 个真实模型任务的冻结输入与独立 grader**，8 类各 5 个：代码实现、调试修复、研究检索、数据处理、写作策划、方案评审、多工具协作、长任务恢复。

**此目录不含真实模型运行结果，也不证明新版本已改善。** 本地 grader 单测的黄金轨迹是人为构造的测试输入，不是模型输出；项目原有 31 项 mock/策略测试也不是这组真实模型评测。真实同路由调用、预设挂载和结果汇总由 Lead 的 Host 助手负责。

本套件测的是受控工具中的成果正确性、查证、修复、权限边界与校验行为，**不是通用智力、通用代码能力、生产部署、真实浏览、真实多代理或原生会话恢复的全面验收**。所有任务仅用合成数据；`fixture.invalid` 是虚构来源标识，不是可访问网站。没有用户文件、账号、设备、真实服务或秘密。

### 文件与复现

- [cases.json](cases.json)：冻结的自包含任务、初始虚拟文件、来源、固定回复、独立期望与关键不可退步标记。
- [grader.mjs](../scripts/benchmark/grader.mjs)：纯函数评分器与可信受限解释器，不读文件、不访问网络、不执行生成代码。
- [grader.test.mjs](../scripts/benchmark/grader.test.mjs)：单独以 Node 内建测试器运行；覆盖全部 40 个黄金案例和关键负例。
- [define-cases.mjs](../scripts/benchmark/define-cases.mjs)：可审计的任务定义；只在显式运行时重建冻结 JSON，不调用模型。修改冻结输入后必须同步定义并在跑模型前重新冻结/计算哈希；不可看结果后调题或 grader。

在项目根目录运行（无需安装）：

```sh
node --test scripts/benchmark/grader.test.mjs
# 仅在有意更新冻结任务时：
node scripts/benchmark/define-cases.mjs
```

### 任务/工具协议

顶层包含 `schemaVersion:1`、`baseline:"1.5.0"`、`categories`、`toolProtocol`、`limitations` 和 `cases`。每个 case 包含：

- `id/category/prompt{zh,en}`；一次运行预先选定同一语言，不能把两种语言额外拼成某一 arm 的优势。
- `files`：相对虚拟路径 → UTF-8 字符串；`sources`：`{id,url,title,text,provenance}` 固定记录；`userAnswers`：有序字符串队列。
- `tools`：两个 arm 完全相同的 7 个受控工具。
- `expected.rules`：独立成果判定；`expected.critical`：关键检查 ID；`expected.process`：只读证据、可写路径、提问、校验和修复顺序。
- `expected.referenceFiles`：仅供 grader 单测的黄金成果；**不得提供给模型**。

模型只看到用户题面、工具定义，以及通过工具读取的虚拟证据。**不得给模型 `expected`、probe、黄金文件、grader 源码、另一 arm 的轨迹或隐藏运行配置。** 初始文件名在题面列明，模型仍须实际读；输出路径与格式在题面/spec 中给出。`expected` 的结构化格式仅方便判定实际数值、引用与动作，不作为“智力提升”的证据。

| 工具 | 输入 | 确定性返回/边界 |
|---|---|---|
| `fixture_read` | `{path}` | `{content}`，只读 case 初始文件或允许的产物路径；绝不映射到 Host 文件系统 |
| `fixture_write` | `{path,content}` | 成功返回 `{written:true}`，仅更新内存中 `expected.process.writePaths` 内路径 |
| `fixture_search` | `{query}` | 恒定返回 `{sources:case.sources}` 全部记录；不排名、不联网；query 仅记录 |
| `fixture_check` | `{target}` | 原样返回 `checkTarget(case,files,target)` 的 `{passed,checks}`；不返回答案/probe，不执行任意代码 |
| `ask_user_question` | `{question}` | 逐次消费 `userAnswers` 并返回 `{answer:string}`；耗尽返回 `{answer:null}`，停止为需用户 |
| `skill` | `{name}` | 按 arm 的真实版本提供 `grilling`/`omni-method`；不存在时如实不可用，不伪造正文 |
| `fixture_capabilities` | `{}` | `{tools:case.tools,environment:"controlled-fixture",externalServices:false}` |

两个版本的工具名称、schema、实现和证据必须一致；`skill` 的按版本正文是待测预设干预的一部分，不是额外工具权限。不可用技能的返回也记录，不以是否加载技能或出现 `omni` 新词打分。所有读写/搜索/校验/提问，包括失败尝试，必须记入时间有序的 `toolCalls:[{name,args,result}]`。评分输入 `files` 是**初始文件加全部成功写入后的完整最终状态**，不是只传 diff；`finalText` 与 `questions` 一并保存。

没有自由 shell、HTTP、包安装、执行用户/研究对象代码、任意生成代码运行、用户目录读取或账号操作。工具桥必须在调用端拦截路径越界与未知工具；grader 的失败判定只是第二道检查，不是 Host 安全沙箱。

### 独立评分

```js
import { gradeCase, checkTarget } from '../scripts/benchmark/grader.mjs';
const feedback = checkTarget(testCase, virtualFiles, 'out/result.json');
const result = gradeCase(testCase, {
  files: finalVirtualFiles,
  toolCalls: [{ name, args, result }],
  finalText,
  questions
});
// { score:0..1, passed:boolean, criticalPassed:boolean,
//   checks:[{id,passed,detail}] }
```

- 成果规则是 JSON 值/类型/事实、CSV 正确性、有限程序边界 probe，或文稿事实/字数约束。JSON 键顺序和额外解释字段不影响 subset 判定；替代的等价程序也可通过。没有新版本关键词、人设措辞或加载指定技能加分。
- 程序任务用公开 spec 解释的、最多 64 条的 JSON 决策语言；执行的是可信固定解释器，不是生成的 JS/SQL/shell。probe 不下发给模型。它衡量这种受限声明式实现，不能推论到任意语言代码正确性。
- grader 从初始内存文件重放成功写入，并在**每次历史快照**上重新计算 `fixture_check`。伪造通过、篡改输入、越权/未知工具、伪造来源返回/固定回复都会失败。末尾一句“已完成”或“测试通过”不计证据。
- `passed` 要求所有明确成果和过程检查都通过。`criticalPassed` 要求每 case 的关键成果/权限/必要询问/修复项以及全局轨迹真实性通过。禁止用总分增长抵消关键回归。
- `score` 仅为诊断：有产物时成果占 80%、过程占 20%；两个有真实歧义且无用户回复的停止任务仅按过程判定。主指标应是每类通过数、逐题配对变化和关键失败；不得把分数称为智商或一般能力百分比。
- 稿件只测可机械验证的事实、范围、字数与计划可行性，不评美感/说服力。提问规则测是否在授权前停下，不完整评价问题措辞。`finalText` 保存供审计但不以自我评价加分；若答复与实际轨迹/结构化产物矛盾，需单列人工盲审，不把文件通过推论为所有自然语言声明真实。
- 写作/评审歧义题没有答案，成功条件是实际读证据、提问并无任何写入。`tools-03` 有固定币种回复，必须先问后写。
- `debug-*` 与 `recover-05` 要求独立校验先失败、修复再成功；只有最终正确但没有复现记录仍不通过。其余题不要求无意义的先失败。
- 恢复题仅在合成 checkpoint 上继续；产物必须写 `sessionRestored:false`。不得据此宣称恢复了用户真实 Session。

### 同路由实验与报告预注册

跑真实模型前冻结文件哈希、v1.5.0/候选预设与技能哈希、Host/适配器版本、同一 provider/model/route、推理设置、工具 schema/实现、语言、预算/最大轮次、温度/seed（供应商支持才写）及重复次数。每 arm 每题从新内存副本和新上下文开始，回复队列也重置；运行顺序交错或随机并记录，不能只重跑失败 arm。提供同样的模型容量与工具限制；如果比较的预设本身改变推理档位，需控制为相同档位或明确另列该混杂因素。

保存每题每 arm 全部工具调用、完整最终虚拟文件、最终答复、真实路由/错误/取消/截断信息和独立 grader 结果。供应商错误、缺路由、超限、取消不得冒充正确完成，也不能静默排除后只报成功率；对双方同一规则报告/重试。

事先约定：**至少 3 类的实际成果/任务通过指标改善，且逐题关键检查没有从基线通过退化到失败**，才满足本次改善目标。改善必须写出每类分母和配对胜/负/平；边界/查证改善不能等同于格式服从或普遍智力上升。每类只有 5 题，单次差异不构成统计稳定性；建议多次重复并列出方差/不确定性。若基线已满分、运行不足或目标未达成，如实写未证明，不改题制造优势。

任务层结果与 Host 原生回归（选档、压缩/取消、技能来源、共存、原生恢复等）分层呈现；本套件不能替代后者，更不能把项目的 31 项模拟测试合并成真实模型样本。

## English

### Scope and status

This is a frozen, self-contained **40-task dataset and independent grader**, using **v1.5.0** as the baseline: five tasks each for implementation, debugging, research, data processing, writing/planning, design review, multi-tool work and long-task recovery.

**No real-model runs or demonstrated candidate improvement are included.** Grader unit tests use hand-authored reference traces, not model outputs. The project's older 31 mock/strategy tests are not real-model benchmark results. The Lead's separate Host helper performs configured real-route calls and result collection.

The suite measures artifact correctness, evidence handling, bounded execution, repair and authority boundaries in a **controlled synthetic tool environment**. It does not establish general intelligence, unrestricted coding, production readiness, live browsing, distributed-agent reliability or native Session restoration. Every datum is synthetic. `fixture.invalid` identifies frozen synthetic records, not live websites. No user files, accounts, devices, credentials or external services are accessed.

### Reproduction and schema

Run `node --test scripts/benchmark/grader.test.mjs` from the project root; no install is needed. The auditable authoring source is [define-cases.mjs](../scripts/benchmark/define-cases.mjs); running it explicitly rebuilds [cases.json](cases.json), without model/network calls. Freeze and hash both fixtures and grader before any model experiment. Do not tune them after seeing arm results.

Top-level keys: `schemaVersion`, `baseline`, `categories`, `toolProtocol`, `limitations`, `cases`. Each case contains bilingual `prompt`, `files` (relative virtual paths to UTF-8 strings), frozen `sources`, the ordered `userAnswers` queue, the identical seven-tool `tools` list and `expected`. `expected.rules` defines independent outcome predicates; `critical` names non-regression checks; `process` defines evidence, allowed outputs, questions and validation order. `referenceFiles` is a unit-test oracle only.

**Never expose `expected`, probes, reference artifacts, grader source or the other arm's transcript to the model.** Present one preselected prompt language consistently to both arms; expose evidence only through fixture tools. All writes remain memory-only. Never resolve virtual paths against the Host filesystem.

Tool contract:

- `fixture_read({path})` → `{content}` from current virtual strings.
- `fixture_write({path,content})` → `{written:true}` only for allowed output paths.
- `fixture_search({query})` → `{sources:case.sources}`, all records exactly, with no live retrieval or query ranking.
- `fixture_check({target})` → unmodified `checkTarget(case,files,target)` output `{passed,checks}`; no expected answers/probes are revealed.
- `ask_user_question({question})` consumes the next fixed string as `{answer:string}`; exhaustion returns `{answer:null}` and stops for the user.
- `skill({name})` provides the genuine version-specific `grilling`/`omni-method` text or reports it unavailable. Loading a skill never earns points; version-specific text is the treatment, not an extra capability.
- `fixture_capabilities({})` → `{tools:case.tools,environment:"controlled-fixture",externalServices:false}`.

Record every call, including errors/denials, as chronological `{name,args,result}`. Pass **complete final virtual files including unchanged initial evidence**, `toolCalls`, `finalText` and `questions` to `gradeCase`. The bridge must reject unknown tools/path escapes before performing them. The grader's rejection is an audit layer, not a Host security sandbox. No free shell, generated-code execution, external HTTP, installation, research-subject code execution or user filesystem/account access is available.

### Grading and limitations

[grader.mjs](../scripts/benchmark/grader.mjs) exports pure `gradeCase(testCase,{files,toolCalls,finalText,questions})` and `checkTarget(testCase,files,target)`. Results have `score`, `passed`, `criticalPassed` and individual `{id,passed,detail}` checks. It imports no filesystem or network functionality and never evaluates generated code.

Outcomes use typed JSON facts/values, RFC4180 CSV parsing, behavioral probes for a bounded declarative decision language, and explicit draft facts/length or plan feasibility. Equivalent programs and harmless JSON key reordering/extra explanation fields can pass. There are no candidate-specific words, persona phrases or skill-loading bonuses. Code tasks explicitly implement JSON decision programs with at most 64 rules, interpreted by trusted fixed code; they do **not** test arbitrary JS/SQL/shell execution.

The grader replays successful writes and recomputes every checker result against its historical file snapshot. Forged passes, forged sources/fixed replies, changed input evidence, unknown tools and path escapes fail. Model claims of completion never replace artifacts or actual tool evidence. `finalText` is retained for audit, not self-scoring; contradictions between prose and trace/artifacts require a separately reported blinded human review. Artifact correctness does not prove every natural-language claim truthful.

`passed` requires all declared outcome and process predicates. `criticalPassed` covers case-specific key outcomes/authority/question/repair requirements and global trace integrity. A higher aggregate cannot compensate for a critical regression. Diagnostic `score` is 80% artifact outcomes and 20% process where artifacts exist; the two unanswered-ambiguity stop tasks use process only. Report per-category task passes and paired changes as primary metrics, not a general-intelligence percentage.

Writing checks cover factual constraints, scope, length and feasibility—not creativity or persuasiveness. Question checks cover asking/stopping at a genuine authority boundary, not full question quality. `debug-*` and `recover-05` require observed failing validation → repair → passing validation. Other tasks do not require manufactured failures. Recovery tasks use simulated checkpoints and require `sessionRestored:false`; they do not restore actual user sessions. Multi-tool tasks use sequential fixtures and one simulated collaborator report, not real delegated workers.

### Preregistered real-route comparison

Before real calls, freeze hashes of fixtures/grader, baseline/candidate persona and skills; Host/adapter versions; identical provider/model/route and reasoning setting; tool schemas/implementations; language; budgets/turn limits; temperature/seed where supported; and repetitions. Reset files, context and answer queues for each case/arm. Interleave or randomize and record run order. Apply identical retry/error rules to both arms. If preset reasoning selection differs, control it or explicitly report that confound.

Retain full call traces, final files, final text, actual route/error/cancellation/truncation metadata and grader results per arm/case. Missing routes, provider errors, cancellation or limits are not successes and must not be silently excluded.

The requested improvement condition is **actual outcome/task-pass improvement in at least three categories, with no per-case critical check changing from baseline-pass to candidate-fail**. Publish denominators and paired wins/losses/ties; do not label format obedience as general intelligence. Five tasks per category and a single run are not statistically stable evidence; use repetitions and report uncertainty. If the baseline is saturated, coverage incomplete or the target unmet, report “not demonstrated,” rather than changing the tasks to favor a candidate.

Report these real-model task results separately from native Host regression tests (reasoning/retention/cancellation, skill provenance, coexistence, actual Session restoration). Neither layer substitutes for the other, and the older 31 mocked tests must never be counted as real-model samples.
