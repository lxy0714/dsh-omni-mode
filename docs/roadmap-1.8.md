# 全能模式 1.8 路线图 / Omni mode 1.8 roadmap

[中文](#中文) · [English](#english)

## 中文

### 这份文件回答什么

`v1.7.0` 已发布，兼容 DSH `0.2.2-rc.1` 至 `0.2.2-rc.3`。本文回答下一个问题：**这个预设还能怎么加强**，以及**要不要改成分发形态**。

所有数字来自仓库内的实际记录，不是估计：能力成熟度取自 `capabilities/catalog.json`，回归结论取自 `benchmark/native-session-results.json`，技能厚度取自实际文件行数。

**阶段 A 进度**：历史三组共 126 份收据、248 个分支已只读重放，评分无差异。经用户确认，另立公开契约版本并完成 40 对真实模型记录，双方均 40/40；四项旧差异在新版本均通过。候选策略本轮未改，不能将共同规范改善归功于预设增强。一次中断仍有未知结果，严格干净首轮门槛保持 false。旧成绩不改，见[首轮审计](stage-a-audit.md#中文)与[完整实测](stage-a-contract-results.md#中文)。

**历史路线图**：下文保留当时的规划、判据与证据语境，不是当前发行说明。阶段 B 达到 27 条/15 个操作，随后[阶段 C](stage-c-results.md#中文)增至 32 条/20 个操作。`v1.8.0` 的实际验证范围见[发行说明](release-notes.md#中文)。

---

### 一、先回答架构问题：不需要"变成插件"

**结论：保持 bundle 承载 preset 的现有形态，不拆分。**

理由不是偏好，是边界：

1. **它已经是插件。** `package.json` 声明 `dsh.bundle.patch`，`cordis.patch.yml` 里插入的是 `preset-omni` 声明行。安装方式、版本门禁、打包检查全部按插件走。
2. **预设的作用范围是每个 agent 独立挂载。** 宿主级服务具有更大的潜在影响面，但是否作用于其他 agent 仍取决于贡献作用域和消费者，不能一概说必然全局生效。当前没有需要扩大作用域的证据，因此保留既有边界。
3. **缺的不是包装。** 原版 23 条/11 个本地契约，阶段 B 27 条/15 个，阶段 C 候选 32 条/20 个；`verified` 始终不是整个领域认证。方法、工具和真实任务验证分开评估，行数不当能力分数。

**本批不增加插件**：精确数值、影响分析与文档核验均复用既有本地CLI。将来确实需要原生工具服务时才单独论证预设作用域，不因为新功能就扩大宿主配置。

当前取舍：**以同一个 omni 预设为核心，不因换包装扩大影响面。** 如未来确有共享服务需要，另行评估作用域、消费者与隔离测试，而不是把所有宿主插件都视为同一种风险。

---

### 二、阶段 A：复核 4 个回归信号

先区分真实行为缺陷、接口契约缺口和基础设施未知。已证实的关键行为退步必须修复并阻断相关发布；但旧40题不是全部领域能力的替代，也不能靠猜私有枚举消除差异。

实际记录（`unchanged-original40-after-recovery-guard` 队列，40 题）：

| 指标 | 旧版 | 新版 |
|---|---|---|
| 首轮完成 | 39 | 39 |
| 首轮通过 / 关键通过 | **37** | **33** |
| 含单列基础设施恢复的完成数 | 40 | 40 |
| 含该恢复的通过 / 关键通过 | **38** | **34** |

首轮完整配对是 39/40。38/34 是每题最早完整配对、含单列基础设施恢复的口径，不能写成 40 次正常首轮完成。

四个由通过变为不通过的用例：

- `research-02`
- `review-02`
- `recover-03`
- `recover-04`

历史队列另有 `recover-05` 出现在防护前的一轮中，一并纳入排查范围，避免只修表面四个。

**做法**：逐个复现 → 读取原始收据与产物 → 定位是题面未规定、还是真实行为退步 → 修复 → 重新冻结题集与评分器 → 全量复测。

**不做什么**：不改题面来适配结果，不做 best-of 重试，不把恢复轮混入首轮成绩。判据一旦修改必须重新冻结并对全部 40 题重跑，不能只重跑失败项。

**完成标准**：40/40 完成、关键通过数不低于旧版 38、四个用例恢复通过，且 `releaseGateSatisfied` 变为 `true`。

上项是未来新验收的目标，不是编辑历史字段的许可。现有历史文件中的 `releaseGateSatisfied:false` 必须保留。用户已同意另立公开契约版本；该版本记录内结果条件满足，但因未知中断尚无严格干净首轮证明，不能宣告这一门槛已通过。新旧结果、接口格式和中间轨迹安全均分别保存。

---

### 三、阶段 B：加厚实际在用的领域

覆盖范围仍是全部已分类领域；以下仅为第一批建议，不把全能模式收窄成 idle 游戏专用预设。以真实任务差距和成果质量选取增强点，行数不是能力评分。

阶段B前领域技能偏检查清单，游戏缺少idle专门数值方法。本批补精确离线收益与成长曲线；货币池配平、留存节点、引擎/实机仍不因此自动解决。

而使用者正在开发的正是增量/idle 品类。这是投入产出最高的方向。

**优先级排序**（按实际使用证据）：

1. **idle 游戏数值**：单位时间产出、离线收益上限与衰减、货币膨胀与消耗池配平、阶段解锁节奏、留存节点。同时补一个真实可跑的本地操作，用确定性输入验证曲线，而不是写通用文档。
2. **工程交付**：现有描述准确但偏薄，补"改动的真实影响面、独立验收、回滚可执行"的具体流程。
3. **文档与叙事**：按现有契约补可操作的检查步骤。

**完成标准**：每个加厚的领域必须同时具备——可执行方法、至少一个真实跑通的本地操作、独立测试。只有文字没有执行的，仍标 `method-only`，不冒充加强。

---

### 四、阶段 C：把 method-only 做实

下列五个上位条目保持 `method-only`；阶段 C 为每类新增不替换上位条目的独立本地切片：

- `engineering.delivery`
- `game.production`
- `fiction.longform`
- `research.grounded`
- `personalization.style`

**做法**：为相应需求补范围明确、离线可跑的细分操作与契约测试。新操作有真实测试后才可标为 `verified`；不能因为一个小操作通过，就把整个工程交付、游戏制作或研究方法条目整体升级为已验证。

**不做什么**：不把 `needs-dependency` 的 5 项（真实数据库、Office/PDF、授权网络检查、真实预订、外部渲染器）强行标成已验证——它们确实依赖外部环境。`uncovered` 的 2 项（生物功能验证、未知专业缺口）保持未覆盖状态并继续如实披露。

---

### 五、验收标准

阶段 A、B、C 各自的完成标准写在对应章节。整体发布前必须同时满足：

主验收是领域真实能力覆盖、产物质量和关键无退步，至少验证三类实际增强；旧40题保留作回归，不硬凑三个类别涨分，也不把一项小操作测试当整个领域认证。

1. 全部仓库测试、能力契约测试、真实渲染测试通过；数字由 `scripts/check-claims.mjs` 与实测比对。
2. 兼容门禁对每个被接纳的 DSH 版本**逐个隔离安装并跑通原生集成**，不靠范围写得宽。
3. 原 40 题全部重跑且关键通过数达标。
4. 文档与发行说明中英双语，未证事项逐条列明。
5. `quality.js`、`adaptive.js`、`pool.js` 与上游 grilling 原文保持字节不变，除非有对应的行为证据支持修改。

任一条不满足就不发布，也不把"工具能用"说成"预设变强"。

---

### 六、风险与回滚

- **阶段 A 可能暴露真实退步**，而不只是题面问题。若确认是行为退步，必须回退到引入该行为的改动，不能只调评分口径。
- **加厚领域会增加包体积与激活开销**。保持按需加载：技能不常驻、操作不自动执行。
- **回滚路径**：任何阶段失败可退回 `v1.7.0` 标签；本机迁移与回滚步骤见[迁移与回滚](migration-rollback.md#中文)。
- **历史记录不改写**：旧的预发布标签、失败的收据和中断记录一律保留，见[增强证据](enhancement-evidence.md#中文)与[领域执行复核](domain-run-results.md#中文)。

---

### 七、建议的执行顺序

阶段 A、B 的记录和未知边界保留；阶段 C 的五个本地切片及实际任务单列于[候选报告](stage-c-results.md#中文)。B/C 的局部操作增强不抵销 A 的严格首轮门禁。

## English

### What this document answers

`v1.7.0` is published and supports DSH `0.2.2-rc.1` through `0.2.2-rc.3`. This document answers the next question: **how this preset can still be strengthened**, and **whether its distribution form should change**.

Every figure comes from records inside the repository rather than estimates: capability maturity from `capabilities/catalog.json`, regression conclusions from `benchmark/native-session-results.json`, and skill depth from actual file line counts.

**Phase A checkpoint**: 126 historical receipts and 248 arms were replayed read-only with no grade differences. Following user approval, a separate public-contract version produced 40 complete real-model recorded pairs, both arms passing 40/40, including the four earlier discordant cases. Candidate policy was unchanged, so clearer common constraints are not credited as preset improvement. An interrupted invocation remains unknown and strict clean-first-attempt acceptance stays false. History is unchanged; see the [initial audit](stage-a-audit.md#english) and [complete results](stage-a-contract-results.md#english).

**Historical roadmap**: the plan, criteria and evidence context below are preserved as recorded, not as current release notes. Phase B reached 27 entries/15 local operations, and [Phase C](stage-c-results.md#english) brought this to 32 entries/20 operations. See the [release notes](release-notes.md#english) for the verified scope of `v1.8.0`.

---

### 1. The architecture question first: it does not need to "become a plugin"

**Conclusion: keep the existing bundle-carries-preset form; do not split it.**

The reason is scope, not preference:

1. **It is already a plugin.** `package.json` declares `dsh.bundle.patch`, and `cordis.patch.yml` inserts the `preset-omni` declaration row. Installation, version gating and packaging checks all run as a plugin.
2. **A preset mounts per agent.** Host-level services have a potentially wider impact, but actual effects depend on contribution scope and consumers; they do not invariably apply to every agent. There is no evidence requiring a wider scope here, so retain the current boundary.
3. **Packaging is not the gap.** Pre-B counts were 23 entries/11 contracts; the working tree now has 27/15. Verified remains local-contract evidence, not domain certification or a line-count score.

**This batch adds no plugin**: arithmetic, impact and document checks reuse the existing local CLI. A future native service would need a separate preset-scope justification, not an automatic Host expansion.

Current decision: **keep the same omni preset at the center, without widening impact merely to change packaging.** A future genuine shared-service need must separately assess scope, consumers and isolation tests rather than treating every host plugin as the same risk.

---

### 2. Phase A: investigate the four regression signals

Distinguish behavioral defects, interface-contract gaps and infrastructure uncertainty first. Established critical behavioral regressions must be fixed and block the relevant release. Original40 do not substitute for all-domain capability evaluation, and guessing private enum strings is not the objective.

Actual record (`unchanged-original40-after-recovery-guard` cohort, 40 cases):

| Metric | Baseline | Candidate |
|---|---|---|
| Primary finished | 39 | 39 |
| Primary passed / critical passed | **37** | **33** |
| Finished including separate infrastructure recovery | 40 | 40 |
| Passed / critical passed including that recovery | **38** | **34** |

Complete primary pairs number 39/40. The 38/34 figures select each case's earliest complete pair, including explicitly separated infrastructure recovery; they are not 40 clean primary completions.

Four cases moving from pass to fail:

- `research-02`
- `review-02`
- `recover-03`
- `recover-04`

An earlier cohort also shows `recover-05`; include it in the investigation so only the visible four are not patched.

**Approach**: reproduce each case, read the raw receipts and artifacts, determine whether the cause is an under-specified prompt or a real behavioural regression, fix it, re-freeze the case set and grader, then re-run everything.

**Not doing**: editing prompts to fit results, best-of retries, or mixing recovery rounds into first attempts. Any rubric change must be re-frozen and re-run across all 40 cases, not only the failing ones.

**Done when**: 40/40 finished, critical passes at least matching the baseline 38, all four cases passing again, and `releaseGateSatisfied` becomes `true`.

This targets a future acceptance record, not permission to edit a historical flag. The existing `releaseGateSatisfied:false` remains. The user approved a separate public-contract version; its recorded outcome conditions are satisfied, but unknown interruption prevents a clean-first-attempt proof, so this gate has not passed. New/old results, interface format and trajectory safety remain separately recorded.

---

### 3. Phase B: deepen the domains actually in use

Coverage still includes every classified domain; the following is only a proposed first batch, not a conversion into an idle-game-only preset. Choose enhancements from real-task gaps and artifact quality, not skill line counts.

Before Phase B, the game checklist lacked idle-specific numerics. Exact offline rewards and growth are now added; economy-sink balancing, retention design and engine/device acceptance do not follow automatically.

The work in progress is exactly an incremental/idle game, which makes this the highest-return direction.

**Priority by actual usage evidence**:

1. **Idle game numerics**: output per unit time, offline-yield caps and decay, currency inflation and sink balancing, stage unlock pacing, retention checkpoints. Ship a real runnable local operation that verifies curves against deterministic input instead of writing generic prose.
2. **Engineering delivery**: the current text is accurate but thin; add concrete procedures for real impact surface, independent acceptance and executable rollback.
3. **Documents and narrative**: add operational checking steps on top of the existing contracts.

**Done when**: every deepened domain has a runnable method, at least one genuinely executed local operation, and independent tests. Anything with prose only stays `method-only` rather than being presented as strengthened.

---

### 4. Phase C: make method-only real

The five umbrella entries below stay `method-only`. Phase C adds a distinct local slice for each without replacing the umbrella entry:

- `engineering.delivery`
- `game.production`
- `fiction.longform`
- `research.grounded`
- `personalization.style`

**Approach**: add narrowly scoped, offline-runnable sub-operations and contract tests where useful. Only a genuinely tested operation earns `verified`; one passing helper does not promote the entire engineering-delivery, game-production or research-method entry.

**Not doing**: promoting the five `needs-dependency` entries (real database, Office/PDF, authorized network checks, real bookings, external renderer) — they genuinely depend on external environments. The two `uncovered` entries (biological functional validation, unknown professional gaps) stay uncovered and disclosed.

---

### 5. Acceptance criteria

Phase-specific criteria live in their sections. Before any release, all of these must hold:

Primary acceptance is actual domain coverage, artifact quality and critical non-regression, with at least three demonstrated practical enhancements. Original40 remain regression coverage, not a forced three-category score increase; one helper test never certifies a whole domain.

1. Repository tests, capability contract tests and real render tests pass; `scripts/check-claims.mjs` compares documented figures against measured ones.
2. The compatibility gate installs **each** admitted DSH version in isolation and passes native integration, rather than relying on a wide range.
3. All 40 original cases are re-run and meet the critical-pass target.
4. Documentation and release notes are bilingual, with unproven items listed individually.
5. `quality.js`, `adaptive.js`, `pool.js` and the upstream grilling text remain byte-identical unless behavioural evidence justifies changing them.

If any condition fails, there is no release, and working tools are never described as a stronger preset.

---

### 6. Risks and rollback

- **Phase A may expose a real regression**, not merely a prompt problem. If behaviour genuinely regressed, revert the change that introduced it instead of adjusting the rubric.
- **Deepening domains increases package size and activation cost.** Keep loading on demand: skills never resident, operations never automatic.
- **Rollback path**: any phase can revert to the `v1.7.0` tag; local migration and rollback steps are in [migration and rollback](migration-rollback.md#english).
- **History is never rewritten**: older pre-release tags, failed receipts and interruptions are preserved; see [enhancement evidence](enhancement-evidence.md#english) and the [execution review](domain-run-results.md#english).

---

### 7. Recommended order

Retain Phase A and B records and uncertainty. See the [candidate report](stage-c-results.md#english) for the five Phase C slices and actual tasks. Local Phase B/C capability gains do not satisfy Phase A's strict primary gate.
