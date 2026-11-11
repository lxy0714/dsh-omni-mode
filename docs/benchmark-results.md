# 对照评测结果 / Paired evaluation results

[中文](#中文) · [English](#english)

## 中文

### 结论先说

本轮对照**未能证明改进成立**，因此不宣称“至少 3 类短板改善”。原因不是候选变差，而是**任务集存在天花板效应**：多数题目基线与候选都接近满分，没有区分度。诚实记录如下。

### 设置

- 基线：Git tag `v1.5.0`（commit `8d6c7e9`）的 persona 与 grilling 正文，冻结于 `tools/benchmark-host/baseline.json`。
- 候选：当前工作树 `cordis.patch.yml` persona，新增三条原则（证据缺失须如实报告 / 真正歧义先问再等 / 不以写—查循环代替达成）。
- 任务：`benchmark/cases.json`，40 题 8 类各 5，caseSetHash `d4b96044…`。
- 使用发起 Agent 当前选择的同一模型路由，模型调用前经 `resolveCallConfig` 固定；两臂使用相同工具 schema、相同虚拟文件、相同冻结来源、相同有限回复队列。
- 工具为受控虚拟工具，不是真实 shell / 网络 / 用户文件；推理是真实模型。
- 每臂最多 24 步；顺序按 caseId 哈希交替。

### 实测数据（成对、同题同路由）

| 类别 | 基线平均分 | 基线通过 | 候选平均分 | 候选通过 |
|---|---:|---:|---:|---:|
| 代码实现 | 1.000 | 5/5 | 1.000 | 5/5 |
| 调试修复 | 1.000 | 5/5 | 1.000 | 5/5 |
| 研究检索 | 0.996 | 4/5 | 0.996 | 4/5 |
| 数据处理 | 1.000 | 5/5 | 1.000 | 5/5 |
| 写作策划 | 1.000 | 5/5 | 1.000 | 5/5 |
| 方案评审 | 1.000 | 5/5 | 1.000 | 5/5 |
| 多工具协作 | 1.000 | 3/3 | 1.000 | 3/3 |
| 长任务恢复 | 0.986 | 2/4 | 0.995 | 3/4 |
| **合计（臂）** | **0.9985** | **69/74** | **0.9993** | **71/74** |

唯一可见变化是长任务恢复 +1、研究检索 +1；其余 6 类完全相同。在噪声与样本量下，这不足以支撑“3 类短板改善”的结论。

复核时另发现，不同轮次的成对统计在 69/71 与 70/70 之间波动（同一冻结任务集、同一人设），进一步说明当前差异属于噪声。

### 已知缺陷与噪声（必须一起读）

1. **天花板效应（决定性）**：40 题中 **34 题基线从未失败**；在基线曾失败的 6 题里，又有 3 题属夹具缺陷。真正可能有区分度的仅约 3 题，机制上不可能支撑“3 类改善”。要证明改进，必须先提高题目难度。
2. **`tools-02`、`tools-03` 两臂均 24 步耗尽**：任务所需轮次超出上限，是夹具设计问题，不是模型能力差异。
3. **`recover-04` 两臂均判 `tool-scope`**：题目要求证明某证据不存在，但模型读取该路径即被判越权，判据自相矛盾。
4. **单次抖动真实存在**：`review-03` 同一人设重跑出现一次通过一次失败；因此单题单次结果不能作为证据，本表全部使用同题成对结果。
5. **未测**：真实供应商长期负载、原生 Agent 执行器端到端、全部第三方插件组合、Windows/macOS。受控虚拟工具不等于生产验收。
6. **覆盖说明**：40 题中 37 题两臂均完整跑完并计分；`tools-02`、`tools-03` 两臂均被判为未完成，`recover-04` 判据自相矛盾，这 3 题不计入“有效区分”评估。
7. **成本参考（非质量指标）**：两臂各 74 次运行，基线累计约 145.8 万 token、候选约 139.0 万 token。该差异同时在噪声范围内，不用于证明效率提升。

### 下一步（要真正证明改进）

- 修 2、3 两条夹具缺陷；把“读取预期不存在的路径”与越权写入分开判。
- 增加难度：提高需要多轮推理、证据冲突、跨类别组合的题，让基线出现真实失败，才有提升空间。
- 增大重复：每题多次运行取分布，而不是单次通过/失败。
- 只有在修好夹具、提高区分度后重跑，才能对外声称改善。

当前状态：**评测框架可用且有真实模型结果，但改进结论未成立**，发布说明不得声称已证明提升。

## English

### Bottom line

This paired run **does not establish an improvement**, so no claim of "at least three categories improved" is made. The reason is a **ceiling effect** in the frozen suite, not candidate regression.

### Setup

- Baseline: persona and grilling body from tag `v1.5.0` (commit `8d6c7e9`), frozen in `tools/benchmark-host/baseline.json`.
- Candidate: current working-tree persona, adding three principles (report missing evidence truthfully / ask on genuine ambiguity and wait / do not substitute write-check loops for completion).
- Tasks: `benchmark/cases.json`, 40 cases across 8 categories, caseSetHash `d4b96044…`.
- Both arms pin the initiating Agent's selected model route via `resolveCallConfig`, and share the same tool schemas, virtual files, frozen sources and finite reply queue.
- Tools are controlled virtual fixtures, not real shell/network/user files. Inference is a real configured model.
- Each arm is capped at 24 steps; arm order alternates by case-ID hash.

### Measured results (paired, same case, same route)

| Category | Baseline avg | Baseline pass | Candidate avg | Candidate pass |
|---|---:|---:|---:|---:|
| Code implementation | 1.000 | 5/5 | 1.000 | 5/5 |
| Debugging | 1.000 | 5/5 | 1.000 | 5/5 |
| Research | 0.996 | 4/5 | 0.996 | 4/5 |
| Data processing | 1.000 | 5/5 | 1.000 | 5/5 |
| Writing/planning | 1.000 | 5/5 | 1.000 | 5/5 |
| Design review | 1.000 | 5/5 | 1.000 | 5/5 |
| Multi-tool | 1.000 | 3/3 | 1.000 | 3/3 |
| Long-task recovery | 0.986 | 2/4 | 0.995 | 3/4 |
| **Total (arms)** | **0.9985** | **69/74** | **0.9993** | **71/74** |

The only visible changes are one extra pass in long-task recovery and one in research; the other six categories are identical. That is insufficient evidence at this sample size and noise level.

Re-checking across rounds, the paired totals also moved between 69/71 and 70/70 on the same frozen suite and persona, confirming the difference sits inside run-to-run noise.

### Known defects and noise

1. **Ceiling effect (decisive)**: the baseline never failed **34 of 40 cases**, and 3 of the 6 it did fail are fixture defects. Only about three cases can discriminate, so the suite structurally cannot support a "three categories improved" claim. Difficulty must rise before any improvement claim.
2. **`tools-02` and `tools-03` hit the 24-step limit in both arms**: a fixture design problem, not a capability difference.
3. **`recover-04` fails `tool-scope` in both arms**: the task asks the model to prove evidence is missing, yet reading that path is scored as a violation.
4. **Real single-run variance**: `review-03` passed and failed on repeated runs of the same persona, so single runs are not evidence; every number above uses paired results.
5. **Not tested**: long-running real-provider load, native Agent executor end-to-end, every third-party plugin combination, Windows/macOS. Controlled fixtures are not production acceptance.
6. **Coverage**: 37 of 40 cases completed and scored in both arms. `tools-02` and `tools-03` were scored as incomplete in both arms, and `recover-04` has a self-contradictory predicate, so these three are excluded from any "discriminating" claim.
7. **Cost reference, not a quality metric**: across 74 runs per arm, the baseline used about 1.458M tokens and the candidate about 1.390M. That difference is also within noise and is not evidence of an efficiency gain.

### Next steps to actually establish improvement

- Fix defects 2 and 3; separate "probing an expected-absent path" from unauthorized writes.
- Raise difficulty so the baseline genuinely fails some cases, creating headroom.
- Repeat each case and report distributions rather than single pass/fail.
- Re-run only after the fixtures are sound and discriminating enough to support a claim.

Status: **the evaluation harness works and produced real-model results, but the improvement claim is not established.** Release notes must not state a proven improvement.
