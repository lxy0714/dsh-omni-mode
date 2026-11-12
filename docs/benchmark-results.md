# 对照评测结果 / Paired evaluation results

[中文](#中文) · [English](#english)

## 中文

### 当前结论：未通过改善验收

**尚未证明至少三类任务改善，也未满足逐题关键无退步条件。不得据此发布“已证明更强”的版本或迁移本机预设。** 一些候选运行出现基线通过、候选步数耗尽的情况，不能归咎于“仅有天花板效应”或直接当成噪声排除。

先前此页的 `69/74` 对 `71/74` 混合了实验队列和实验臂；类别分母与总数也不一致。该统计及其成本/效果推论**撤回**。此前把多工具题失败统一解释为“必需轮次超过24”同样没有证据；未声明的输出标签和错误期望值确实造成过无效重试，但不能推论所有失败都是夹具问题。

### 可复现的探索性账目

详见仓库的[逐次收据摘要](https://github.com/lxy0714/dsh-omni-mode/blob/main/benchmark/exploratory-results.json)及[离线汇总器](https://github.com/lxy0714/dsh-omni-mode/blob/main/scripts/benchmark/summarize.mjs)。它们不调用模型，不用当前 grader 事后改分，不按结果挑选重试：

- 只纳入同一题集、候选人设和模型路由哈希的收据；分别统计 `baseline` 与 `candidate`。
- 每题首个尝试为主结果，包含空收据、基础设施中断与未完成的单臂；后续重试全部保留，不能替换首轮失败。
- 只有 `complete` 或正确等待用户的 `needs-user` 且原收据判通过才记成功；24步耗尽不是完成。
- 不完整覆盖、未预注册重复次数、评分器/驱动哈希缺失，使这些数据**仅能诊断，不能确认因果提升**。

本摘要对应候选人设 SHA-256 `e8ed9418be0e305bba430318a60704b2e41db41825439f3e1d9afc0c481903c4`，题集 SHA-256 `e5d37afb6a7a5354cafe602b4211a8c8663b85c04f8597585125468dcf0c6904`，路由指纹 `4357d0baee9e739cf5f33b624ed58653af6960f992a968a68374a32c30d96913`。路由指纹不是模型身份或跨供应商结论。

| 原40题类别 | 基线原记录通过/计划题数 | 候选原记录通过/计划题数 |
|---|---:|---:|
| 代码实现 | 5/5 | 5/5 |
| 调试修复 | 5/5 | 5/5 |
| 研究检索 | 5/5 | 4/5 |
| 数据处理 | 4/5 | 5/5 |
| 写作策划 | 5/5 | 5/5 |
| 方案评审 | 5/5 | 5/5 |
| 多工具协作 | 4/5 | 4/5 |
| 长任务恢复 | 4/5 | 5/5 |

**这不是完整配对的胜率比较。** 原40题的首轮只有38个基线臂、39个候选臂留下完整或部分输出；通过分别37、38。多工具有一题首轮双方未留输出，恢复有一题首轮缺基线臂，不能把候选多出的通过视作配对获胜。真正原40题逐题差异为 `data-02` 候选通过/基线失败、`research-02` 基线通过/候选耗尽。

扩展52题计划中记录了51题的54次尝试，48题首轮双臂都有输出；两个实验臂各有47次首轮通过。`hard-tradeoff-01` 没有该队列收据；`hard-longcontext-01` 首轮双方中断。候选在 `research-02`、`hard-dedup-01` 发生基线关键通过→候选未完成的退步，不能被平均分抵消。

### 实验边界与判据修订

1. 基线来自 `v1.5.0`（commit `8d6c7e9f81fff4c87481aafd0954e2c639dd2304`）的 persona 与未修改的 grilling。候选增加了三条尚未证明行为收益的原则：缺证据如实报告、真实歧义先问并等待、不要以反复写查代替交付。
2. 每一对使用发起 Agent 当时固定的相同路由、工具定义、合成文件/来源、回复队列、中文题面及24次模型调用预算。不同路由之间不合并。模型是真实调用，但**驱动是受控工具循环，不是原生 Agent 执行器**；没有真实 shell、浏览器、账号、设备、用户文件、第三方插件共存或原生恢复验收。
3. 初版40题和最初评分器已经实际运行；之后修订了缺失路径探测、未声明枚举值、拼错校验目标的分类，且扩展12道诊断题。两道新增题的日期与排序期望值也曾写错后更正。**这些改动均发生于观察结果后，属于探索性开发，不能追溯伪装成一次从未改题的冻结实验。** 初版输入保留在仓库中，变更可由 Git 追溯。
4. 原评分结果保存在收据中。若用新 grader 重评旧轨迹，只能另列为事后敏感性分析，不能改写原结果或当成新的模型表现。生成自测黄金轨迹也不是独立证明所有夹具语义正确，更不是模型评测通过。
5. 验收前须锁定题集、驱动、评分器、技能、人设及路由哈希和重复/重试策略，再对双方执行同样的确认性实验。不得为取得胜利而挑题、降低判据、只重跑失败臂或宣称更换模型后的提升来自预设。

当前：**研究和测试基础设施有进展，模型行为提升的验收仍未完成。**

## English

### Status: improvement acceptance has not passed

**Improvement in at least three task categories and per-case critical non-regression have not been established. Do not publish a “proven stronger” release or migrate the local preset on this evidence.** Some runs have a passing baseline and a candidate that exhausts its budget; these cannot be dismissed as a ceiling effect or assumed to be noise.

The former `69/74` versus `71/74` totals mixed cohorts and treatment arms, with inconsistent category denominators. Those figures and derived cost/effect conclusions are **withdrawn**. The blanket diagnosis that the multi-tool tasks necessarily needed more than24 turns was also unsupported. Undeclared labels and incorrect expectations did cause invalid retries, but not every failure is a fixture defect.

### Reproducible exploratory accounting

The repository's [receipt ledger](https://github.com/lxy0714/dsh-omni-mode/blob/main/benchmark/exploratory-results.json) and [offline summarizer](https://github.com/lxy0714/dsh-omni-mode/blob/main/scripts/benchmark/summarize.mjs) make no model calls and never regrade with the current grader:

- Admit only matching case-set, candidate-policy and route hashes; compare baseline and candidate as separate arms inside each receipt.
- Retain the first attempt including empty receipts, partial pairs and infrastructure errors; retain every later retry without replacing primary failures.
- Count success only for a recorded passing grade with `complete` or legitimate `needs-user` status. A step limit is not completion.
- Incomplete coverage, unregistered repetitions and missing historical grader/driver hashes make these records **diagnostic, not confirmatory causal evidence**.

Hashes: candidate `e8ed9418be0e305bba430318a60704b2e41db41825439f3e1d9afc0c481903c4`; case set `e5d37afb6a7a5354cafe602b4211a8c8663b85c04f8597585125468dcf0c6904`; route `4357d0baee9e739cf5f33b624ed58653af6960f992a968a68374a32c30d96913`. A route fingerprint is not model identification or evidence across providers.

| Original40-task category | Baseline recorded passes/planned | Candidate recorded passes/planned |
|---|---:|---:|
| Implementation | 5/5 | 5/5 |
| Debugging | 5/5 | 5/5 |
| Research | 5/5 | 4/5 |
| Data processing | 4/5 | 5/5 |
| Writing/planning | 5/5 | 5/5 |
| Design review | 5/5 | 5/5 |
| Multi-tool | 4/5 | 4/5 |
| Long-task recovery | 4/5 | 5/5 |

**These are not complete-pair win rates.** The40 primary attempts contain38 baseline arms and39 candidate arms with output;37 and38 passed respectively. One multi-tool pair has no first-attempt output and one recovery case lacks its baseline arm. That extra candidate pass is not a paired win. The original40-case discordances are a candidate win on `data-02` and a candidate step-limit loss on `research-02`.

The expanded52-case plan has54 recorded attempts over51 cases, with48 complete primary pairs and47 primary passes per arm. No matching `hard-tradeoff-01` receipt exists; both arms of the first `hard-longcontext-01` attempt were interrupted. Candidate critical regressions on `research-02` and `hard-dedup-01` cannot be compensated by an average score.

### Boundaries and rubric revisions

1. Baseline persona and unchanged grilling are frozen from `v1.5.0`, commit `8d6c7e9f81fff4c87481aafd0954e2c639dd2304`. The candidate's three extra principles have not established behavioral gains.
2. Within each pair, the selected route, tools, synthetic files/sources, answer queue, Chinese prompt and24-call budget match. Different routes are not pooled. Inference is real; the driver is a **controlled tool loop, not the native Agent executor**. Real shell/browser/accounts/devices/user files, third-party coexistence and native restoration are not measured.
3. After observing outcomes, development changed missing-path probing, undeclared enum vocabulary and the classification of misspelled checker targets, and added12 diagnostic cases. Two new date/order expectations were also corrected. **These are exploratory post-observation revisions, not a single untouched frozen experiment.** Original inputs and changes remain traceable in Git.
4. New-grader replay of old traces is a post-hoc sensitivity analysis, never a replacement model result. Hand-authored oracle traces neither independently establish fixture semantics nor count as model successes.
5. Before acceptance, freeze cases, driver, grader, skills, persona, route and repeat/retry policy, then apply the same confirmatory procedure to both arms. Never cherry-pick tasks, lower thresholds, retry only the failed arm, or attribute a model switch to a preset gain.

Current status: **research and verification infrastructure have progressed; behavioral-improvement acceptance is still incomplete.**
