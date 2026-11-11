# 版本记录 / Changelog

[中文](#中文) · [English](#english)

## 中文

### 未发布 — 证据优先与验证加固

- 人设新增三条原则：缺证据必须如实报告而非臆测补全；真正歧义先问并等回答；不以反复写—查代替达成目标。
- 测试从 31 项增至 48 项：技能来源改为真实路径与完整正文严格比对，并加入外部同名诱饵负例；补齐容量阈值、缓存 TTL、取消与主机共存边界。
- 修正包元数据：Node 受支持下限对齐官方 `>=24.9.0`；修正 lock 版本号错位；CI 增加 24.9 与 24 双矩阵。
- 新增 100+100 来源静态研究与双语报告（状态 partial，插件缺口如实标注）。
- 新增同路由真实模型对照评测框架与 40 题冻结任务集；实测未证明改进，结论与局限记录于评测文档，不对外宣称提升。

### 1.5.0 — 默认启用 grilling

- 人设新增默认策略：涉及方案/架构选型、依赖替换、数据模型、权限与安全边界、破坏性操作、范围与验收、成本权衡，或存在会改变实现方向的关键歧义时，先加载 grilling 分轮提问并在共识后实施。
- 纯执行、需求已明确、机械改动、查证事实、修复已定位缺陷不进入访谈，避免把日常任务变成多轮问答；用户可随时跳过。
- 更新中英双语说明；不改变技能原文、许可证、选档与保留策略、权限边界和兼容门禁。

### 1.4.0 — 内置 grilling 技能

- 随包分发 Matt Pocock 的 MIT `grilling` 技能，固定上游提交并保留英文原文、许可证、来源与校验信息。
- 通过官方 `skill-filesystem` 与 `tool-skill` 将本包技能根目录接入 `omni`，保留已有技能；无需复制到用户 home。
- 支持自然语言要求对方案、决策或想法进行拷问/压力测试；仅要求集成或安装技能不会启动访谈，普通明确执行不强制进入 grilling。
- 增加双语使用说明与第三方声明；维持既有选档、保留策略、权限边界和 DSH 0.2.2-rc.1 兼容门禁。技能目录发现、原生加载及 TGZ 消费断言以实际验收结果为准，不代表真实模型行为已验证。

### 1.3.1 — 完整双语文档

- 补齐用户文档、贡献、安全、许可证说明、Issue 模板、工作流显示文字和发行说明的中英双语。
- 为页面语言与本地文档链接增加自动检查。
- 沿用 1.3.0 的运行时行为、权限边界和兼容范围，不重写历史版本标签。

### 1.3.0 — 首次公开 GitHub 发行

- 使用 `dsh-omni-mode` 包名，保留 `omni` 预设 ID 和中文显示名。
- 增加 MIT、上游归属、文档与修改指南；移除测试环境中的作者固定路径。
- 增加发行包检查、解包消费回归、CI 和 Release 工作流。
- 排除凭据、本机配置、原始 Session 和大日志；沿用 1.2 的运行时行为。
- 仅 GitHub/Release 发布，主动禁止误发 npm。

### 1.2.0 — 本地兼容加固

- 增加精确宿主门禁、模型容量感知保留、服务隔离与原生压缩/恢复。
- 防止空闲裁剪写出无效存档生命周期；以策略测试和真实 Host＋模拟推理验证。

### 1.1.0 — 本地质量优先模式

- 增加能力感知选档、更大的信息保留设置和失败保护。

### 1.0.0 — 本地预设

- 引入跨项目规划、能力发现、执行、验证和交付规则。

## English

### Unreleased — evidence-first principles and verification hardening

- Persona gains three principles: report missing evidence truthfully instead of guessing; ask on genuine ambiguity and wait; do not substitute write-check loops for completion.
- Tests grow from 31 to 48: skill provenance now compares the real path and full body, with an external same-name decoy negative case; capacity thresholds, cache TTL, cancellation and host-coexistence boundaries are covered.
- Package metadata fixed: the supported Node floor now matches the official `>=24.9.0`; a lock version mismatch is corrected; CI adds a 24.9 and 24 matrix.
- Adds static research over 100+100 sources with a bilingual report (status partial; plugin gap stated honestly).
- Adds a same-route real-model paired evaluation harness with 40 frozen tasks; the run does not establish an improvement, and the conclusion and limits are recorded rather than claimed as a gain.

### 1.5.0 — Grilling enabled by default

- The persona now grills before implementing whenever a task contains a design trade-off — architecture/stack selection, dependency replacement, data model, permission or security boundaries, destructive actions, scope and acceptance, cost trade-offs — or ambiguity that would change the implementation direction.
- Plain execution, fully specified requirements, mechanical edits, fact lookups and fixes of an identified defect stay direct, so daily work does not become multi-round questioning; you can skip at any time.
- Bilingual docs updated. The vendored skill text, its license, reasoning/retention policy, authorization boundaries and the compatibility gate are unchanged.

### 1.4.0 — Bundled grilling skill

- Bundle Matt Pocock's MIT-licensed `grilling` skill at a pinned upstream commit, retaining the English original, license, provenance and checksum information.
- Expose the package skill root to `omni` through official `skill-filesystem` and `tool-skill`, retaining existing skills without copying files into the user's home.
- Support natural-language requests to grill or stress-test a plan, decision or idea. Requests only to integrate/install the skill do not start an interview; ordinary explicit execution does not require grilling.
- Add bilingual usage guidance and third-party notices; retain existing reasoning/retention policies, authorization boundaries and the DSH 0.2.2-rc.1 gate. Directory discovery, native loading and TGZ consumption assertions remain subject to actual acceptance results, not proof of real-model behavior.

### 1.3.1 — Complete bilingual documentation

- Complete Chinese/English user docs, contribution/security/license explanations, Issue forms, workflow labels and release notes.
- Add checks for language coverage and local documentation links.
- Keep 1.3.0 runtime behavior, authorization boundaries and compatibility; do not rewrite historical tags.

### 1.3.0 — First public GitHub distribution

- Publish as `dsh-omni-mode`, retaining the `omni` preset ID and Chinese display name.
- Add MIT, upstream notices, docs and modification guidance; remove author-specific test-runtime paths.
- Add release checks, extracted-package consumer regression, CI and release workflows.
- Exclude credentials, local profiles, raw sessions and large logs; retain the 1.2 runtime behavior.
- GitHub/Release only; accidental npm publishing is disabled.

### 1.2.0 — Local compatibility hardening

- Add exact Harness gate, capacity-aware retention, isolation and native compaction/recovery.
- Protect persisted lifecycle relationships from idle pruning; verify with policy tests and real Host/mock inference.

### 1.1.0 — Local quality-first mode

- Add capability-aware reasoning initialization, larger retention settings and failure protection.

### 1.0.0 — Local preset

- Introduce cross-project planning, capability discovery, execution, verification and delivery rules.
