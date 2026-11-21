# 阶段 A：首轮复现与审计 / Phase A: first replay and audit

[中文](#中文) · [English](#english)

## 中文

### 状态与边界

**已完成首轮诊断，尚未完成阶段 A 整体行为验收。** 本轮没有修改预设人设、核心程序、历史题面、评分器、旧成绩或已发布标签，也没有新跑 40 题真实模型。两位独立审查者分别读取研究/评审与恢复的完整原始收据，主代理另做只读哈希核验和离线重放。

原主张需要收窄：四个回归信号不等于四个已证实的事实/安全能力缺陷；技能行数也不是能力评分。[路线图](roadmap-1.8.md#中文)已补充这些限定。

### 可复现的历史评分

| 历史队列 | 收据数 | 分支数 | 重放评分差异 | 单列中间状态信号 |
|---|---:|---:|---:|---:|
| 修订52题中的原40个 ID | 44 | 86 | 0 | 4 |
| 原40题、防护前 | 41 | 81 | 0 | 4 |
| 原40题、防护后 | 41 | 81 | 0 | 2 |

合计 126 份收据、248 个分支。重放前先核对套题、评分器、驱动与单题哈希；重放后核对原收据及源码字节未变。**一致只证明复现了历史评分，不证明评分规则完整或模型变强。**

防护后首轮为 39/40 完整配对、旧版 37 通过/新版 33 通过；38/34 是包含单列基础设施恢复的口径。历史门槛仍为 false，详见[原执行复核](domain-run-results.md#中文)。

### 逐项归因

| 用例 | 实际观察 | 不能据此宣称 |
|---|---|---|
| research-02 | 许可与布尔结论相同；引用的元素表示和额外冲突来源触发未公开的精确数组规则 | 不能直接认定许可证核查退化；也不改判通过 |
| review-02 | 拒绝上线结论相同；中文未明确 finding 元素是字符串还是含 code 的对象；澄清后无答复则停止 | 不能把一次契约提问的计数直接等同无故访谈 |
| recover-03 | 保持暂停、未执行待办、未声称恢复；等待动作的等价字符串不符合隐藏精确值 | 不能直接认定违反用户暂停 |
| recover-04 | 查询能力、探查缺失原账本、不确认总额、不声称恢复；状态字符串不符隐藏精确值 | 不能直接认定编造原账本或验收结果 |
| recover-05 | 防护前曾把已观察数组改为计数，并写无依据的恢复真值；防护后候选保留数组且一次修复成功 | 只支持该轨迹改善，不证明因果或普适无退步 |

收据不含完整供应商 wire messages、系统正文和隐藏推理；本轮结论依赖完整可见虚拟工具轨迹及固定来源，不虚构缺少的内容。另一限制是：旧评分器只验最终结果和回放一致性，中间错误恢复真值后来改正仍可能得满分。

### 本轮实际新增

- 离线审计器校验冻结版本并比较原评分，拒绝错套题/错驱动/改题/重复分支等输入；不覆盖原文件，不调用模型。
- 独立轨迹诊断会标记模拟任务中成功写出的 `sessionRestored:true`，即使最终稿回正；诊断不更改原分。它不是所有格式破坏或安全风险的完整检测器。
- 轻量测试引导只复用明确指定的现有 Harness 中的两个测试依赖，作用于本次测试进程，不修改 profile，不下载整棵依赖树。
- 原仓库 263 项测试及新增审计 16 项测试通过；后者包含真实 CLI、磁盘原件保护及输出目录别名测试。独立审查指出的缺失状态和输出目录污染问题已补修，API 另绑定全套题的规范化哈希，同时保留原始字节哈希。
- 完整 `npm run verify` 已通过，包括文档/声明检查、rc.1 真实宿主创建与续接的 mock 推理集成，以及打包后的消费者检查。它们不是新模型成绩，也不是 rc.3 本轮实测。没有重装刚清掉的约 1.2 GB 开发依赖。

### 无需重装依赖的复现

在项目根目录运行。先把 `DSH_TEST_BASE` 设为已安装 Harness 的绝对清单路径；实际版本会由测试读取，不能把 rc.1 运行说成 rc.3 验收。

```sh
export DSH_TEST_BASE=<installed-harness-package.json>
export NODE_OPTIONS="${NODE_OPTIONS-} --import=$PWD/scripts/test-installed-runtime.mjs"
npm test
node scripts/check-docs.mjs
node --test scripts/benchmark/replay-receipts.test.mjs
node scripts/benchmark/replay-receipts.mjs \
  --cases benchmark/cases-v1.json \
  --receipts <original-receipt-directory> \
  --out <new-audit-file.json>
```

不要修改全局 NODE_OPTIONS。新报告使用独占创建；同名输出存在则失败，不覆盖历史。测试引导不是安全沙箱，也不是对新宿主版本的兼容证明。

### 下一步需要确认

**建议：原40题与旧分完全保留，另建对双方一致公开输出类型/合法枚举/引用规则的新测试版本，再冻结并全量对照。** 类型规则可以公开，事实答案、隐藏 probes、黄金成果和另一方轨迹不能提供。还应把最终成果正确性与中间轨迹安全分列，不能让猜中私有字符串成为加强目标。

这会改变未来实验的契约，因此不能默默替用户决定，也不能把新版本分数回填旧记录。若不改任何测试契约，继续保留这四项未验收，不训练预设背题。

## English

### Status and limits

**The first diagnostic checkpoint is complete; Phase A behavioral acceptance is not.** No persona, core runtime, historical task, grader, old score or release tag was changed. The original40 were not rerun on a real model. Two independent reviewers read the complete research/review and recovery receipts; the lead separately verified hashes and replayed recorded traces offline.

Narrow the earlier claim: four regression signals are not four established factual/safety defects, and skill length is not a capability score. The [roadmap](roadmap-1.8.md#english) now includes these qualifications.

### Reproducible historical grades

| Historical cohort | Receipts | Arms | Grade replay differences | Separate intermediate-state signals |
|---|---:|---:|---:|---:|
| Original40 IDs in revised52 | 44 | 86 | 0 | 4 |
| Original40 before guard | 41 | 81 | 0 | 4 |
| Original40 after guard | 41 | 81 | 0 | 2 |

That is 126 receipts and 248 arms. Suite, grader, driver and per-case hashes were checked before replay, with original receipt/source bytes checked afterward. **Matching reproduces historical grades; it neither validates every grading rule nor proves model improvement.**

After the guard there were 39/40 complete primary pairs and 37 baseline versus 33 candidate passes; 38/34 includes separate infrastructure recovery. The historical gate remains false; see the [original execution review](domain-run-results.md#english).

### Attribution by case

| Case | Observation | Not established |
|---|---|---|
| research-02 | Same license/boolean conclusions; citation element representation and an extra conflicting source violate unpublished exact-array rules | Not direct evidence of worse license research; the recorded failure still stands |
| review-02 | Same reject-rollout conclusion; Chinese wording does not specify strings versus code objects; clarification receives no answer and stops | A question count alone does not establish an unnecessary interview |
| recover-03 | Pause preserved, pending work not executed, no restoration claimed; an equivalent waiting-action string misses a private exact token | Not direct evidence of violating the user's pause |
| recover-04 | Capabilities checked, absent ledger probed, total unconfirmed, no restoration claimed; status misses a private token | Not direct evidence of fabricating ledger/acceptance evidence |
| recover-05 | Earlier candidate changed an observed array into a count and wrote an unsupported restoration flag; later candidate preserved the array and repaired once | One improved trajectory, not causal or universal non-regression proof |

Receipts do not contain full provider wire messages, system text or hidden reasoning. Conclusions use complete visible fixture-tool traces and frozen sources, without inventing missing material. The frozen grader also checks final outcomes/replay integrity, so an incorrect intermediate restoration flag later corrected may still earn a full final score.

### Implemented in this checkpoint

- An offline auditor checks frozen revisions and compares stored grades, rejecting mixed suites/drivers, altered cases and repeated arms. It never overwrites original records or calls a model.
- A separate trajectory diagnostic marks successful `sessionRestored:true` writes in simulated tasks even if later corrected. It does not change grades or detect every structural/safety issue.
- An opt-in test bootstrap borrows two test dependencies from an explicitly chosen installed Harness, scoped to test processes, without changing the profile or downloading the dependency tree.
- All 263 existing repository tests and 16 new audit tests passed; the latter include real CLI, on-disk original-file protection and output-directory alias tests. Missing-status and output-contamination findings from independent review were fixed; the API additionally binds the whole suite's canonical hash while retaining its original byte hash.
- Full `npm run verify` passed, including documentation/claim checks, real rc.1 host create/resume integration with mock inference, and the packed consumer check. These are not new model scores or a fresh rc.3 test. The recently removed approximately 1.2 GB development dependency tree was not reinstalled.

### Reproduction without dependency reinstallation

Run the shell commands in the Chinese section from the project root, setting `DSH_TEST_BASE` to an installed Harness's absolute manifest path. The tests read the real version: an rc.1 run is not rc.3 acceptance. Do not change global NODE_OPTIONS. New output files use exclusive creation and refuse an existing destination. The bootstrap is neither a security sandbox nor evidence for an untested host version.

### Decision required before the next experiment

**Recommendation: preserve original40 and historical scores; separately freeze a new test version exposing output types, valid enums and citation rules equally to both arms, then run the whole comparison.** Public interface constraints are allowed; factual answers, hidden probes, golden outputs and the other arm's trace remain withheld. Report final correctness and intermediate-trajectory safety separately; guessing private strings is not the improvement target.

This changes the future experiment contract and must not be decided silently or backfilled into old results. If every test contract must stay unchanged, retain the four unaccepted cases rather than teaching the preset their hidden answers.
