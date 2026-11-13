# 版本记录 / Changelog

[中文](#中文) · [English](#english)

## 中文

### 1.7.0-dev.1 — 领域专长与代码视觉（未正式发布）

- 兼容门禁由 `0.2.2-rc.1` 提升为 **`0.2.2-rc.2`**：该版本经隔离安装后实测通过原生集成、11 个技能加载、推理选档、压缩事务与服务隔离。仍为精确门禁，未验证的版本（含 rc.1）会被明确拒绝，不静默放行。
- 修复集成报告中的版本硬编码：此前 `dsh` 字段固定写 `0.2.2-rc.1`，导致在其他宿主版本上运行也会谎称在 rc.1 验收；现改为读取实际测试版本，并记录测试基座来源（明确指定或开发依赖）。
- 领域夹具补齐后新增回归：嵌套 `node --test` 继承 `NODE_TEST_CONTEXT` 会不执行测试即返回 0，曾使 `doctor --test` 在仓库测试内报出 `accepted: true`。已在该自检子进程与夹具测试中清除该变量，并用故意失败的用例证明陷阱确实存在。

- 在原 `omni` 预设内新增十个按需加载的领域技能（工程、游戏、安全网络与逆向、文档演示、小说叙事、研究学习、陪伴个性化、助理、分子生物数据、业务语义）和 `omni-code-media`；仍是一个包、一个显示名、一个预设 ID，不拼接一百份人设。
- 新增能力索引 `capabilities/catalog.json`：100 套来源配置引用、23 个能力条目，并用 verified / needs-dependency / method-only / uncovered 区分"本地契约有测试"、"仍需外部依赖"、"只有方法"和"未覆盖"。`doctor` 明确区分已安装与已验收，`doctor --test` 才实际运行本包契约测试。
- 新增 11 个原生本地操作（CSV/JSON 校验转换、游戏数值初筛、小说显式事实连续性、FASTA 基础统计、实体关系一致性、引用覆盖、本地指标提取、Markdown 大纲、待办依赖、UTC ICS 草稿），全部只用 Node 内置能力，不新增生产依赖；写入需显式 `--allow-write` 且不覆盖已有文件。
- 新增代码视觉链路：场景源码 → 静态 SVG → 明确版本的 resvg 栅格化 → FFmpeg 编码 GIF/MP4。不调用图像或视频生成模型；有授权素材优先用素材，否则从零代码制作；视频音频需求未明确时先询问。依赖显式准备，不在激活或渲染时静默安装；缺依赖明确阻塞而非换格式冒充。
- 新增 100 套预设分类证据与双语报告：主分类唯一、总数 100，并如实标注工程占 60、游戏 10 套来自同一项目，以及样本缺少临床/法律/会计量化金融/CAD 等领域。
- 新增领域工程验收与 12 个领域/跨域任务题集；后者保持 `not-run`，不宣称模型已自动化使用这些能力。
- 验证：257 项仓库测试、63 项能力契约测试、22 项真实渲染测试（真实 resvg+FFmpeg，0 跳过）、原生集成确认 11 技能与两个运行器可从安装包加载。原 40 题成绩与"未证明模型提升"的结论不变。

### 1.6.0-dev.1 — 全能模式执行方法（未正式发布）

- 在同一 `dsh-omni-mode` 包和 `omni` 预设中增加按需加载的 `omni-method` 技能，不新增另一套预设或第三方运行依赖；简单查询、机械改动、完整指定步骤的任务不必加载。
- 将研究机制落实为成果契约、按任务发现能力、限定写入范围的证据交接、基于错误的纠正及断点恢复说明；新增双语用法与六组固定来源的采用/拒绝对应关系。
- 推理选档、自适应保留与 grilling 原文保持字节不变；原生测试新增双技能完整路径/正文核验与模型请求触发说明检查，安装包分别移除两种技能并用外部同名诱饵验证不能补救缺失。
- 开发版本标记不改变预设身份，不切换本机 profile。接线/回归测试不是行为提升证明，旧人设评测不得归给新方法；稳定发行与本机迁移仍待原定改善验收。

### 未发布 — 来源研究完成与评测账目更正

- 来源研究达到静态门槛：**100 套**经审阅、结构唯一的预设配置（来自 **63 个**项目；单仓多配置不重复计项目），**106 个**经审阅的独立原生插件项目，证据含固定版本/commit、归档与每文件 SHA-256、可核验的原生集成片段。共 505 个包被静态检查、175 个进入公开证据，全部 **未安装、未 import、未运行**。
- 如实公布两组交集：所选两批 100 项子集内互不重叠，但有 **50 个**所选预设仓库同时提供原生插件集成，故不宣称"两组完全无交集"。
- 更正审阅合并顺序：文件名按轮次而非字典序合并，后轮可更正前轮决定；此前 `reviews.presets-round7.json` 会被字典序更靠后的旧笔记覆盖。
- 更正评测统计：撤回混用实验队列与实验臂的 `69/74` 对 `71/74`，改为按同题集、同人设、同路由哈希分别统计两臂，保留首轮失败、中断与步数耗尽，重复运行不替换。新增离线汇总器与单元测试。
- 修正评测驱动的错误处理：提供方失败、取消、缺失终止事件现在保留已完成工具轨迹与部分产物并标记为未完成，不再整条丢弃；收据新增评分器、驱动、题面、技能、基线与路由身份哈希，供后续确认性复跑核对。
- 结论仍为**未证明改善**：原 40 题逐题差异仅 1 胜 1 负，且存在候选关键退步；判据修订发生在观察结果之后，只能作为探索性诊断。评测文档同步更正此前"仅天花板效应"的说法。

### 未发布（较早）— 证据优先与验证加固

- 人设新增三条原则：缺证据必须如实报告而非臆测补全；真正歧义先问并等回答；不以反复写—查代替达成目标。
- 测试从 31 项增至 48 项：技能来源改为真实路径与完整正文严格比对，并加入外部同名诱饵负例；补齐容量阈值、缓存 TTL、取消与主机共存边界。
- 修正包元数据：Node 受支持下限对齐官方 `>=24.9.0`；修正 lock 版本号错位；CI 增加 24.9 与 24 双矩阵。
- 新增 100+100 来源静态研究与双语报告（当时状态 partial，插件缺口如实标注）。
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

### 1.7.0-dev.1 — Domain specialties and code media (not a stable release)

- Raises the compatibility gate from `0.2.2-rc.1` to **`0.2.2-rc.2`**, installed in isolation and verified against native integration, 11-skill loading, reasoning selection, compaction transactions and service isolation. It stays an exact gate: unverified versions (including rc.1) are refused explicitly rather than silently accepted.
- Fixes a hardcoded version in the integration report: the `dsh` field always said `0.2.2-rc.1`, so a run on another host version falsely claimed rc.1 acceptance. It now reads the version actually under test and records whether the test base came from an explicit path or the development dependency.
- Adds a regression from the fixture work: a nested `node --test` inherits `NODE_TEST_CONTEXT` and exits 0 without running tests, which once let `doctor --test` report `accepted: true` inside the repository suite. The variable is stripped in that self-check child and in the fixture test, with a deliberately failing case proving the trap is real.

- Adds ten on-demand domain skills inside the existing `omni` preset (engineering, game, security/network/RE, documents, fiction, research, personalization, assistant, molecular-biology data, business semantics) plus `omni-code-media`. Still one package, one display name and one preset ID; no concatenation of a hundred personas.
- Adds the capability index `capabilities/catalog.json`: references to the 100 source configurations and 23 capability entries, distinguishing verified / needs-dependency / method-only / uncovered. `doctor` separates installed from accepted; only `doctor --test` runs the package contract tests.
- Adds 11 native local operations (CSV/JSON validation and transformation, preliminary game arithmetic, explicit fictional canon continuity, FASTA statistics, entity-relation consistency, citation coverage, local indicator extraction, Markdown outlines, todo dependencies, UTC ICS drafts) using Node built-ins only, with no new production dependency. Writing needs an explicit `--allow-write` and never overwrites an existing file.
- Adds the code-media pipeline: scene source → static SVG → pinned resvg rasterization → FFmpeg GIF/MP4. No image or video generation models; authorized assets are reused when available, otherwise drawn from scratch in code; audio for video is asked first. Dependencies are prepared explicitly, never installed silently at activation or render time; a missing dependency is an explicit block rather than a format substitution.
- Adds traceable classification evidence and a bilingual report for the 100 presets: one primary category each, 100 total, honestly noting 60 engineering configurations, all 10 game configurations from one project, and gaps such as clinical, legal, accounting/quantitative finance and CAD.
- Adds domain engineering acceptance plus 12 domain/cross-domain tasks; the latter stay `not-run`, with no claim that the model already uses these capabilities automatically.
- Verification: 257 repository tests, 63 capability contract tests, 22 real render tests (real resvg + FFmpeg, 0 skipped), and native integration confirming 11 skills and both runners load from the installed package. The original 40-case results and the "no proven model improvement" conclusion are unchanged.

### 1.6.0-dev.1 — Omni execution method (not a stable release)

- Adds the on-demand `omni-method` skill inside the same `dsh-omni-mode` package and `omni` preset, without another preset or third-party runtime dependency. Simple queries, mechanical edits and fully prescribed steps need not load it.
- Adapts reviewed mechanisms into outcome contracts, task-specific capability discovery, write-scoped evidence handoffs, evidence-led correction and recovery guidance. Adds bilingual usage and adoption/rejection mappings to six pinned source groups.
- Reasoning selection, adaptive retention and the original grilling text remain byte-for-byte unchanged. Native tests add exact paths/bodies for both skills and verify the trigger reaches model requests; package negatives remove each skill in turn and ensure external same-name decoys cannot repair the omission.
- A development version does not change preset identity or switch the local profile. Wiring/regression checks do not establish behavioral gains; old-persona results cannot be attributed to this method. Stable release and local migration remain gated by the original improvement acceptance.

### Unreleased — source research completed and evaluation accounting corrected

- Source research reaches the static threshold: **100** reviewed, structurally unique preset configurations from **63** projects (several presets in one repository count as configurations, never as extra projects), plus **106** reviewed independent native plugin projects. Evidence pins versions/commits, archive and per-file SHA-256, and verifiable native integration fragments. 505 packages were statically inspected and 175 enter public evidence; none was **installed, imported or executed**.
- Both overlap figures are published: the two chosen 100-item subsets do not intersect, yet **50** selected preset repositories also ship native plugin integration, so the groups are not claimed to be disjoint.
- Review merge order fixed: notes are merged by round rather than lexical filename order, so a later round can correct an earlier decision. Previously `reviews.presets-round7.json` was silently overridden by an older note that sorts later.
- Evaluation accounting corrected: the mixed `69/74` versus `71/74` totals are withdrawn. Arms are now counted separately within a matching case-set/persona/route cohort, keeping first-attempt failures, interruptions and step limits, never replacing them with retries. An offline summarizer and unit tests were added.
- Driver error handling fixed: provider failures, cancellation and a missing terminal event now retain completed tool calls and partial artifacts and are labelled incomplete instead of discarding the whole arm. Receipts now carry grader, driver, case, skill, baseline and route identity hashes for later confirmatory reruns.
- The result remains **improvement not established**: the original 40 cases show one paired win and one paired loss with a candidate critical regression, and the rubric revisions followed observed outcomes, so they are diagnostic only. The evaluation document also withdraws the earlier "ceiling effect only" explanation.

### Unreleased (earlier) — evidence-first principles and verification hardening

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
