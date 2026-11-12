# DSH 静态来源研究 / DSH static source research

## 已确认的计数单位 / Confirmed counting units

用户经 Lead 明确确认：目标是 **100 套真正可独立选择、配置实质不同的 Agent 预设**，项目数另列；另选 **100 个独立原生 DSH 插件项目**。不同版本、改名、纯翻译与同构 fork 不凑数；同仓多套可计配置而不能伪装成多个项目。两组交集单列，不宣称 200 个不同仓库。

The user confirmed through the Lead: **100 independently selectable, substantively distinct Agent preset configurations**, with projects counted separately, plus **100 independent native DSH plugin projects**. Repeated versions, renames, pure translations and isomorphic forks do not count. Multiple presets in one repository are configurations, not multiple projects. Cross-group overlap is explicit; no claim of 200 repositories is made.

## 实际进度 / Actual progress

状态 / Status: **complete-static-not-runtime-tested**. 证据生成时间 / Evidence generated: 2026-11-12T06:25:08.781Z.

| 指标 / Metric | 实际 / Actual |
| --- | --- |
| 目录线索 / Catalog leads | 5324 |
| 选择性尝试包数 / Selected packages attempted | 505 |
| 原始声明/注册配置池 / Raw declaration/registration pool | 147 |
| 精确哈希去重配置池（非最终合格数）/ Exact-hash pool, not final eligibility | 146 |
| 预设项目池（谱系未穷尽）/ Preset project pool, lineage not exhaustive | 69 |
| 原生插件项目池（非学习完成数）/ Native plugin pool, not completed studies | 446 |
| 已审阅且合格预设配置 / Reviewed qualified preset configurations | 100 |
| 对应预设项目 / Corresponding preset projects | 63 |
| 已审阅且合格原生插件项目 / Reviewed qualified native plugin projects | 106 |
| 预设缺口 / Preset gap | 0 |
| 插件缺口 / Plugin gap | 0 |
| 实读学习点项目数 / Projects with reviewed learning points | 175 |
| 所选两组子集内的交集项目 / Overlap inside the two chosen 100-item subsets | 0 |
| 所选预设项目中同时提供原生插件集成的仓库 / Selected preset repositories that also ship native plugin integration | 50 |

**池子大于 100 不等于完成。** 实读范围是有界 README 节选与关键实现/组合片段，不声称全文安全审计。未审阅项目不生成猜测学习点。所有研究对象 **未安装、未 import、未运行，安装脚本未执行**。

**A pool above 100 is not completion.** Reading covers bounded README excerpts and key implementation/composition fragments, not full-text security audits. Unreviewed sources receive no invented lessons. All researched targets were **not installed, imported or executed; no install scripts ran**.

## 方法 / Method

1. 只读本地 5,324 条 catalog，旧 43 命中只作优先队列；名称/说明仅用于候选排序，不用于认定合格。已覆盖名字或说明中含 preset/预设的 211 条目录项，并补角色、架构、协作、中文模式与已知仓库线索。
   Read the local 5,324-entry catalog; the old 43 matches are priority leads only. Names/descriptions rank candidates, never prove eligibility. Covered all 211 catalog entries with preset/预设 in name/description, then expanded role, architecture, collaboration, Chinese-mode and known-repository leads.
2. npm 使用目录记录的固定版本，核对真实 package.json 的名字、版本和 dsh 清单；有界下载 tarball 后验证 dist.integrity。公开 GitHub-only 来源使用提交 feed 发现 SHA，再读取固定 40 位 commit 归档，记录 commit、归档 hash 与每文件 SHA-256；不用匿名 GitHub API。
   Pin catalog npm versions and validate real manifest identity/DSH fields; verify dist.integrity before reading bounded tarballs. GitHub-only sources use commit-feed discovery and fixed 40-character commit archives with archive/per-file hashes, without the anonymous GitHub API.
3. 只从真实 dsh.bundle.patch 字符串或数组给出的路径解析 YAML/JSON；处理 insert、id override、group、include 闭包，深度/循环有上限。!!js 保留为不透明数据，永不求值。未命中宿主既有行的覆盖会记诊断，不编造宿主状态。
   Parse YAML/JSON only at actual string/array dsh.bundle.patch paths. Handle insert, id override, group and bounded/cycle-checked include closure. Preserve !!js as opaque data; never evaluate. Unresolved overrides are diagnostics, not invented host state.
4. 运行时路径从真实 exports/main 和补丁入口沿相对 import 静态追踪，以 AST 读取 agentPresets.register 和 presetDir。TypeScript 只去类型再解析；不执行远程函数。动态参数、间接 JSON、运行条件未证明时保守待查，不按补丁字符串/依赖名字凑数。
   Follow actual exports/main and patch entrypoints through relative imports, reading registration/presetDir with an AST. TypeScript is stripped and parsed, never executed. Unproven dynamic arguments, indirect JSON and runtime conditions remain pending; patch strings/dependency names do not qualify sources.
5. 插件必须有真实 DSH manifest 和可达 Host/Client 集成片段；通用 MCP 项目、目录收录和普通集合的 add/set 字符串都不构成原生证据。npm/GitHub镜像按仓库归并，同仓子包不重复计项目。
   Plugins require a real DSH manifest plus reachable Host/Client integration fragments. Generic MCP projects, catalog inclusion and ordinary collection add/set strings are insufficient. Normalize npm/GitHub mirrors by repository; collapse same-repository subpackages.
6. 配置实质哈希删除显示 id/名/描述/排序与行 id，保留工具、persona、隔离、禁用等结构；再人工剔除内置模式重发、翻译、内部隐藏面和已知同构。未穷尽的 fork 谱系明确列为限制。
   Substantive hashes remove display id/name/description/order and row ids, retaining tools, persona, isolation and disabled structure; manually reject builtin republications, translations, hidden/internal faces and known isomorphisms. Non-exhaustive fork lineage is an explicit limitation.

## 限流与安全 / Bounds and safety

- 最多 6 并发；请求 15 秒；至多 1 次重试；响应 10 MiB、元数据 2 MiB；归档解压上限 40 MiB/12,000 条目。错误、超时和超限保留 partial，不改网络设置绕过限制。
  At most 6 concurrent requests, 15-second deadline and 1 retry; 10 MiB response/2 MiB metadata, 40 MiB unpacked/12,000 entries. Errors/timeouts/limits remain partial; no network-setting bypasses.
- 归档只在内存读取，不执行、不安装、不解包到项目；忽略链接/设备/穿越路径；校验缓存与研究文件 hash。缓存和完整 inventory 在工作区外部研究缓存中，不加入交付JSON。
  Read archives in memory without execution, installation or project extraction; ignore links/devices/traversal paths and verify cache/file hashes. Raw cache/full inventory stay outside the deliverable JSON.
- 不改核心、源码、依赖清单、模型权重、用户权限或profile。研究不等于推荐安装。许可证缺失或素材另有权利时不默认允许复制。
  No changes to core, source code, dependencies, model weights, user permissions or profiles. Research is not installation advice; missing licenses or separately owned assets do not imply copying permission.

## 可重跑 / Reproduction

从仓库根执行；只运行本仓库研究脚本，不运行研究对象。使用本机既有 yaml/acorn 解析库；未安装新的研究依赖。
Run from repository root. These are local research scripts, not target-package code. Existing host yaml/acorn parsers are used without installing research targets or new dependencies.

```sh
node --test scripts/research/parsers.test.mjs
node scripts/research/collect.mjs --limit 35 --concurrency 6
# 下一批 / Next batch
node scripts/research/collect.mjs --offset 35 --limit 140 --concurrency 6
# 审阅后更新计数与紧凑报告 / Recompile reviews and compact report
node scripts/research/audit.mjs
node scripts/research/report.mjs
node scripts/research/verify.mjs
```

采集会每 10 项写 checkpoint；缓存命中无需网络。`--names a,b` 精确重跑，`--refresh` 重新解析结果，仍复用经 hash 校验的响应缓存。源码变动应提升 collectorVersion 后重解析。审阅笔记必须固定版本、列证据路径；新增笔记先实际读 README 与片段。
Collection checkpoints every ten items; cache hits require no network. `--names a,b` reruns exact names; `--refresh` reparses results while reusing hash-checked response caches. Bump collectorVersion for parser changes. Reviews pin versions and cite paths; read README/fragments before adding notes.

## 学习点索引 / Reviewed lesson index

### @a9i5k4/dsh-anchored-monitor@0.3.1

- 来源 / Source: [aik358/dsh-anchored-monitor](https://github.com/Aik358/dsh-anchored-monitor)
- 中文：流监控先按sessionId和enabled门控，再结合session事件区分工作区与子会话；不能把措辞指纹当模型质量实证。
- English: Gate stream monitoring by sessionId and enabled state, using session events for workspace/child scope; wording fingerprints are not evidence of model quality.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@a9i5k4/dsh-anchored-monitor@0.3.1/lib/index.js) · SHA-256 `787c116e5c0719677b6630798d5d5bc3bbd27440ce58fe32d072fc008422b6ba`

### @addozhang/dsh-discord@0.6.8

- 来源 / Source: [addozhang/dsh-discord](https://github.com/addozhang/dsh-discord)
- 中文：Discord接入将令牌交给宿主credentials服务保存，界面文案通过locale注册，避免业务连接器私建密钥存储。
- English: Store Discord tokens through the host credentials service and register UI dictionaries through locale instead of inventing connector-specific secret storage.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@addozhang/dsh-discord@0.6.8/lib/index.js) · SHA-256 `2059249a95f1bc448ffb05f3f3e696d59b0d8aaf8e05907ae3bebf98ed705b96`

### @aeroscis/dsh-temptask@0.6.0

- 来源 / Source: [aeroscis/dsh-temptask](https://github.com/Aeroscis/dsh-temptask)
- 中文：临时任务复用原生工作区/会话结构，入口通过sidebar.panellist挂载；清理范围限定任务根的子目录并需二次确认。
- English: Reuse native workspaces/sessions for temporary tasks through sidebar.panellist; constrain cleanup to children of the task root with confirmation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [client/client.js](https://unpkg.com/@aeroscis/dsh-temptask@0.6.0/client/client.js) · SHA-256 `41a0820d1314f57270e545a968aca3a72eae495ec6e71834fbacd2fc7ded0ed1`

### @agent_forge/forge-dsh@1.84.5

- 来源 / Source: [mjxupup/forge](https://github.com/MjxUpUp/Forge)
- 中文：包装器把 PreToolUse 映射到 tools/pre-execute，把 PostToolUse 映射到 post-execute，先筛匹配组再调用外部判定；SessionStart 的上下文按 agent 排队，只有 pre-step 真正投递后才清空，reject 时保留。事件桥要保留各阶段的拒绝/重试语义，不能仅转发同名通知。
- English: The wrapper maps PreToolUse to tools/pre-execute and PostToolUse to post-execute, selecting matching groups before external adjudication. SessionStart contexts queue per agent and clear only after actual pre-step delivery, remaining queued on rejection. An event bridge must preserve phase-specific rejection/retry semantics, not merely forward similarly named notifications.
- 风险 / Risk: 门禁核心在外部 forge 程序；未执行或审计该程序，包装器接通不等于质量规则有效。 / Gate logic lives in the external forge program, which was neither run nor audited; a connected wrapper does not prove effective quality rules.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@agent_forge/forge-dsh@1.84.5/lib/index.js) · SHA-256 `f7ad42060a03c1e72edcc2551004f6bc87d58c5a2ffd995aaeaaeaf52e71b240`

### @aiwayds/dsh-subagent-registry@0.19.1

- 来源 / Source: [fan56/dsh-subagent-registry](https://github.com/fan56/dsh-subagent-registry)
- 中文：把批量判断限定为结构化JSON的codemode子任务，角色委派指导仅在相关工具可见的作用域生效。
- English: Scope codemode to batch decisions returning structured JSON, and expose role-delegation guidance only where its tools are visible.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@aiwayds/dsh-subagent-registry@0.19.1/cordis.patch.yml) · SHA-256 `7c993895d907cf166c707d0fff7ffe0067c360a3eef562b73aa94c14a1d1246c`

### @anonyjcy/dsh-j-space@1.2.5

- 来源 / Source: [anonyjcy/dsh-j-space](https://github.com/AnonyJcy/dsh-j-space)
- 中文：保留原认知控制器和工作区账本，但让模型、权限和团队能力继续由DSH宿主管理，适配层不另造运行时。
- English: Retain the cognition controller and workspace ledger while leaving models, permissions, and teams with DSH rather than inventing another runtime.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@anonyjcy/dsh-j-space@1.2.5/cordis.patch.yml) · SHA-256 `aeaca44731e8af1a0757c1b585bbca634f4cb80b4ea02b25dc049112ae6ab515`

### @ash-qw/dsh-theme-prts@3.2.1

- 来源 / Source: [ash-qw/dsh-theme-prts](https://github.com/ash-qw/dsh-theme-prts)
- 中文：自定义工具预览通过tool.call.toolview槽接入，保留原生数据流；代码许可与同人素材许可必须分开审计。
- English: Attach custom previews through tool.call.toolview while retaining native data flow; audit code licensing separately from fan-art assets.
- 风险 / Risk: MIT不覆盖第三方角色图像等素材；只学习交互结构，不复制素材。 / MIT does not cover third-party character assets; study interaction structure without copying assets.
- 片段 / Fragment: [lib/client.js](https://unpkg.com/@ash-qw/dsh-theme-prts@3.2.1/lib/client.js) · SHA-256 `25627ab456186275b8d6957aa05d7c82a307aa5efbe8158aa087707eae7d00ce`

### @astron-team/skillhub-dsh@0.6.3

- 来源 / Source: [iflytek/skillhub](https://github.com/iflytek/skillhub)
- 中文：技能搜索的内部 selectionRef 与 sessionId/cwd/sourceRevision 绑定，历史恢复还核对同一 callId 的唯一调用/结果、事件顺序及非继承事件；结果说明区分文件存在、完整性、宿主发现与可调用性，不把无本来源记录说成全局未安装。
- English: Internal skill-search selectionRef values are bound to sessionId/cwd/sourceRevision, and history recovery checks a unique same-callId call/result, ordering and non-inherited events; result guidance distinguishes file presence, integrity, host discovery and invocability instead of equating no current-source record with global absence.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@astron-team/skillhub-dsh@0.6.3/lib/index.js) · SHA-256 `1679cca3ecaed42295ec741e29efc1a3eff9c6292b56299c1e2415fa177664b4`

### @benrong/dsh-prompt-polish@0.2.6

- 来源 / Source: [benrong2048-boop/dsh-prompt-polish](https://github.com/benrong2048-boop/dsh-prompt-polish)
- 中文：润色草稿默认写回而不发送，GET模型列表与POST优化分路并检查method，防止辅助功能无意变成代发。
- English: Polish defaults to draft replacement, not sending; separate model-list GET from optimization POST with method checks to avoid accidental submission.
- 风险 / Risk: AGPL-3.0-or-later，代码引入需独立评估义务。 / AGPL-3.0-or-later requires separate assessment before code incorporation.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@benrong/dsh-prompt-polish@0.2.6/lib/index.js) · SHA-256 `762c31e4d72a591e926196f54552ddaaad2f8aba071f816943e9733f4adef2cd`

### @carljia/omd-dsh@0.1.9

- 来源 / Source: [jiazz197-cmyk/omd-dsh](https://github.com/jiazz197-cmyk/omd-dsh)
- 中文：模型分配矩阵通过settings live命名空间管理，prompt钩子跳过未固定模式与子会话；不能把同步CLI产物自动当原生预设证据。
- English: Manage model matrices through a live settings namespace and skip unpinned modes/child agents in prompt hooks; CLI sync output alone is not native-preset evidence.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/host.js](https://unpkg.com/@carljia/omd-dsh@0.1.9/lib/host.js) · SHA-256 `9585ec6bac944d7ada441f3a76ebc2277bee8dd147483311b22c9f87f77fce1f`

### @chenkai114/dsh-team-admin@0.2.7

- 来源 / Source: [chenkai2/dsh-team-admin](https://github.com/chenkai2/dsh-team-admin)
- 中文：用墓碑和回收站处理append-only roster的删除，而不是直接抹去成员状态；管理面通过独立路由和main槽接入。
- English: Use tombstones and trash for deletion from append-only rosters rather than erasing member state; expose management through a dedicated route and main slot.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [src/index.js](https://unpkg.com/@chenkai114/dsh-team-admin@0.2.7/src/index.js) · SHA-256 `d54039fb39381950e75ed7e3ebe9eeb7ef5dc60b7706f070c5c74600c650f01b`

### @chenxu233/dsh-agent-teams@0.2.2

- 来源 / Source: [chenxu233/dsh-agent-teams](https://github.com/ChenXu233/dsh-agent-teams)
- 中文：团队state与halt是分离路由，halt限定POST并对错误method返回405；读状态与停止任务必须使用不同契约。
- English: Separate team state and halt routes; require POST for halt and return 405 for wrong methods, keeping observation and cancellation contracts distinct.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@chenxu233/dsh-agent-teams@0.2.2/lib/index.js) · SHA-256 `da893add64a67b56e85f2ee59dd020e76f5fe921c165ee306332d16ff1ca67ee`

### @copylee/dsh-image-gen@0.2.0

- 来源 / Source: [copylee711/dsh-image-gen](https://github.com/copylee711/dsh-image-gen)
- 中文：Provider注册要求至少一个合法入口并绑定释放生命周期；与上游不同路由、数据目录、工具名的共存边界值得借鉴。
- English: Require a valid provider entry and bind registration to disposal; distinct routes, data directories, and tool names make coexistence explicit.
- 风险 / Risk: 部分Provider代码移植自上游，需保留Apache归属；不把上游镜像另计为独立来源。 / Some provider code is adapted upstream and needs Apache attribution; do not count upstream mirrors independently.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@copylee/dsh-image-gen@0.2.0/lib/index.js) · SHA-256 `f6d2ca79f66e6f863ab680700b814315cb1dfc5393f310ea15332bc58efe1b8d`

### @creait/dsh-research-mode@0.2.0

- 来源 / Source: [creait-nl/dsh-plugins](https://github.com/CREAIT-nl/dsh-plugins)
- 中文：固定研究循环的配置路由把disposers交给作用域effect统一回收，避免重载残留路由；模式存在不等于已核验其完整预设闭包。
- English: Dispose configuration-route registrations through the owning scope effect to avoid stale routes after reload; a named mode does not prove its full preset closure.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@creait/dsh-research-mode@0.2.0/lib/index.js) · SHA-256 `e650ae16a387c17324dd091aaf583ad18ad683c6cfff74cb2a1df318b7602b96`

### @dsh-agentic-roleplay/core@0.12.0

- 来源 / Source: [firefox2100/dsh-agentic-roleplay](https://github.com/Firefox2100/dsh-agentic-roleplay)
- 中文：角色扮演API作为prefix路由挂在webCtx生命周期，并把结构化state组件与UI/编排组件分离。
- English: Mount roleplay as a prefix route owned by webCtx, separating structured state from UI and orchestration.
- 风险 / Risk: GPL-3.0-only；仅研究机制，不默认允许复制进不同许可工程。 / GPL-3.0-only; study mechanisms without assuming compatibility for code copying.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@dsh-agentic-roleplay/core@0.12.0/lib/index.js) · SHA-256 `e6de290cebd0426877304235a23071334b3d107237378a36b57cde741cf34878`

### @dsh-plugins/dsh-env-inspector@0.2.11

- 来源 / Source: [webkubor/dsh-env-inspector](https://github.com/webkubor/dsh-env-inspector)
- 中文：self-check与kill-port分成两个明确API，避免把只读诊断与终止进程混为一种操作；网络自检应用户触发。
- English: Separate self-check from kill-port APIs so read-only diagnostics are not conflated with process termination; network checks should be user-triggered.
- 风险 / Risk: README标为已弃用；只作历史设计参考。 / README marks it deprecated; use only as a historical design reference.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@dsh-plugins/dsh-env-inspector@0.2.11/lib/index.js) · SHA-256 `e33a355df00c2c0a7a3e8e2e289ae45971d95b203bca629a66d525f9c2e0df26`

### @dsh-suite/plugin-team-board@0.2.1

- 来源 / Source: [whyihaveyou/dsh-suite](https://github.com/whyihaveyou/dsh-suite)
- 中文：多智能体共享状态用 Cordis 服务键物化而非模块级全局变量，并把快照落盘到固定目录以便跨重启恢复；这比让每个子代理各持内存更可靠。
- English: Materialize shared multi-agent state through a Cordis service key instead of module-level globals, and persist a snapshot to a fixed directory so it survives restarts.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dist/index.js](https://unpkg.com/@dsh-suite/plugin-team-board@0.2.1/dist/index.js) · SHA-256 `3b47e895617ad850ba4e242535a78123e675d96a80669e634757e46f89df4d6b`

### @duke-dsh-plugins/dsh-git-manager@1.7.0

- 来源 / Source: [moonlitdropofblood/dsh-git-manager](https://github.com/MoonlitDropOfBlood/dsh-git-manager)
- 中文：输入框Git入口与shell.overlay分槽注册，覆盖层只在打开时挂交互监听，减少常驻UI副作用。
- English: Register the composer Git entry and shell.overlay separately, attaching overlay interaction listeners only while open to reduce persistent UI side effects.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [client.js](https://unpkg.com/@duke-dsh-plugins/dsh-git-manager@1.7.0/client.js) · SHA-256 `45aac72faca51f8372a7777e0cb9620acd302d4b2df707342a6bb2036e4d78f6`

### @esroamer/codex-dsh-collab@0.2.0

- 来源 / Source: [esroamer/codex-dsh-collab](https://github.com/ESROAMER/codex-dsh-collab)
- 中文：跨工具协作明确单向发起语义：由外部工具主动调用，DSH 侧不会唤醒空闲会话；把"谁发起"写进文档避免误期待。
- English: Cross-tool collaboration states its one-way initiation explicitly: the external tool initiates and the harness never wakes an idle session, so nobody expects the reverse.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/@esroamer/codex-dsh-collab@0.2.0/index.js) · SHA-256 `18f5ce8e5d1f0e5d15f16e16923d2c460954af2a27abda3f875fbe57d42c8c39`

### @ethanwong-hk/dsh-thinking-guard@1.0.2

- 来源 / Source: [ethanwong-hk/dsh-thinking-guard](https://github.com/ethanwong-hk/dsh-thinking-guard)
- 中文：在assistant-stream阶段而非流结束后发现纯思考空转，并在agent/disposed清理session状态；连接活性不等于任务进展。
- English: Detect reasoning-only stalls during assistant-stream rather than after stream completion, cleaning session state on agent disposal; connection activity is not task progress.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@ethanwong-hk/dsh-thinking-guard@1.0.2/lib/index.js) · SHA-256 `d6362f73aa0d1b17fe900afc30d50a00937d960eaea0fd0ecc8e18e14132fa69`

### @ethanyoq/dsh-ai-novel-writer@0.1.0

- 来源 / Source: [ethanyoq/ai-novel-writer](https://github.com/EthanYoQ/AI-Novel-Writer)
- 中文：限制专用代理只见两个工具并在 agent.ctx.effect 中成对清理代理级与预设级资源；写入前比较上次读取的哈希版本，避免覆盖他人修改。
- English: A dedicated agent is restricted to two tools, with paired agent-level and preset-level cleanup effects; writes compare the previously read hash revision to avoid clobbering others.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/agent.js](https://unpkg.com/@ethanyoq/dsh-ai-novel-writer@0.1.0/lib/agent.js) · SHA-256 `e0f9baac3a7364eab31b7b6c411d5ebe5eeaf7b11d6991dc11199efe3e8593fd`

### @fallnstrelitzia/dsh-chat-settings@1.2.0

- 来源 / Source: [fallnstrelitzia/dsh-chat-settings](https://github.com/FallnStrelitzia/dsh-chat-settings)
- 中文：会话级prompt变换先await下游组装并校验对象形状，request钩子绑定agent作用域，不靠改全局配置实现单会话覆盖。
- English: Await downstream prompt assembly and validate its shape; bind request hooks to the agent scope instead of changing global settings for per-chat overrides.
- 风险 / Risk: package未声明许可证，README徽章不能替代完整许可核验。 / Package declares no license; README badges are not a substitute for full license verification.
- 片段 / Fragment: [index.js](https://unpkg.com/@fallnstrelitzia/dsh-chat-settings@1.2.0/index.js) · SHA-256 `3f0c2594045609f9feefff4870f4b77f87198ced616f90344f75fce4a938eef6`

### @free-lzj/dsh-agent-import@0.3.3

- 来源 / Source: [free-lzj/free-dsh-plugins](https://github.com/Free-LZJ/free-dsh-plugins)
- 中文：配置热更新通过 pending Promise 链串行 disposeGeneration、清空旧 record、重新 buildGeneration，再发布新报告；报告路由读取当前 record，无活动代时返回 NO_REPORT。技能报告枚举 DSH 自己目录内 linked/local 条目，而非把外部目录中的候选都冒充已导入。
- English: Hot configuration updates serialize disposeGeneration, old-record clearing, buildGeneration, and new report publication through a pending Promise chain. Report routes read the current record and return NO_REPORT between generations. Skill reports enumerate linked/local entries in DSH's own directory instead of presenting every foreign candidate as imported.
- 风险 / Risk: 未启动导入的 MCP server，也未验证符号链接操作或所有卸载竞态；静态代际装配不是外部配置安全证明。 / No imported MCP server was started, and symlink operations or all disposal races were not verified; static generation assembly is not proof of external-configuration safety.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@free-lzj/dsh-agent-import@0.3.3/lib/index.js) · SHA-256 `17b927fe24b77d6ca57c04d500ff09892f6d36f3102f5eefba30074a801f7e4a`

### @furongjun1999/dsh-memory@0.10.1

- 来源 / Source: [furongjun-1999/dsh-memory](https://github.com/FuRongJun-1999/dsh-memory)
- 中文：记忆系统用独立main页面与sidebar.panellist入口让管理面可见；未运行，不能据README的“无幻觉”字样断言记忆可靠。
- English: Expose memory management through a dedicated main page and sidebar.panellist entry; without running it, README claims of no hallucinations do not establish reliability.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/client.js](https://unpkg.com/@furongjun1999/dsh-memory@0.10.1/lib/client.js) · SHA-256 `b6eb617572e04415ac7f50437ee3806eeaa32242be72f878d702a4d76aa0876d`

### @ggboy123/dsh-paper-reader@1.11.0

- 来源 / Source: [ggboya/dsh-paper-reader](https://github.com/GGboya/dsh-paper-reader)
- 中文：伴读persona先出题、等学生独立阅读后再核验，且用complete/关闭运行上下文形成窄教练面；不能当通用工程模式照搬。
- English: The coach asks questions before independent reading and verifies afterward; complete persona and disabled runtime context form a deliberately narrow surface, not a general engineering mode.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@ggboy123/dsh-paper-reader@1.11.0/cordis.patch.yml) · SHA-256 `289e490657c2bcf18db37fb810525f3fedb318a7167ae8b5e6c8ec555fc87ec6`

### @gnanesh/dsh-session-coldstore@0.1.2

- 来源 / Source: [gnaneshkunal/dsh-session-coldstore](https://github.com/GnaneshKunal/dsh-session-coldstore)
- 中文：冷存储把 sweep 暂存与 commit 分开，提交必须带仍匹配的 batchId，dryRun 开启时拒绝提交；即使直接 freeze 指定会话，也重新计算同一套候选策略，而不把点名当豁免条件。
- English: Cold storage separates staged sweep from commit, requires a still-matching batchId and refuses commits under dryRun; even direct freeze of named sessions recomputes the same candidate policy instead of treating explicit IDs as exemptions.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@gnanesh/dsh-session-coldstore@0.1.2/lib/index.js) · SHA-256 `3c47341050daa77a3a3e59a1737fa9341fdc2aa7ceb97d56d7b6d512109a7d8f`

### @godv61/dsh-task-engine@0.40.1

- 来源 / Source: [godv61/dsh-task-engine](https://github.com/godv61/dsh-task-engine)
- 中文：工程persona要求先声明analysis/implementation意图，并以源码行范围和hash冻结证据，避免用一段自述证明完成。
- English: Declare analysis versus implementation intent first, then freeze evidence using source line ranges and hashes rather than self-reported completion.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@godv61/dsh-task-engine@0.40.1/cordis.patch.yml) · SHA-256 `5af84d2efb2a4f95484e06faed9ac77a65d528df999a1d82d53e07ea6b278de4`

### @goodandready/dsh-goal@0.2.35

- 来源 / Source: [goodandready/dsh-goal](https://github.com/GooDAnDReaDY/dsh-goal)
- 中文：目标附件以 goal/changed 的 create/resume 重置该 goal 的预算账，再只在 goals.get(agent) 返回 active 时做预算检查和里程碑提示；UI 广播与完成报告是旁路，错误单独记录，不应被当作目标真实完成的独立验收。
- English: The goal add-on resets that goal's budget on goal/changed create/resume and performs budget checks and milestone guidance only when goals.get(agent) is active; UI broadcasts and completion reports are side channels with separately logged failures, not independent acceptance of actual goal completion.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@goodandready/dsh-goal@0.2.35/lib/index.js) · SHA-256 `656aec9eb0379d7815f2842e5e056421448d5eec0a9b10098af5f06860ecf0d5`

### @goodjin2/dsh-superpowers@0.3.1

- 来源 / Source: [goodjin/dsh-superpowers](https://github.com/goodjin/dsh-superpowers)
- 中文：将技能阶段和delegate_skill绑定，使不同开发技能可选不同子代理模型；应按任务激活而非全局强塞流程。
- English: Bind skill stages to delegate_skill so different development skills can choose different worker models; activate per task instead of globally imposing the workflow.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@goodjin2/dsh-superpowers@0.3.1/cordis.patch.yml) · SHA-256 `fa7b7662cb0d304931762929af602359f3d960c9cd2644642c193532316fdad3`

### @hanxuanliang/dsh-chaos@0.1.2

- 来源 / Source: [hanxuanliang/dsh-chaos](https://github.com/hanxuanliang/dsh-chaos)
- 中文：持久协作记录放进事务性本地账本，并在 llm/stream 上按 sessionId 门控；资源清理写成 async effect 并等待计时器停止，避免卸载后仍有回调。
- English: Durable collaboration records live in a transactional local ledger, gated per sessionId on llm/stream; cleanup is an async effect that awaits timer shutdown so no callback survives unload.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@hanxuanliang/dsh-chaos@0.1.2/lib/index.js) · SHA-256 `86c7f993cca4182139128976b22df702e8b910055d166612f634656768e8e4a3`

### @hawk2048/oh-my-dsh@0.4.5

- 来源 / Source: [hawk2048/oh-my-dsh](https://github.com/hawk2048/oh-my-dsh)
- 中文：同一能力同时提供自然语言技能与斜杠命令两条入口，命令接到具体本机原生原语而不是另造执行器；这让编排可被显式触发也可被模型自动选用。
- English: Offer both natural-language skills and slash commands for one capability, with commands delegating to native harness primitives instead of inventing a second executor.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [commands/omd-commands.mjs](https://unpkg.com/@hawk2048/oh-my-dsh@0.4.5/commands/omd-commands.mjs) · SHA-256 `e1a6880140490221d99de9bb97d32e3b725d4d6cf89d92cfcaf0ac0715264591`

### @ifrankwang/openspec-agents@1.5.0

- 来源 / Source: [ifrankwang/openspec-agents](https://github.com/ifrankwang/openspec-agents)
- 中文：开发与审查是不同物理agent，工具未挂载时应报告而不是在shell寻找隐藏工具；身份与验收职责要显式传递。
- English: Separate implementation and review into physical agents; report missing tools instead of hunting hidden installs, and pass identity and acceptance duties explicitly.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dsh/cordis.patch.yml](https://unpkg.com/@ifrankwang/openspec-agents@1.5.0/dsh/cordis.patch.yml) · SHA-256 `e7d1eb157a045524463db3ea4a8707db5b2e9705f3f054a09a2e15cd4f993a9f`

### @jhcai11/oh-my-dsh@0.1.2

- 来源 / Source: [sevenology7/oh-my-dsh](https://github.com/SeveNOlogy7/oh-my-dsh)
- 中文：原生四主面通过config.agent选择真实角色，运行时加载不同prompt、技能子集、委派白名单与写入策略；访谈规划、批准计划指挥、深度实现和全域统筹不是换名。七个委派专用面仍不计数。
- English: Four native primary faces select real roles through config.agent, loading different prompts, skill subsets, delegation allowlists and write policies: interview planning, approved-plan conducting, deep implementation and broad orchestration are not renames. Seven delegation-only faces remain uncounted.
- 风险 / Risk: readOnly只阻断源码列出的write/edit，不等于阻断一切shell写入或完整沙箱；prompt/标签不能替代宿主权限。 / readOnly denies the source-listed write/edit tools, not every shell-side mutation or a complete sandbox; prompt labels do not replace host permissions.
- 片段 / Fragment: [package.json](https://unpkg.com/@jhcai11/oh-my-dsh@0.1.2/package.json) · SHA-256 `4984546237442af492cbd5304d000ae6067a15b590a12cbd135ecd4dd523e8d5`

### @joekytc/dsh-swarm@0.5.1

- 来源 / Source: [joekytc/dsh-swarm](https://github.com/joekytc/dsh-swarm)
- 中文：把需求拆成严格有序的阶段链，每阶段只有单一职责和受限工具面，交接以机器可校验的证据契约判定；失败按幂等方式恢复。
- English: Decompose a requirement into a strictly ordered phase chain where each phase has one responsibility and a restricted tool face, with machine-checked evidence contracts at every handoff and idempotent recovery.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@joekytc/dsh-swarm@0.5.1/lib/index.js) · SHA-256 `55ea585f81c3d869e4c1db5609abe0836308b0d34892af49679517b5ba531545`

### @kanchengw/dsh-collab@0.1.0

- 来源 / Source: [kanchengw/dsh-collab](https://github.com/kanchengw/dsh-collab)
- 中文：人类协作房间明确"宿主拥有唯一权威会话、参与者不直接访问宿主代理或文件系统"，把多用户边界写进架构而非仅靠约定。
- English: A human collaboration room states that the host owns the single authoritative session and participants get no direct access to the host agent or filesystem — a boundary in the architecture, not just a convention.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@kanchengw/dsh-collab@0.1.0/lib/index.js) · SHA-256 `a1ebdd66b0404865eafbbd85b4e6562000d0a355204ddbf69e12e57e5f0979f3`

### @kasenri/dsh-orbit@0.6.7

- 来源 / Source: [kasenri/dsh-orbit-browser-plugins](https://github.com/KasenRi/dsh-orbit-browser-plugins)
- 中文：长期编排把流程控制权留在监督者而非模型自由循环，并在设置变更时主动丢弃缓存的读取函数，避免继续使用过期路由。
- English: Long-run orchestration keeps control flow with a supervisor rather than a free model loop, and settings changes invalidate the cached readers so stale routes are not reused.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@kasenri/dsh-orbit@0.6.7/lib/index.js) · SHA-256 `4b6d86c411dde6407bed651bed8ad5a84b0fd4d594495f8de77b8590e5ed31d9`

### @kira905/dsh-task-board-local@1.2.1

- 来源 / Source: [kira905/dsh-task-board-local](https://github.com/kira905/dsh-task-board-local)
- 中文："跑完不由执行方自己宣布完成"是对自评风险的直接制度化解法：完成状态需要外部确认；fork 时保留 NOTICE 与改动声明。
- English: Requiring a human sign-off instead of letting the executor declare completion directly institutionalizes distrust of self-report; a fork keeps the upstream NOTICE and states its changes.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@kira905/dsh-task-board-local@1.2.1/lib/index.js) · SHA-256 `65966f18bbb7288cdd1566a8aa5abff48b4f111bf367cb555aaf079e9a2de712`

### @limuyang2/dsh-agent-team@0.1.4

- 来源 / Source: [limuyang2/agent-team](https://github.com/limuyang2/agent-team)
- 中文：团队成员是各自独立的根代理（独立模型、会话、权限），而非伪装成子代理；这保留了权限与上下文的真实边界。
- English: Team members are independent root agents with their own model, session and permissions rather than disguised subagents, preserving real boundaries of authorization and context.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@limuyang2/dsh-agent-team@0.1.4/lib/index.js) · SHA-256 `fa22677a7ac82da878c04875b5ff837e509888a78c04e8a5b7bfd9143b852f06`

### @lucagiftzek/dsh-orchestrator@0.1.1

- 来源 / Source: [lucagiftzek/dsh-orchestrator](https://github.com/lucagiftzek/dsh-orchestrator)
- 中文：把扇出与取消代理、以及多种任务类型（命令、抓取、HTTP）统一在一套 orch_* 工具下，宿主侧只暴露受限前缀路由，客户端面板走设置区插槽。
- English: Fold agent fan-out/cancel and several task kinds (command, scrape, http) into one orch_* tool family, exposing only a prefixed host route and a settings-section slot for the panel.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@lucagiftzek/dsh-orchestrator@0.1.1/lib/index.js) · SHA-256 `0bf14c7ec565630ba9e18d5ec93cf0103685dcf44a9f2ceca41a6ec3299e44e0`

### @lucagiftzek/dsh-phone@0.3.2

- 来源 / Source: [lucagiftzek/dsh-phone](https://github.com/lucagiftzek/dsh-phone)
- 中文：电话连接器把普通 JSON API 与音频 upgrade 路由分别注册并分别回收；宿主缺少 registerUpgrade 时明确关闭该音频入口、记录降级原因，而不把侧栏可用等同于音频链路可用。
- English: The phone connector registers and disposes its JSON API and audio upgrade route separately; when registerUpgrade is unavailable it explicitly disables that audio entry and logs the degradation rather than equating sidebar availability with an available audio path.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@lucagiftzek/dsh-phone@0.3.2/lib/index.js) · SHA-256 `acc22d389de69620cc4505894bda1a9cbacd01d9a3eeffa1e6d9228a43b4731c`

### @maximehu97/dsh-meeting@0.3.0

- 来源 / Source: [maximehu97/dsh-meeting](https://github.com/maximehu97/dsh-meeting)
- 中文：把个人代理的对外信息压成可用/勉强/需本人点头三态，保留原始隐私本地并把例外决定交还本人。
- English: Reduce cross-agent availability to three states while retaining private reasons locally and returning exceptions to the person.
- 风险 / Risk: README明确无鉴权、仅可信局域网；不得当安全通信方案引入。 / README explicitly says no authentication and trusted LAN only; do not adopt it as a secure communications design.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@maximehu97/dsh-meeting@0.3.0/cordis.patch.yml) · SHA-256 `35ae937e6c9bea7088096a2da2bfe97a7918c364f96881f78b28620283f12e03`

### @nanmicoder/dsh-agent-teams@0.1.29

- 来源 / Source: [nanmicoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams)
- 中文：团队控制面提供查询当前状态与"急停"两个显式端点，且急停只接受 POST 并返回 405 允许头；把破坏性控制的语义做进 HTTP 层。
- English: A team control plane exposes explicit state and halt endpoints, with halt accepting only POST and returning a 405 with an allow header — destructive semantics encoded in the HTTP layer.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@nanmicoder/dsh-agent-teams@0.1.29/lib/index.js) · SHA-256 `d1acee6dcf31916dd647bb8f30ce8540e3c7db72dab2aa2d6d3c64534c6cec7d`

### @nilesh32236/dsh-squad@1.1.0

- 来源 / Source: [nilesh32236/dsh-squad](https://github.com/nilesh32236/dsh-squad)
- 中文：跨工作区worker由幂等名称绑定，报告必须包含答案本身；reviewer区分观察与推断，auditor把每个数字和done声明重新对照原始证据。
- English: Bind cross-workspace workers by idempotent names and require reports to contain the answer itself; reviewers separate observation from inference, while auditors recheck numbers and done claims against primary evidence.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@nilesh32236/dsh-squad@1.1.0/cordis.patch.yml) · SHA-256 `d6325c56c702273fd078e3ab9f63af81b97b297d2f29f23a6e2587327d7469eb`

### @oxmumu3/dsh-agent-twin@0.4.0-preview.6

- 来源 / Source: [oxmumu3/ai-twin-starter](https://github.com/oxmumu3/ai-twin-starter)
- 中文：分身能力明确"材料有来源、权限有边界"，并在发布说明里区分已验证（安装、蒸馏、候选试跑）与未验收（真实 Slack 收发）；这种分层声明值得照做。
- English: State that a twin's material has provenance and its permissions have boundaries, and separate verified steps (install, distill, candidate trial) from unaccepted ones (real Slack delivery) in release notes.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/@oxmumu3/dsh-agent-twin@0.4.0-preview.6/index.js) · SHA-256 `cdb497ee180db8e537bb7ffea25ff2ab4d8b42102b44cde24b263933b65c7fcb`

### @paipaipai666/dsh-pstack@0.5.0-beta.6

- 来源 / Source: [paipaipai666/dsh-pstack](https://github.com/paipaipai666/dsh-pstack)
- 中文：工具解析工作区失败时返回 undefined 而不是抛错，并附带 doctor 自检工具读取真实的 DSH_HOME 与 profile 目录，便于定位环境问题。
- English: A tool returns undefined when workspace resolution fails instead of throwing, and ships a doctor tool that reads the real DSH_HOME and profile directory to diagnose environment problems.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dist/chart.mjs](https://unpkg.com/@paipaipai666/dsh-pstack@0.5.0-beta.6/dist/chart.mjs) · SHA-256 `542bc4d9c41f13fed5e19facedd91ea3ad517150173a432f205c5981c51b3c58`

### @sakura12/oh-my-deepseekharness@0.7.2

- 来源 / Source: [1225sakura/oh-my-deepseekharness](https://github.com/1225Sakura/oh-my-deepseekharness)
- 中文：移植其他生态的编排理念时明确标注上游来源（OMC/OMX），把"改编自谁"写进首页，降低使用者对行为一致性的误解。
- English: When porting orchestration ideas from another ecosystem, name the upstream projects on the front page so users do not assume behavioral equivalence.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [README.md](https://unpkg.com/@sakura12/oh-my-deepseekharness@0.7.2/README.md) · SHA-256 `9a20c3d3351524b1c31ba2f52773f0ac8142ab571719a651771dfec06481b0e9`

### @stardustlc/dsh-suite@0.11.4

- 来源 / Source: [stardustlc666/dsh-suite](https://github.com/STARDUSTLC666/dsh-suite)
- 中文：极简PTC组合把简短persona与完整工具/编排分开；只学习组合边界，不把18个组件的打包安装当作增强本身。
- English: The minimal PTC composition separates a short persona from full tools and orchestration; study composition boundaries, not installation of eighteen bundled components as an improvement by itself.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [ptc-minimal.patch.yml](https://unpkg.com/@stardustlc/dsh-suite@0.11.4/ptc-minimal.patch.yml) · SHA-256 `a7da8e1973f60a3b293465756ff674e50c8dd326354542ac9b5c6b11e14df076`

### @starsharryzhu/dsh-assistant@0.2.2

- 来源 / Source: [starsharryzhu/dsh-assistant](https://github.com/StarsHarryZhu/dsh-assistant)
- 中文：对话父代理和执行worker通过宿主服务分面管理；隐藏内部面不能用来凑用户可选预设数。
- English: Separate conversational parent and execution worker through a host service; hidden internal faces cannot inflate user-selectable preset counts.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@starsharryzhu/dsh-assistant@0.2.2/cordis.patch.yml) · SHA-256 `c807fea656d4ae3a42ceca375366da6c325fc1c168dbc22fd081e3677031c4d1`

### @starwish-ai/xingyuan-dsh@0.6.7

- 来源 / Source: [starwish-ai/xingyuan-dsh](https://github.com/starwish-ai/xingyuan-dsh)
- 中文：把承诺进度与待领取任务区分，并通过独立xingyuan服务与单独preset入口连接状态，避免助手替用户完成承诺决策。
- English: Distinguish committed progress from unclaimed tasks, using a dedicated xingyuan service and preset entry so the assistant does not make commitment decisions for the user.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@starwish-ai/xingyuan-dsh@0.6.7/cordis.patch.yml) · SHA-256 `1315afe65786b26d38754d1eae7284d69f36b7c519a738f58cb2563f2c35d161`

### @tomowang/dsh-tui@0.10.2

- 来源 / Source: [tomowang/dsh-tui](https://github.com/tomowang/dsh-tui)
- 中文：终端前端复用宿主会话事件，只转发当前会话的子事件；其四套builtin镜像不算新的研究预设配置。
- English: The terminal frontend reuses host session events and forwards child events only for its live session; its four builtin mirrors do not count as new research presets.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [presets/standard.patch.yml](https://unpkg.com/@tomowang/dsh-tui@0.10.2/presets/standard.patch.yml) · SHA-256 `601be447f96327c7a9ffced16ce237bb6ce156615ad1832f666589ef884b9659`

### @tr1v3r/dsh-proxy@0.2.6

- 来源 / Source: [tr1v3r/dsh-proxy](https://github.com/tr1v3r/dsh-proxy)
- 中文：代理开关由 loader/volatile-update 重新读取当前配置，状态查询用 connection.fetch.register 的独立 GET 接口；卸载时 restore 恢复原 dispatcher 与环境变量，而不是让进程级代理修改残留。
- English: Proxy switching rereads current configuration on loader/volatile-update, and status uses a separate GET endpoint through connection.fetch.register; disposal calls restore to reinstate the prior dispatcher and environment rather than leaving process-wide proxy changes behind.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@tr1v3r/dsh-proxy@0.2.6/lib/index.js) · SHA-256 `ba68ae87df72924f5b702f6a1f321a825123443a2a3d7a4b13903f4fb83d77c1`

### @trench-xinxin/dsh-tool-lens@2.0.5

- 来源 / Source: [trench-xinxin/dsh-tool-lens](https://github.com/trench-xinxin/dsh-tool-lens)
- 中文：代码图查询优先采用 exec.cwd，再回退 fs.root.displayPath、session.cwd 与进程目录；索引调用传入 exec.signal，缺少 slice 种子或 path 终点时返回明确缺参摘要，让根目录选择、取消和查询前提在适配层可见。
- English: Code-graph queries prefer exec.cwd before fs.root.displayPath, session.cwd and the process directory; indexing receives exec.signal, and missing slice seeds or path endpoints produce explicit missing-input summaries, exposing root selection, cancellation and query prerequisites in the adapter.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.mjs](https://unpkg.com/@trench-xinxin/dsh-tool-lens@2.0.5/lib/index.mjs) · SHA-256 `0fdb97c7894a3b7eb3544fd97954855745a32a263db935764a347718d3e4decd`

### @xmoon76/dsh-pi-tui@0.5.6

- 来源 / Source: [xmoon/dsh-pi-tui](https://github.com/XMoon/dsh-pi-tui)
- 中文：终端交互保留DSH模型、权限和Session运行时，并用projection注册性能面；生成的四套内置模式镜像不重复计数。
- English: Keep DSH models, permissions, and Session runtime beneath terminal interaction, adding performance through a projection; do not recount four generated builtin mirrors.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [generated/dsh-presets/standard.patch.yml](https://unpkg.com/@xmoon76/dsh-pi-tui@0.5.6/generated/dsh-presets/standard.patch.yml) · SHA-256 `3006cc3780cddaa7fb0089e5854e6bbef4409cf1d425930fd835226b95660afd`

### @yangdcm/dsh-expert-team@1.7.0

- 来源 / Source: [yangdcm/dsh-expert-team](https://github.com/yangdcm/dsh-expert-team)
- 中文：PM强制边界表、reviewer列规格沉默清单、QA每类边界至少一项负断言；这些是不同交付责任，不能把lint/build成功当运行正确。
- English: PM requires a boundary table, reviewers enumerate specification silence, and QA adds negative assertions per boundary family; these distinct duties prevent treating lint/build success as runtime correctness.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [presets/expert-team.patch.yml](https://unpkg.com/@yangdcm/dsh-expert-team@1.7.0/presets/expert-team.patch.yml) · SHA-256 `58608b31fae9d2b78555cccce20b75bbe6eb07ed46ce4b6131b8ad35b8f649dc`

### @yeastcloud/dsh-anchor@0.14.0

- 来源 / Source: [yeastcloud/dsh-anchor](https://github.com/yeastcloud/dsh-anchor)
- 中文：重锚钩子先等待下游 pre-step 的 enter 决定并检测已有自身消息，随后按会话历史决定首次注入或阈值重注入；超长文本只按长度变化告警，避免每步重复刷日志，也不重复插入同一条消息。
- English: Reanchoring first awaits the downstream pre-step enter decision and detects its own existing message, then uses session history to choose first injection or threshold reinjection; overlong text warns only when its size signature changes, avoiding repeated logs and duplicate injection.
- 风险 / Risk: CC-BY-NC-SA-4.0；研究注入机制不代表可直接复制到商业代码。 / CC-BY-NC-SA-4.0; studying the injection mechanism does not imply permission to copy it into commercial code.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/@yeastcloud/dsh-anchor@0.14.0/lib/index.js) · SHA-256 `9b21f8bea700e460483e61d0ce1b49f20d81a7e36238834386bb637db7df58a7`

### @yujp_vc/ppt-assistant@1.8.0

- 来源 / Source: [yujpvc/ppt-assistant](https://github.com/YujpVc/ppt-assistant)
- 中文：把演示文稿生成收敛为单独模式，保留既有权限而不重复请求提权；生成后做逐页渲染复核，不修改标准模式。
- English: Isolate presentation generation in its own mode, respect existing permissions without redundant escalation, and render/review slides without modifying standard mode.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@yujp_vc/ppt-assistant@1.8.0/cordis.patch.yml) · SHA-256 `82d223d6ea149bb5fa66f4613225124138102a05a0e643f85426261e50e02d67`

### @yxzpro/agent-acta@2.15.3

- 来源 / Source: [elegant01/agent-acta](https://github.com/elegant01/agent-acta)
- 中文：原生 Web 桥对非需改写响应直接转发数据块，让 SSE 不被整流缓冲；上游断流后若 headersSent 则只 end，避免二次写头把宿主带崩。CLI 服务消失时用共享 taking Promise 合并 hosted 接管请求，并返回 inject Promise 供宿主等待装配完成。
- English: The native web bridge forwards chunks directly for responses not requiring rewriting, avoiding whole-stream buffering of SSE. On upstream failure it only ends an already-headed response, avoiding duplicate-header exceptions. A shared taking Promise coalesces hosted takeover when the CLI service disappears, and the inject Promise is returned so the host can await assembly.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [plugin/plugin.mjs](https://unpkg.com/@yxzpro/agent-acta@2.15.3/plugin/plugin.mjs) · SHA-256 `857b27c8d51a1dbc453761b39f5770292f357e5cd9ef3de63be0ba6e11dd570c`

### @zt8989/dsh-agentmail@0.3.1

- 来源 / Source: [zt8989/dsh-agentmail](https://github.com/zt8989/dsh-agentmail)
- 中文：发信工具先等待本地绑定账本加载，再把 session/thread 标记补进主题；列表只返回紧凑邮件行，正文另用 message_id 读取，让会话归属与正文取用成为两个显式契约。
- English: The send tool waits for the local binding ledger before adding a session/thread marker to the subject; listing returns compact mail rows and bodies require a separate message_id read, making conversation ownership and body retrieval explicit contracts.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dist/index.js](https://unpkg.com/@zt8989/dsh-agentmail@0.3.1/dist/index.js) · SHA-256 `842f147883076a820bd060f8ba64fab6c5aec6f0fd9fb4cc99243606755fe0ff`

### clearai-dsh@0.6.0

- 来源 / Source: [clearailhc/clearai-dsh](https://github.com/Clearailhc/clearai-dsh)
- 中文：探索结果与独立评估分开，拒绝最终交付也可保留有独立证据支持的局部结论；宿主fiber失活要显式退回空态。
- English: Separate exploration from independent evaluation so rejected delivery can retain supported local claims; explicitly fall back to an empty state when the host fiber deactivates.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [presets/clearai/clearai.patch.yml](https://unpkg.com/clearai-dsh@0.6.0/presets/clearai/clearai.patch.yml) · SHA-256 `af6aa0bca9a10c59c8ce5c2a57b1a0cd1745c5a461a0f2abc0f24a96695c9056`

### dsh-acp-enhanced@0.11.2

- 来源 / Source: [grunmin/dsh-acp-enhanced](https://github.com/grunmin/dsh-acp-enhanced)
- 中文：ACP桥只消费自己持有Session的事件，防止跨会话流串线；其standard/PTC/minimal/cordis是内置模式镜像，不重复计数。
- English: The ACP bridge consumes events only for its owned Session, preventing cross-session stream leakage; its standard/PTC/minimal/cordis are builtin mirrors, not additional presets.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-acp-enhanced@0.11.2/cordis.patch.yml) · SHA-256 `85915f472d6474704ad5c74891d1bc75a860b422d5086f903d3b3d4a54f650ca`

### dsh-agent-bench@0.1.1

- 来源 / Source: [songrui111/dsh-agent-bench](https://github.com/songrui111/dsh-agent-bench)
- 中文：bench_suites 返回 source、root 及逐套件 cases/assertions 数，渲染区明确区分 bundled 起始套件与工作区套件，并引导另用 bench_init 做复制。发现测试材料和写入初始化分成不同工具，能减少把“看到内置用例”误说成“用户工程已有这些测试”。
- English: bench_suites returns source, root, and per-suite case/assertion counts; rendering distinguishes bundled starter material from workspace suites and directs copying through bench_init. Separating discovery from initialization reduces claims that merely visible bundled cases already exist in the user's project.
- 风险 / Risk: 本次只核验目录发现/初始化工具契约，未运行基准，也未核验 README 所称沙箱路径限制。 / Only discovery/initialization contracts were inspected; no benchmark ran, and README claims about sandbox path restrictions were not verified.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-bench@0.1.1/lib/index.js) · SHA-256 `50ad2406f8c8edbd083dcab7a77687f6e5e8f1d03d5fb90579f031c9978a33d3`

### dsh-agent-canvas@0.1.0

- 来源 / Source: [lhy723/dsh-agent-canvas](https://github.com/Lhy723/dsh-agent-canvas)
- 中文：画布入口通过 conversation.view 槽注册，并在 inject(sessionId) 中把刷新操作绑定到 ctx.sessions.refreshSubagents(sessionId)；本地化注册的释放交给 effect。可借鉴的是会话定向刷新与槽位装配，不是已证明图中的任务关系完整准确。
- English: The canvas registers in conversation.view and binds refresh to ctx.sessions.refreshSubagents(sessionId) through inject(sessionId); an effect owns locale registration cleanup. The observable lesson is session-targeted refresh and slot composition, not proven completeness or accuracy of the task graph.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/client.js](https://unpkg.com/dsh-agent-canvas@0.1.0/lib/client.js) · SHA-256 `82d4e343f0fc58b9ca8aa38088d70698f4758c3185a3f55423220057263ef151`

### dsh-agent-compare@2.0.0

- 来源 / Source: [lijiaqi-ai-product-manager/dsh-agent-compare](https://github.com/lijiaqi-AI-Product-Manager/dsh-agent-compare)
- 中文：比较入口优先使用 agents.create，退回 shared-root 子代理时明确记录“只检测逃逸、不阻止逃逸”；同时拒绝 delegated agent 再发起比较，并给 comparer 注册卸载清理。能力降级必须报告隔离语义变化，不能只报工具仍可调用。
- English: The comparison entry prefers agents.create, explicitly warns that shared-root fallback detects rather than prevents escapes, rejects comparison starts from delegated agents, and registers comparer disposal. A fallback must report changed isolation semantics, not merely continued tool availability.
- 风险 / Risk: 只读了入口和相关装配片段，未验证隔离执行器、检查器或候选文件采用流程。 / Only entry and related assembly fragments were read; isolated runners, checks, and candidate adoption were not verified.
- 片段 / Fragment: [lib/host/index.js](https://unpkg.com/dsh-agent-compare@2.0.0/lib/host/index.js) · SHA-256 `15f084461e79e8e27a5f3d11e14afdd47ae759650127f411d449fbf2a5ae254f`

### dsh-agent-conductor@0.4.0

- 来源 / Source: [mjorgin/dsh-agent-conductor](https://github.com/MJorgin/dsh-agent-conductor)
- 中文：CLI 派发把 child.done、调用取消和十分钟超时做竞速，取消/异常路径调用 terminate，finally 清除计时器和 abort 监听；面板取消另以 cancelRequested 区分，避免当作正常退出。Web 面板经可选 webServer 注入，不应让纯 CLI 部署因缺面板服务而失去工具。
- English: CLI dispatch races child.done against cancellation and a ten-minute timeout, calls terminate on cancellation/errors, and clears timers and abort listeners in finally; cancelRequested distinguishes panel cancellation from ordinary exit. Optional webServer injection keeps a missing panel service from disabling CLI-only tooling.
- 风险 / Risk: 未运行外部 CLI，也未核验 terminate 对各平台进程树的实际效果。 / No external CLI was run, and platform-specific process-tree termination was not verified.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-agent-conductor@0.4.0/index.js) · SHA-256 `9f1964427f364ca189877fcb2f351a21c43445e43157044d44634471776ae8ed`

### dsh-agent-frugality@0.1.5

- 来源 / Source: [gongyijie85/dsh-agent-frugality](https://github.com/gongyijie85/dsh-agent-frugality)
- 中文：可选去重替换在 tools/post-execute 对原始正文取哈希、预记账，并用 rootCallId/token 标记让后续 tools/result 跳过重复记账；这避免把替换后的摘要当原文污染内容索引。
- English: Optional dedup replacement hashes and records the original body in tools/post-execute, then marks rootCallId/token so tools/result skips a second entry; this avoids polluting the content index with the replacement summary.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-frugality@0.1.5/lib/index.js) · SHA-256 `55bbcb017a94f2a0303717c552544765ebaed71c158e9d7789a597f8ef58efd3`

### dsh-agent-picker@0.6.2

- 来源 / Source: [ok541151/cwk](https://github.com/Ok541151/cwk)
- 中文：名册驱动的外部执行器在注册工具前检查 launch 配方引用的脚本是否存在，并跳过已被其他插件占用的工具名；工具说明统一 prompt/description 参数且明确外部 Agent 看不到当前上下文。
- English: Roster-driven external executors check scripts referenced by launch recipes before tool registration and skip names already owned by other plugins; descriptions standardize prompt/description arguments and explicitly state that the external Agent cannot see the current context.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-picker@0.6.2/lib/index.js) · SHA-256 `b968b97548e4335f77783bc94007907eb21698a4f8a34faa57f8697f0db0461c`

### dsh-agent-relay@0.5.0

- 来源 / Source: [noelune/dsh-agent-relay](https://github.com/Noelune/dsh-agent-relay)
- 中文：中继先异步解析宿主凭据，再建立客户端与收件轮询；状态路由限制回环地址及 GET，并返回 no-store。工具指导明确把对端消息视为不可信输入，卸载路径集中停止轮询、清理会话句柄和自启 broker，值得区分消息可达性与指令权威。
- English: The relay resolves host credentials asynchronously before creating its client and inbox polling; its status route restricts callers to loopback and GET with no-store responses. Tool guidance treats peer messages as untrusted input, while teardown stops polling, disposes session handles, and stops an owned broker: message reachability is not instruction authority.
- 风险 / Risk: 未审计 HMAC 协议实现或异步初始化与卸载之间的全部竞态，不能从状态路由推断整套中继安全。 / HMAC implementation and all initialization/disposal races were not audited; the status route does not establish relay-wide security.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-relay@0.5.0/lib/index.js) · SHA-256 `2941acd9a25c5a7b16cdc606fc4bd469e56ecd07b3881676c729fe4fea91546f`

### dsh-agent-studio@0.2.1

- 来源 / Source: [thissensen/dsh-agent-studio](https://github.com/thissensen/dsh-agent-studio)
- 中文：设置、预设注册表与 Web 路由分别注入，路由通过 getScope/getRegistry 等取值函数读取当下状态，避免依赖回调先后顺序；settings/document-updated 先按命名空间过滤再触发 sync。生效、派活、降级三层分别捕错，使某层挂载失败不吞掉配置入口。
- English: Settings, preset registry, and web routes are injected separately; getters such as getScope/getRegistry retrieve current state without assuming callback order. settings/document-updated filters its namespace before syncing. Apply, delegation, and fallback mounting catch failures independently so one failed layer does not remove configuration access.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-studio@0.2.1/lib/index.js) · SHA-256 `80b1e747784ce0c33299f7e139db86d9f99968ac24113f35bfeed390be14bd32`

### dsh-agent-team-presets@0.1.9

- 来源 / Source: [bloodarea/dsh-agent-team-presets](https://github.com/bloodarea/dsh-agent-team-presets)
- 中文：成员 provider 别名的对账先拒绝空配置、自指别名和不支持 prepareContinuable 的上游；监听 provider 增删后才首次扫描，并用 reconciling 守卫阻止自身注册事件递归触发。卸载释放监听和别名，适合学习动态注册表的身份与重入边界。
- English: Member-provider reconciliation rejects empty configuration, self-referential aliases, and upstream providers lacking prepareContinuable. It subscribes before the first scan and uses a reconciling guard against events emitted by its own registrations. Disposal releases listeners and aliases, illustrating identity and reentrancy boundaries for dynamic registries.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-team-presets@0.1.9/lib/index.js) · SHA-256 `cd4dd8afbcc256d02287bf7e385e8a12c435e941366f891f8c8c8bdfe19f847d`

### dsh-agent-team-roles@0.2.1

- 来源 / Source: [starspacepx/dsh-agent-team-roles](https://github.com/StarSpacePX/dsh-agent-team-roles)
- 中文：入口在门控配置分支只挂角色作用域的 gate 后立即返回，不碰角色仓库；gate 从已注册 schemas 收集工具名，以 MCP 前缀或精确工具名构造 deny，再把 restrict 的释放函数交给 effect。缺少 schemas/restrict 时明确告警，而非宣称开关已经生效。
- English: The entry's gate-config branch mounts only a role-scoped gate and returns without touching the role store. Gates collect registered schema names, build deny lists by MCP prefix or exact tool name, and dispose restrictions through effects. Missing schemas/restrict methods produce explicit warnings rather than a claim that toggles took effect.
- 风险 / Risk: 所读 gate 只解析挂载时可见的工具；未核验后续新增工具、其他执行路径或权限隔离的完整覆盖。 / The inspected gate resolves tools visible at mounting time; later additions, alternate execution paths, and complete permission isolation were not verified.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-team-roles@0.2.1/lib/index.js) · SHA-256 `b9777810e5837b295184fabb197c61fd73dcf84b92a4a520c6609e54d649fef8`

### dsh-agent-team-workflow@0.2.1-rc.2

- 来源 / Source: [huacompj/dsh-workflow-plugin](https://github.com/huaComPj/dsh-workflow-plugin)
- 中文：子代理 start/end 以 runId 标识同一会话的不同运行世代；继承工作区仅记为 probe，必须再从工作单取得参与身份。终态监听先记引用，再用 setImmediate 在 append 回调外结算引擎，不通过父会话的自然语言通知猜完成。
- English: Subagent start/end handling uses runId to distinguish generations within one session. Inherited workspace location is merely a probe until work-order evidence establishes participation. End handling records a reference and settles the engine with setImmediate outside the append callback instead of inferring completion from natural-language parent notices.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-agent-team-workflow@0.2.1-rc.2/lib/index.js) · SHA-256 `920dacfef9f412052afb74cc0170ae76631b1eda9c386447601893b98a32a228`

### dsh-aiyayi@1.5.20

- 来源 / Source: [bayihy/dsh-aiyayi](https://github.com/bayihy/dsh-aiyayi)
- 中文：伙伴人格、执行者和只读检索员分别有不同工具面；核心记忆常驻、分类档案按需读取，摘录员必须保留数字/页码而不替派发者下结论。
- English: Companion, executor, and read-only retriever have distinct tool surfaces; keep core memory resident and load archives on demand, requiring exact numbers/pages in extracts without delegating conclusions to the retriever.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-aiyayi@1.5.20/cordis.patch.yml) · SHA-256 `bd7aae4c538e9447e7921f891b80d2c642472930126ff4c099a18934c6b68ca3`

### dsh-aosp@0.2.0

- 来源 / Source: [verchiel666/dsh-aosp](https://github.com/Verchiel666/dsh-aosp)
- 中文：工具注册遇已有同名定义时跳过，并收集成功注册的 disposer 随 effect 释放；aosp_fetch/update/preset 的 pre-execute 先 await 下游，仅将 allow 升为 ask，不覆盖既有 deny。只读按行工具与数百 MB 下载写盘应分别说明风险，而不是共用一个“搜索源码”标签。
- English: Registration skips existing tool names and collects successful disposers for effect-owned cleanup. The pre-execute hook for aosp_fetch/update/preset awaits downstream decisions and upgrades only allow to ask without overriding deny. Line reads and potentially hundreds-of-megabytes downloads need distinct risk descriptions rather than one generic source-search label.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.mjs](https://unpkg.com/dsh-aosp@0.2.0/index.mjs) · SHA-256 `7d56e665d4f815572bfa8b3ee0b4afb0f4dbac476c9aaf060c203cac74305d9c`

### dsh-api-probe@1.0.1

- 来源 / Source: [lfy-bot/dsh-api-probe](https://github.com/LFY-bot/dsh-api-probe)
- 中文：探测路由先做 paired/loopback 门控、POST 检查和 JSON 校验，再以 NDJSON 逐行发事件，最终 result 自带完整结果；健康路由另限 GET。路由列表在 makeRoutes(ctx) 内创建以捕获正确作用域，不能只测核心探测函数而漏掉真实请求时的 ctx 引用。
- English: The probe route checks paired/loopback access, POST, and JSON before emitting NDJSON events; the final result contains the full outcome. Health is a separate GET route. makeRoutes(ctx) constructs handlers in the correct scope, highlighting why core-function tests alone miss request-time ctx-reference failures.
- 风险 / Risk: 客户端 close 片段只设 closed 抑制后续输出，不能据此宣称网络探测已被取消；未发起实际探测。 / The client-close fragment only sets closed to suppress output; it does not establish cancellation of network probing. No actual probe was sent.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-api-probe@1.0.1/lib/index.js) · SHA-256 `cbcc9d1e63ed345c96b8eb85d089f375c9e8f6ef323fd05685bdcaeaa5a02247`

### dsh-atelier-plugin@1.7.0

- 来源 / Source: [forcemind/dsh-atelier](https://github.com/ForceMind/dsh-atelier)
- 中文：请求记录明写采集层是适配器前后归一化数据而非 HTTP 原始线；先对记录副本 redact，再入库并记录摘要字节数，保留期/容量清理跳过 active 请求。统计使用独立版本化 session projections，日志采集层次与 UI 数字的证据含义应明确分开。
- English: Request records explicitly label capture as normalized data before/after adapters, not raw HTTP wire traffic. Copies are redacted before storage with summary byte metadata; age/capacity pruning skips active requests. Statistics use separate versioned session projections, keeping capture-layer evidence distinct from UI metrics.
- 风险 / Risk: 只见 redact 调用，未审计脱敏规则完整性；不能据此保证请求日志绝无秘密。 / The redact call was observed but its complete rules were not audited; secret-free logs are not established.
- 片段 / Fragment: [host.js](https://unpkg.com/dsh-atelier-plugin@1.7.0/host.js) · SHA-256 `5048ab214f631b3f153adff2870023e9924727ec04f24cc8fca13c01f6ea0d88`

### dsh-atn@0.6.3

- 来源 / Source: [ff66ccff/dsh-atn](https://github.com/ff66ccff/dsh-ATN)
- 中文：用atn_start显式建立共享目标和网络/节点/任务身份，并把协作限制在独立预算内；README的企业安全效果仍须另行验证。
- English: Use atn_start to establish a shared objective and network/node/task identities, keeping collaboration within independent budgets; enterprise security claims still require separate verification.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-atn@0.6.3/cordis.patch.yml) · SHA-256 `7da1ff9d0769aa844117e5eaf9bb0d26674f13bbcb0e5efeee5fff3eea9a829d`

### dsh-auto-handoff@0.2.0

- 来源 / Source: [qingyou002/dsh-auto-handoff](https://github.com/qingyou002/dsh-auto-handoff)
- 中文：交接只在 agent/pre-step 拒绝下一步；人类新消息到达时，若新会话尚未创建就取消迁移并放行原会话，若已创建则尝试转投，失败仍释放锁回原会话，避免同一消息两处执行或被陈旧锁卡住。
- English: Handoff rejects only the next step through agent/pre-step; a new human message cancels migration and continues in the original session before a replacement exists, or is forwarded afterward, with failed forwarding releasing the latch and falling back to the original, avoiding duplicate execution and stale-lock blockage.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-auto-handoff@0.2.0/lib/index.js) · SHA-256 `28e20f8c1dd668a6f25338dfa83a6ca8d4c909950e932e77b1ff81c487cabe0e`

### dsh-awesome-preset@2.5.0

- 来源 / Source: [jaylor-wang/dsh-awesome-preset](https://github.com/Jaylor-Wang/dsh-awesome-preset)
- 中文：日常编码面主动移除目标、计划、子代理和TODO，减少编排开销；同时保留不可逆发布操作必须核对远端事实的边界。
- English: Remove goals, planning, workers and TODO from routine coding to reduce orchestration overhead, while retaining read-only remote verification for irreversible publishing operations.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-awesome-preset@2.5.0/cordis.patch.yml) · SHA-256 `eba5ecab30c167a0bc284df2e985c47209d45c845837b636aace3e23d18c126c`

### dsh-background-agents@0.10.3

- 来源 / Source: [perrylink/dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)
- 中文：启动后台子代理先核验 provider 支持 prepareContinuable，再按父代理串行通过 startGates 检查数量上限；finally 释放启动闸，成功返回稳定 agentId/messageId。bg_message 的契约明确仅确认投递、不返回答案，避免把发信回执误作任务完成。
- English: Background-child startup checks prepareContinuable support, then serializes admission per parent with startGates before checking the count limit; finally releases the gate, and success returns stable agentId/messageId values. bg_message explicitly acknowledges delivery rather than returning an answer, preventing receipt/completion confusion.
- 风险 / Risk: README 已标退休并推荐宿主原生 continuable subagents；仅作历史契约参考，不建议重装替代原生能力。 / The README marks this retired in favor of native continuable subagents; it is historical contract evidence, not a recommendation to replace native capabilities.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-background-agents@0.10.3/lib/index.js) · SHA-256 `4b5e81103a9753b2fd26f8b4bb264db64af500b1f00adcdd6bbfe2a0afb25d58`

### dsh-block-ptc@0.5.0

- 来源 / Source: [mengwex/dsh-block-ptc](https://github.com/mengwEX/dsh-block-ptc)
- 中文：按工具结果、PTC派发和压缩事件安排上下文整理，scheduled集合防同会话重复调度；信息保留应围绕后续执行所需而不只看固定阈值。
- English: Schedule context organization from tool/PTC/compaction events with per-session deduplication; retain information based on future execution needs rather than a fixed threshold alone.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-block-ptc@0.5.0/cordis.patch.yml) · SHA-256 `dacf32ab4780b1e4a240ebd77ef15ea03aaf20c8d3d2f66b1ae7a4c5e95d835e`

### dsh-blue-team-mode@1.3.1

- 来源 / Source: [fgcgdroid/blue](https://github.com/FGCGDroid/blue)
- 中文：防守指挥台把事实库、任务队列和授权范围分开约束；外部日志/样本作为不可信数据，改配置前记录回滚值。七个明确不要手选的worker不计独立用户预设。
- English: Separate the defensive fact store, queue and authorized scope; treat logs/samples as untrusted data and record rollback values before configuration changes. Seven explicitly non-manual workers are not counted as user presets.
- 风险 / Risk: 仅限授权防守研究；不是EDR或真实安全效果证明。 / Authorized defensive study only; not an EDR or proof of security effectiveness.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-blue-team-mode@1.3.1/cordis.patch.yml) · SHA-256 `3d076e03e29e519a0d907379e845de93109030540c5b9725ae17b523611a501f`

### dsh-clarify-mode@0.1.1

- 来源 / Source: [xiaofeng-bm/dsh-clarify-mode](https://github.com/xiaofeng-bm/dsh-clarify-mode)
- 中文：澄清开关写入会话事件并由 projection 读回；prompt 组装先 await next，再仅对 active 会话过滤配置中的隐藏工具。策略段设置 interpolate:false，轮次硬顶文案会要求列出未问项；可学习状态驱动的工具目录裁剪，不应把它称为所有执行通路的写入安全边界。
- English: The clarification toggle is recorded as a session event and read through a projection. Prompt assembly awaits next, then filters configured hidden tools only for active sessions. Policy sections disable interpolation, and the hard-round-limit text requires reporting unasked items. This illustrates state-driven catalog reduction, not a write-security boundary across every execution path.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-clarify-mode@0.1.1/index.js) · SHA-256 `935da9e190f3d0525da548f26fb275dab6e25b74ab416052e7f9c34d30c57650`

### dsh-claude-code-delegate@1.2.0

- 来源 / Source: [lidaqi001/dsh-claude-code-delegate](https://github.com/lidaqi001/dsh-claude-code-delegate)
- 中文：窄调度器只交自包含任务给不可恢复的外部子代理，区分返回任务id与真正完成通知，等待期间不得重复派单。
- English: A narrow dispatcher sends self-contained tasks to non-resumable external workers, distinguishing job IDs from completion notices and preventing duplicate dispatch while waiting.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-claude-code-delegate@1.2.0/cordis.patch.yml) · SHA-256 `1d4abbcf35f3aed63e98754d62b503fa83a006b4cfbeaca42b4e58125448eb71`

### dsh-clean-agent@0.2.1

- 来源 / Source: [c1ement314/dsh-clean-agent](https://github.com/C1ement314/dsh-clean-agent)
- 中文：清理先只读发现、分风险等级、出manifest，再按明确确认删除；优先回收站，不能把检查或模糊同意当删除授权。
- English: Discover read-only, tier risks, and present a manifest before explicitly approved deletion; prefer trash and never treat checks or vague assent as deletion authorization.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-clean-agent@0.2.1/cordis.patch.yml) · SHA-256 `874decf512d0e510994421c99032b333ea76691e61d9b8adc9cda4c51684ffe6`

### dsh-code-rag-index-panel@1.4.1

- 来源 / Source: [ankali-aylina/code-rag](https://github.com/Ankali-Aylina/code-rag)
- 中文：这不是仅配置 MCP：原生 Host 注册 diag/config/action 三条路由并集中回收；action 限 index/rebuild/cancel/setup，取消转发独立 POST /api/cancel，索引服务缺席返回 SERVER_DOWN。设置命名空间是可选 schema 层，注册失败不影响已有索引条路径。
- English: This is not merely MCP configuration: a native host registers diag/config/action routes with centralized disposal. action accepts only index/rebuild/cancel/setup, forwards cancellation to a distinct POST /api/cancel, and returns SERVER_DOWN when indexing is unavailable. The settings namespace is an optional schema layer whose failure does not remove the existing index-bar path.
- 风险 / Risk: 实际检索依赖伴随 MCP 服务；未运行 setup、索引或取消，也未核验路由 guard 的完整授权逻辑。 / Retrieval depends on a companion MCP service. Setup, indexing, and cancellation were not run, and complete route-guard authorization was not verified.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-code-rag-index-panel@1.4.1/lib/index.js) · SHA-256 `fc6b0d4668e7f98acb3b42bdcf120937e3dcdd16508e3f4ec310e6a83fe124c7`

### dsh-codex-claude-pipeline@1.0.1

- 来源 / Source: [lidaqi001/dsh-codex-claude-pipeline](https://github.com/lidaqi001/dsh-codex-claude-pipeline)
- 中文：把只读规划与写入实施分别交给不同provider；只分析请求不强派执行，用户明确不要规划时允许直接实施通道。
- English: Assign read-only planning and implementation to different providers; do not force execution for analysis-only requests, and allow an explicit user request to skip planning.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-codex-claude-pipeline@1.0.1/cordis.patch.yml) · SHA-256 `b67c5eb65f56943625fd52112293289a6a50eb0143dd0e63a817170757a43041`

### dsh-codex-delegate@1.0.2

- 来源 / Source: [lidaqi001/dsh-codex-delegate](https://github.com/lidaqi001/dsh-codex-delegate)
- 中文：专用provider及作用域同名遮蔽限制唯一执行工具，任务书提前补足范围/禁改项/验收，避免子代理不能追问时靠猜。
- English: Use a dedicated provider and scoped shadowing to constrain the execution surface, supplying scope, prohibitions and acceptance up front when workers cannot ask follow-ups.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-codex-delegate@1.0.2/cordis.patch.yml) · SHA-256 `82836883b9286415f1d1598e70bf33eaf1502cbff5d91504929fd2fa61ce14a8`

### dsh-comfyui-control@0.1.5

- 来源 / Source: [xingxue-ux/dsh-comfyui-control](https://github.com/xingxue-ux/dsh-comfyUI-control)
- 中文：把专属绘图工具严格留在drawing预设，先状态自检与查规范tag再让用户确认提示词，不给通用模式平添工具噪声。
- English: Keep drawing tools inside the drawing preset, checking environment and canonical tags before confirming prompts, instead of adding tool noise to general modes.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-comfyui-control@0.1.5/cordis.patch.yml) · SHA-256 `ed7b99ebe78b3ba311fd9fbb0e738bc6a2060eafe66a2ead4bc004f694b2303a`

### dsh-complex-project-preset@1.0.1

- 来源 / Source: [sueqet/dsh-complex-project-preset](https://github.com/sueqet/dsh-complex-project-preset)
- 中文：纯声明式组合降低升级面；文档描述当前事实，不把未经确认的实现偏差写成业务规则，提交推送仍需明确指示。
- English: A configuration-only composition narrows upgrade exposure; document current facts without turning unapproved implementation drift into business policy, keeping commits/pushes explicitly authorized.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-complex-project-preset@1.0.1/cordis.patch.yml) · SHA-256 `e6c5acb73ca65571d9b7db6462c08de620855a43879997e4c917b0907522673e`

### dsh-context-window@0.1.0

- 来源 / Source: [xt765/dsh-context-window](https://github.com/xt765/dsh-context-window)
- 中文：模型选择事件和 volatile 更新都会重新查询 resolveModelInfo，但仅给已有 requestContext 的会话追加变化后的 request/context，并保留 systemPromptUpdate；卸载统一释放两个监听。显示容量应来自宿主解析的模型事实，不能只改前端百分比分母就称请求一定可执行。
- English: Model-selection events and volatile updates re-query resolveModelInfo, append changed request/context only to sessions with an existing requestContext, and preserve systemPromptUpdate. Teardown removes both listeners. Displayed capacity should derive from host-resolved model facts; changing a percentage denominator does not establish that requests will execute.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-context-window@0.1.0/lib/index.js) · SHA-256 `db94dddd04c386a478c14c58fe31032cd8b4a64efbf11af982133bcda82837b0`

### dsh-crew@0.13.0

- 来源 / Source: [stuarthu/dsh-crew](https://github.com/stuarthu/dsh-crew)
- 中文：Git 护栏用 session.header.parentSession 而非 exec.parent 判断根代理，避免把 Code Mode 嵌套调用身份混淆；审批文件在 push 执行前消耗，减少崩溃后重复授权。挂载时拒绝目录形 approvalFile，防止护错名称。
- English: The Git guard identifies root agents using session.header.parentSession rather than exec.parent, avoiding confusion with nested Code Mode calls. It consumes the approval file before push execution to reduce authorization reuse after crashes and rejects directory-shaped approvalFile settings at mount time.
- 风险 / Risk: 实现明确只检查 shell 工具，write/edit 仍可触及审批文件；根代理默认绕过部分检查。不是不可绕过的发布权限系统。 / The implementation explicitly checks shell tools only; write/edit can still touch the approval file, and the root agent bypasses some checks by default. This is not an unbypassable publication authorization system.
- 片段 / Fragment: [host/git-guard.js](https://unpkg.com/dsh-crew@0.13.0/host/git-guard.js) · SHA-256 `286fbb7726c551a81f827ddb1834f46d3d6011628f79b517a0e52d6b5ca5b796`

### dsh-custom-subagents@0.1.5

- 来源 / Source: [ktdhhc/dsh-custom-subagents](https://github.com/ktdhhc/dsh-custom-subagents)
- 中文：缺失内置定义的播种每次重新读取持久设置，只追加缺项，并带 revision 调用 settings.update；仅 SETTINGS_CONFLICT 重试，最多三次，其他错误继续抛出。定义目录作为 subagentDefinitions 服务提供，关闭函数交给 effect，而非用模块全局缓存替代持久设置。
- English: Seeding missing built-in definitions re-reads persisted settings each attempt, appends only missing entries, and passes the revision to settings.update. Only SETTINGS_CONFLICT is retried, up to three times; other failures propagate. The catalog is provided as subagentDefinitions with effect-owned closure rather than replacing persisted settings with a module-global cache.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-custom-subagents@0.1.5/lib/index.js) · SHA-256 `4c629413fee0fbf19b1123b0d06660cf562e883fc14778b5604b1b1876295441`

### dsh-deep-ptc-mode@1.8.8

- 来源 / Source: [lishize20040802-rgb/dsh-deep-ptc-mode](https://github.com/lishize20040802-rgb/dsh-deep-ptc-mode)
- 中文：工具发现与隔离层放在需要 tools/systemPrompt/commands/sessionProjections 的子 fiber，失败时告警而保留官方 PTC 工具。目录 load 限 1–6 个精确名、预算 16000 字节，分别返回 loaded/unavailable/deferred，并明确不执行工具；发现定义与执行业务应是两种契约。
- English: Tool discovery/quarantine runs in a child fiber requiring tools/systemPrompt/commands/sessionProjections; failure warns while retaining official PTC tools. Directory load accepts 1–6 exact names within a 16,000-byte budget, distinguishes loaded/unavailable/deferred, and explicitly executes no tools. Discovering definitions and performing business operations are separate contracts.
- 风险 / Risk: 未运行隔离判据或核验所有 preset 装配分支；fail-open 是此辅助层的降级选择，不是安全隔离保证。 / Quarantine criteria and all preset assembly branches were not exercised; fail-open is an auxiliary-layer fallback, not a security-isolation guarantee.
- 片段 / Fragment: [lib/tool-compatibility.mjs](https://unpkg.com/dsh-deep-ptc-mode@1.8.8/lib/tool-compatibility.mjs) · SHA-256 `3332971b954889e834818055004cc5fa7d36af20715bf0fd6e2c78412f6f18ad`

### dsh-draw-mode@2.0.1

- 来源 / Source: [suyunxing/dsh-draw-mode](https://github.com/suyunxing/dsh-draw-mode)
- 中文：绘图能力来自用户导出的API工作流，先发现实际模型/slots再选提示词与参数；区分改图、反推与纯问答，反推后等待用户确认，失败重跑有上限。
- English: Drawing capability comes from user-exported API workflows: discover actual models/slots before choosing prompts and parameters; distinguish edits, reverse prompting and questions, require confirmation after reversal, and bound retries.
- 风险 / Risk: 工具是宿主全局，非预设内隔离；可选自动启停可能启动或终止进程，idleShutdownScope:port范围更宽。默认关闭不等于无需权限审计；未生成图片或调用ComfyUI。 / Tools are host-wide, not preset-isolated. Optional auto-start/shutdown can launch/terminate processes, with broader idleShutdownScope:port. Disabled defaults do not replace permission audits; no image generation or ComfyUI call occurred.
- 片段 / Fragment: [package.json](https://unpkg.com/dsh-draw-mode@2.0.1/package.json) · SHA-256 `2d99b153ac540e2e9c8f227b2470c86c5fc9a684226b3debbb23f79df26624f4`

### dsh-enter-plan-mode@1.0.3

- 来源 / Source: [feng-yifan/dsh-plugins](https://github.com/feng-yifan/dsh-plugins)
- 中文：进入计划模式工具在调用时优先用 agentPresets.serviceFor(agent, 'planMode') 解析预设隔离服务，再退回 agent 与插件上下文，并校验 get/set 方法；不要把根上下文未找到服务误当成能力不存在。
- English: The enter-plan tool first resolves the isolated preset service with agentPresets.serviceFor(agent, 'planMode') at call time, then falls back to agent and plugin contexts and validates get/set methods; failure to find a service at the root need not mean the capability is absent.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-enter-plan-mode@1.0.3/lib/index.js) · SHA-256 `bd09a6cf8508d880cb16ed33f8eb2085e8c485929e72bc82ffb8a6ea96c008e1`

### dsh-eteams@0.2.22

- 来源 / Source: [2507483326/dsh-eteams](https://github.com/2507483326/dsh-eteams)
- 中文：中断观察先把 sessionId 解析为成员小任务或领队锚定大任务，未绑定会话直接忽略；session/event 监听分别调用成员暂停和领队中断处理，并捕获同步与异步失败。中断处置应依赖真实会话映射，不能把任何会话停止都广播成整个团队失败。
- English: Interruption observation maps sessionId to either a member subtask or the captain's anchored task and ignores unbound sessions. The session/event listener calls distinct member-pause and captain-interruption handlers and catches synchronous and asynchronous failures. Interruption scope should follow real session bindings, not broadcast every stopped session as team-wide failure.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-eteams@0.2.22/lib/index.js) · SHA-256 `671e6c06a481d57eb2829a697321b8f2d2dffcd66eb3c3f0f20d88b8be4e023d`

### dsh-evolve-preset@0.2.0

- 来源 / Source: [taoziliyouchong/dsh-evolve-preset](https://github.com/taoziliyouchong/dsh-evolve-preset)
- 中文：将目标/基本点/硬软需求与任务树挂钩，按任务类别读画像而非灌入全部；UI对齐栏样式与正文分离。
- English: Bind goals, principles and hard/soft requirements to a task tree, load profiles by task category, and style alignment metadata separately from answer content.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-evolve-preset@0.2.0/cordis.patch.yml) · SHA-256 `da78691665ddb5e4426fbd4ff1508ed717e7ef8ffb044268d1ce6b98fa9edd73`

### dsh-expert-orchestrator@2.13.9

- 来源 / Source: [mario841859784/dsh-expert-orchestrator](https://github.com/mario841859784/dsh-expert-orchestrator)
- 中文：按大型实施、小型实施、只读分诊，避免每次继续或追问都重开完整流程；用户纠正立即作废旧任务书，门禁按风险分级。
- English: Triage large implementation, small implementation and read-only work instead of restarting the whole workflow on follow-ups; invalidate briefs on user correction and grade gates by risk.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-expert-orchestrator@2.13.9/cordis.patch.yml) · SHA-256 `9a80e6c726e333486dd13d294c390d238a0a6a418b8d4be71e643657d996b39b`

### dsh-foxy@0.3.7

- 来源 / Source: [kun-fox/dsh-foxy](https://github.com/Kun-Fox/dsh-foxy)
- 中文：人格投影为原生会话prompt，记忆/平台作为可选独立子插件；配置面板不是另一套聊天运行时。
- English: Project the persona into native session prompts while keeping memory/platform adapters optional; a configuration panel need not become another chat runtime.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-foxy@0.3.7/cordis.patch.yml) · SHA-256 `341ced789a2c09c08baad7147dce13adaa43a2041984ed43a2428f4e61007752`

### dsh-game-studio-presets@1.0.0

- 来源 / Source: [highho/dsh-game-studio-presets](https://github.com/highho/dsh-game-studio-presets)
- 中文：按工作阶段而非48个岗位压缩为情景模式：概念砍范围、GDD写边界/参数/验收、实现留测证、QA列未覆盖、发布列可执行回滚；十个用户面是真正不同的交付契约，仍只有一个项目。
- English: Organize scenarios by production stage rather than 48 job titles: constrain concepts, define GDD boundaries/parameters/acceptance, retain implementation tests, report QA gaps, and require executable release rollback. Ten user-facing contracts remain one project.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://raw.githubusercontent.com/highho/dsh-game-studio-presets/79a0fc04959d1a5af2a3c17258d104896a6109a8/cordis.patch.yml) · SHA-256 `b458d6b73dd5ec628ac8f59421febbd98f8f3238ff65f0e86e85556faf8cc03a`

### dsh-lead-mode@0.2.3

- 来源 / Source: [xiebaiyuan/dsh-lead-mode](https://github.com/xiebaiyuan/dsh-lead-mode)
- 中文：开场检查真正Team工具，不拿普通subagent冒充teammate；写作用域分离，任务板revision认领与消息唤醒分清职责。
- English: Check actual Team tools rather than substituting ordinary subagents, separate write scopes, and distinguish revision-based task claims from message-based wakeups.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-lead-mode@0.2.3/cordis.patch.yml) · SHA-256 `bf20b7db50535ae52f275e1866a47088af4e454b89493356f444ded3ff447403`

### dsh-mcp-host@0.6.4

- 来源 / Source: [imaused/dsh-mcp-bridge](https://github.com/imaused/dsh-mcp-bridge)
- 中文：默认只注册 bootstrap 工具，激活时把 MCP 定义挂到调用者 agent.ctx.tools，并暂时隐藏 bootstrap；按 turn/end 或空闲计时释放该 Agent 的工具定义，而 MCP 连接的生命周期另由插件 close 管理。
- English: Only a bootstrap tool is registered by default; activation mounts MCP definitions in the caller's agent.ctx.tools and temporarily hides bootstrap, while turn/end or idle timers release that Agent's definitions and plugin close separately owns the MCP connection lifetime.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-mcp-host@0.6.4/lib/index.js) · SHA-256 `9de7dec1758bc165108dc16f55ef312cfada8076f5cdbca6cf433d3b0c229d6b`

### dsh-minimal-first-turn@0.1.0

- 来源 / Source: [zrui-c/dsh-minimal-first-turn](https://github.com/ZRui-C/dsh-minimal-first-turn)
- 中文：最小首轮适配先等待 bootstrap fiber 就绪，并确认组装后的目录确实包含全部 bootstrap 工具；任何缺项都保留原目录并记录原因，随后用会话事件边界决定是否晋升回完整工具面，而非永久替换预设。
- English: The minimal-first-turn adapter waits for its bootstrap fiber and verifies that the assembled catalog contains every bootstrap tool; missing entries preserve the original catalog with a diagnostic, while session-event boundaries determine promotion back to the full surface rather than permanently replacing the preset.
- 风险 / Risk: README说明灵感来自 dsh-anchored-standard 且属独立实验；这里只确认所读的挂载与回退实现，不外推首轮行为改善。 / The README credits inspiration from dsh-anchored-standard and calls this an independent experiment; this review confirms only the inspected mounting and fallback implementation, not improved first-turn behavior.
- 片段 / Fragment: [src/host.mjs](https://unpkg.com/dsh-minimal-first-turn@0.1.0/src/host.mjs) · SHA-256 `4d4c3ed69ea50d7d9201f10523da1ef4d80dabd09182b349a5de54a1f1b1d18f`

### dsh-modes@0.9.1

- 来源 / Source: [xiaohai-78/dsh-modes](https://github.com/xiaohai-78/dsh-modes)
- 中文：工具说明覆盖行只在有 override 的预设中插入，无覆盖时移除；组装监听 await 下游后仅替换 description，保留工具名与参数，不改全局注册表。每次请求读取最新保存值，但首次新增监听只影响后来启动的会话，且 run_code 内的 SDK 文本不在此改写范围。
- English: A tool-description row is inserted only into presets with overrides and removed when none remain. Its assembly listener awaits downstream output, changes only description, and leaves names, parameters, and the global registry untouched. Saved values are read per request, but first-time listener insertion affects later sessions only, and run_code SDK text is outside its rewrite scope.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-modes@0.9.1/index.js) · SHA-256 `af561bbd8b9c0e8b1099865de3352e6980b96873f8bdbf8d2a3e68da311f69f4`

### dsh-molbio-tools@0.25.0

- 来源 / Source: [lovy2004/dsh-molbio-tools](https://github.com/lovy2004/dsh-molbio-tools)
- 中文：领域模式将可复核计算工具与生物学结论分界，工具报告估算模型/范围，图可选回附供视觉核对而不默认当作科学验证。
- English: Separate reproducible domain calculations from biological conclusions, report estimation models/limits, and optionally attach plots for visual checking without calling that scientific validation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-molbio-tools@0.25.0/cordis.patch.yml) · SHA-256 `dfa2d8ce00c61e6111a8338f3fa74929bd00daf251becf81410272a795beeaa2`

### dsh-motor-ai-l0@0.6.10

- 来源 / Source: [wangxuewangxue98/dsh-motor-ai-l0](https://github.com/wangxuewangxue98/dsh-motor-ai-l0)
- 中文：聚合工具把参数矩阵、校验和排序留在程序内，返回 generated/passed/warning/failed 与 count_ok、TopN 和 handoff_path；大批候选不必靠模型在多轮工具之间搬运，且截断与计数差异可显式展示。
- English: The aggregate tool keeps matrix generation, validation and ranking inside the program, returning generated/passed/warning/failed counts, count_ok, TopN and handoff_path; large candidate sets need not be relayed by the model across tools, and truncation or count discrepancies can be shown explicitly.
- 风险 / Risk: 经验公式筛选不是求解器验真；包内默认补丁还配置了 commerceBackendUrl 与免费额度开关，不能仅凭遥测开关默认 false 就推断所有调用离线。 / Empirical screening is not solver verification; the shipped patch also configures commerceBackendUrl and the free-quota switch, so false telemetry defaults alone do not establish that every call is offline.
- 片段 / Fragment: [index.mjs](https://unpkg.com/dsh-motor-ai-l0@0.6.10/index.mjs) · SHA-256 `d2ff8ddcd726c73010f4a936d714a0d0190755d08faf1d9cabfdc0b335715a25`

### dsh-multitask@1.4.1

- 来源 / Source: [senguk520/dsh-multitask](https://github.com/Senguk520/dsh-multitask)
- 中文：volatile 更新触发预设重新声明；失败时尝试恢复上一份 composition，连恢复失败也明确告警模式将缺席。清理只释放本实例拥有的声明，避免旧 fiber 晚卸载删掉新实例接管的预设；设置热更新要同时设计回滚和所有权交接。
- English: Volatile updates trigger preset redeclaration; failure attempts to restore the previous composition, and failed restoration explicitly warns that the mode is missing. Cleanup releases only the current instance's declaration so late disposal of an old fiber does not remove its replacement. Hot settings updates need both rollback and ownership handoff.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-multitask@1.4.1/lib/index.js) · SHA-256 `9d69cf21c0521ee2ee1b25d86766c84cfab928c2b944117083084994155ae5d3`

### dsh-myself-preset@0.1.1

- 来源 / Source: [mutexz/dsh-myself-preset](https://github.com/mutexz/dsh-myself-preset)
- 中文：从原稿与纠正的diff提炼表达规则，深读结果先待确认再进人格；可切换persona模板与路由method检查分开实现。
- English: Derive expression rules from draft/correction diffs, requiring acceptance before deep-read findings enter a persona, while keeping switchable persona templates separate from route method validation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-myself-preset@0.1.1/cordis.patch.yml) · SHA-256 `0d72810469d765097f4096e42373a0409c3d2baf423cb72fb99d0414172c432f`

### dsh-network-engineer@0.1.0

- 来源 / Source: [sososilencing/dsh-network-engineer](https://github.com/sososilencing/dsh-network-engineer)
- 中文：厂商命令必须查随包知识库并给来源，对verified:medium资料明确降置信；skills注册带resourceBase以便真实解析资源路径。
- English: Verify vendor commands against bundled references, cite them and lower confidence for medium-verified material; register skills with resourceBase for real resource resolution.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-network-engineer@0.1.0/cordis.patch.yml) · SHA-256 `3a682c51c8c69886b3b73973188ca6b2036f3e7b67d672530aee69db18f5eed8`

### dsh-novel-solo@0.2.4

- 来源 / Source: [tkingxiao/dsh-novel-solo](https://github.com/Tkingxiao/dsh-novel-solo)
- 中文：长篇写作按六类设定文档、逐章正文与独立章节/全书审核串接，量化小模型用纯文本契约和瘦工具面；数量设置只在装载时镜像进persona，不宣称即时生效。
- English: Long-form writing links six planning artifacts, chapter drafts and independent chapter/book reviews, using a plain-text contract and slim tools for quantized models. The count setting is mirrored into the persona at load time, not live.
- 风险 / Risk: 版本门控、文件解析与设置镜像均只静态追踪，!!js未求值，未声称当前profile已挂载；pwsh固定启用需相应环境。persona有删旧版/审核文件和强制委派条款，不能覆盖用户授权、数据保留或安全边界；性能数字只是维护者特定环境报告。 / Version gating, resource resolution and setting mirroring were statically traced only; !!js was not evaluated and no current-profile mount is claimed. pwsh is enabled and needs its environment. Persona deletion/mandatory delegation rules cannot override authorization, retention or safety; performance figures are maintainer environment-specific reports.
- 片段 / Fragment: [package.json](https://unpkg.com/dsh-novel-solo@0.2.4/package.json) · SHA-256 `e4ce733a4282ba6c7089b102505b10002a9b5eb43dfacb559bd8817e49fb181d`

### dsh-openwrite@0.2.38

- 来源 / Source: [lipu-jpg/openwrite](https://github.com/LiPu-jpg/Openwrite)
- 中文：兼容旧预设目录时先检查管理标记与内容摘要，遇到无标记目录或被改过的版本拒绝覆盖；现代宿主以异步 generator yield 注册释放函数。历史身份别名尊重已有 readDocument 声明，以保留旧会话可恢复性，而不应把每个版本别名当新独立模式。
- English: Legacy preset-directory handling checks ownership markers and content digests, refusing to overwrite unmarked directories or modified versions. Modern hosts receive registrations through an async generator yielding disposers. Historical identity aliases respect existing readDocument declarations to preserve resumability, not to count every version alias as a new mode.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [plugin.mjs](https://unpkg.com/dsh-openwrite@0.2.38/plugin.mjs) · SHA-256 `ba8a0288e5b8e20bd10bc89c84f6f00283c1c5a466b3b0b5fd66079f49789633`

### dsh-orbital-agents@0.2.8

- 来源 / Source: [qulierm/orbital-agents](https://github.com/Qulierm/orbital-agents)
- 中文：复用一对持久会话而非每项任务新建worker，通过任务开始/报告协议落盘并在composer dock显示计划。
- English: Reuse paired persistent sessions instead of respawning workers per task, recording task-start/report protocol and exposing plans in the composer dock.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [presets/endeavour.patch.yml](https://unpkg.com/dsh-orbital-agents@0.2.8/presets/endeavour.patch.yml) · SHA-256 `b6f6a4f3532a68ac4254f0b307fe3e6ba66500ec518754b03dbcfc3437830850`

### dsh-outsourcing-expert@1.2.4

- 来源 / Source: [funny1potato/dsh-outsourcing-expert](https://github.com/Funny1Potato/dsh-outsourcing-expert)
- 中文：先发现已授权provider/model再按能力派活；反向挑选是显式负对照配置而不是改名，leader保留自己执行能力，与纯调度有实质边界差异。
- English: Discover authorized providers/models before routing by capability; reverse hiring is an explicit negative-control configuration, not a rename, while leader retains execution unlike pure dispatch.
- 风险 / Risk: 能力表与模型名只是启发式；负对照不代表推荐采用。 / Capability tables/model names are heuristics; a negative control is not a recommendation.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-outsourcing-expert@1.2.4/cordis.patch.yml) · SHA-256 `19eb059f3b9176f545b7b2d40a44125d19dee50a3aa8dcd6946c79da6327c591`

### dsh-paoding@0.4.10

- 来源 / Source: [lifangjin/dsh-paoding](https://github.com/lifangjin/dsh-paoding)
- 中文：工作区预设写流程用 applyInFlight 串行闸包住读取状态、baseRevision 校验、配置快照与 installAssignments；写后强刷缓存失败只 warn，不抹去已写成功的事实。路由注册重试只匹配 duplicate prefix route，其他错误原样抛出，避免把真正组合冲突伪装成热重载延迟。
- English: Workspace-preset writes use an applyInFlight gate around state reads, baseRevision checks, configuration snapshots, and installAssignments. Post-write cache refresh failures warn without erasing the fact that writing succeeded. Route-registration retries match only duplicate prefix-route errors; other errors propagate rather than disguising genuine composition conflicts as reload delay.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [plugins/paoding-config-ui/index.mjs](https://unpkg.com/dsh-paoding@0.4.10/plugins/paoding-config-ui/index.mjs) · SHA-256 `5502d3466f928455dd3eae83c62bffdcde359304e4428369ada5575ba36e00af`

### dsh-pentester@6.5.0

- 来源 / Source: [fb0sh/dsh-pentester](https://github.com/fb0sh/dsh-pentester)
- 中文：Root用正向工具白名单与注入的run-state统筹PTES阶段，授权范围、运行时与委派覆盖记录分开；19个专家只作为内部AgentProfile，不冒充19套可选预设。
- English: The root coordinates PTES stages through a positive tool allowlist and injected run-state, separating authorized scope, frozen runtime and delegation coverage. Nineteen specialist AgentProfiles are internal workers, not nineteen extra presets.
- 风险 / Risk: 只研究静态编排，不扫描、不执行攻击、不启动Docker/SSH或工具载荷；安全测试必须有明确授权，来源免责声明也承认这些门禁不构成法律授权或绝对防护。包有prepare脚本，未执行。 / Static orchestration study only: no scans, attacks, Docker/SSH startup or tool payload execution. Security testing requires explicit authorization; the source admits its gates are neither legal authorization nor absolute protection. Its prepare script was not run.
- 片段 / Fragment: [package.json](https://unpkg.com/dsh-pentester@6.5.0/package.json) · SHA-256 `f214160b47dc959ec999b36f7cfe641abce73266afcf6ad492d09370e8e10b7b`

### dsh-phone-drop@0.4.2

- 来源 / Source: [songzijianlove/dsh-phone-drop](https://github.com/SongZijianlove/dsh-phone-drop)
- 中文：异步 LAN 服务启动后再次检查 stopped，若作用域已卸载立即关闭刚建立的监听器；effect 同时负责服务关闭与健康计时器回收，防止重载期间晚到的启动结果遗留端口。
- English: After asynchronous LAN startup, the plugin rechecks stopped and immediately closes a newly opened listener if its scope has already unloaded; effects own both listener shutdown and health-timer cleanup, avoiding late-start port leftovers during reload.
- 风险 / Risk: 默认配置是 0.0.0.0 且 token 为空；这里仅研究生命周期处理，不将局域网直连描述为已验证的访问保护。 / Defaults bind 0.0.0.0 with an empty token; this review studies lifecycle handling, not verified access protection for the LAN endpoint.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-phone-drop@0.4.2/lib/index.js) · SHA-256 `fb81f6ec2850a914da84bbe26eb66ef2f86c3dd21d891c60a7c3e0c6745ebc80`

### dsh-pi-mode@0.3.5

- 来源 / Source: [fujingzhai/youxia-dsh-plugins](https://github.com/fujingzhai/youxia-dsh-plugins)
- 中文：共用核心组合，通过编辑器能力与交付通道形成Pi、Pi+、IM三种实质工具面，监听tools/change刷新实际可用能力，而非复制整份模式。
- English: Share a core composition while varying edit capabilities and delivery channels across Pi, Pi+ and IM, refreshing real capabilities on tools/change rather than copying entire modes.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-pi-mode@0.3.5/cordis.patch.yml) · SHA-256 `f7d7fe9357867e2550e1e57a87de0d915b2e44ff758078612f4c49eb205cb020`

### dsh-plan-and-execute@0.6.0

- 来源 / Source: [jimmyzhang219/dsh-plan-and-execute](https://github.com/jimmyzhang219/dsh-plan-and-execute)
- 中文：每个 session 只建立一个 orchestrator，步骤模型覆盖挂在 agent.ctx 的 request 链；切 provider/model 时先移除继承的 reasoningEffort，避免把上一模型档位带给新模型。排期触发先检查 archivedSessionIds，缺失 agents 服务则告警等打开时补执行，而非假报已唤醒。
- English: One orchestrator is created per session, with step-model overrides attached to the agent.ctx request chain. Switching provider/model first removes inherited reasoningEffort to avoid carrying another model's effort setting. Scheduled firing checks archivedSessionIds first; missing agents service warns and defers until opening rather than falsely reporting a wake-up.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plan-and-execute@0.6.0/lib/index.js) · SHA-256 `cac20fa8ee731b2e85e90a1920f0f235b6974724527f7089db4072f70353356c`

### dsh-plugin-agent-collaboration@0.5.0

- 来源 / Source: [leo-sail/dsh-plugin-agent-collaboration](https://github.com/Leo-sail/dsh-plugin-agent-collaboration)
- 中文：持久Bot与coordinator分成不同工具面（14行与10行），将房间协作与临时子代理分清；来源只是社区实现，不冒充官方保证。
- English: Separate persistent Bots and coordinator into different tool surfaces (14 versus 10 rows), distinguishing room collaboration from temporary workers without implying official guarantees.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-agent-collaboration@0.5.0/cordis.patch.yml) · SHA-256 `a94c7c4de7eec5fc975b3a24f5dfeed33eed16908edd78dac2dca1e003f341f0`

### dsh-plugin-bridge@0.5.2

- 来源 / Source: [totoro-qaq/dsh-plugin-bridge](https://github.com/Totoro-qaq/dsh-plugin-bridge)
- 中文：迁移 worker 的完成检查只轮询目标会话尾部，按提交前 afterSeq 水位识别新 turn/start、step/start 与 turn/end，并保留结束原因；不拿全局会话列表的 running 快照或消息已排队当作执行完成。
- English: Migration-worker completion checks poll only the target session tail, use the pre-submission afterSeq watermark to recognize fresh turn/start, step/start and turn/end events, and retain the end reason; global running snapshots or queued messages are not treated as completed execution.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plugin-bridge@0.5.2/lib/index.js) · SHA-256 `9c414859f2105f8eff02fa4bca773d34130afce4daf4bbad40faf52bffec2453`

### dsh-plugin-canvas@0.1.0

- 来源 / Source: [ijry/deepseek-harness-desktop-ultra](https://github.com/ijry/DeepSeek-Harness-Desktop-Ultra)
- 中文：画布 SSE 连接先发送带 revision 的 hello 基线，断档由客户端重新取状态而非重放全部帧；最后一个订阅断开就清除心跳，整体卸载同时撤销路由、结束连接与清空订阅集合。
- English: Canvas SSE sends a revision-bearing hello baseline so gaps trigger a state refetch rather than replaying all frames; the last disconnect clears the heartbeat, and full disposal removes routes, ends connections and clears subscribers.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plugin-canvas@0.1.0/lib/index.js) · SHA-256 `56d859ffe8f0acf009cf695cfc2f7ae3ef05caed136927168625d75a58a940c4`

### dsh-plugin-compare@0.1.0

- 来源 / Source: [yminghua/dsh-plugin-compare](https://github.com/yminghua/dsh-plugin-compare)
- 中文：比较收集器从 session/event 按 String(session.id) 记录，不从 UI 文案猜执行；RPC 装配标注 trusted-host，controlled-run 先校验输入，进度分别落 completed/failed。配置 maxTrials 再取至多 10，控制试验必须明确边界与失败态，不能只给一条运行按钮。
- English: The comparison collector records session/event data keyed by String(session.id) rather than inferring execution from UI wording. RPC assembly declares trusted-host authority; controlled-run validates input and records completed/failed progress separately. maxTrials is capped at ten, making experiment bounds and failure states explicit rather than exposing only a run button.
- 风险 / Risk: 未展开 controlled runner 和 RPC 权限实现；未证明 A/B 环境隔离或统计因果有效性。 / The controlled runner and RPC authority implementation were not expanded; A/B isolation and statistical causal validity were not established.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plugin-compare@0.1.0/lib/index.js) · SHA-256 `7e5fc6f55e70271fb515fef58b5bdf10c040608b3af80f4b9a5b4416d6d30b0a`

### dsh-plugin-dev-workflow@0.2.6

- 来源 / Source: [yuna78/dsh-plugin-dev-workflow](https://github.com/yuna78/dsh-plugin-dev-workflow)
- 中文：Request→Feedback→Task→Verify→Completion逐环留原话与真实退出码，反馈不自动升格偏好/规范，知识晋升要明确确认。
- English: Preserve verbatim requests/feedback and actual exit codes across Request→Feedback→Task→Verify→Completion; feedback does not automatically become durable policy, and knowledge promotion needs confirmation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-dev-workflow@0.2.6/cordis.patch.yml) · SHA-256 `8a08dbbd5489455a1a141d35b12d3954acb3b536b3353ffa7c7f0783a509cf8e`

### dsh-plugin-local-life@0.3.2

- 来源 / Source: [863683348/dsh-plugin-local-life](https://github.com/863683348/dsh-plugin-local-life)
- 中文：把生活算术拆成无 DSH 导入的纯函数，再用单个 action 枚举工具分发；预算函数返回分项、allocatedTotal、leftover 与 balanced，账单分摊显式处理舍入差额，结果不只是一段模型生成的数字。
- English: Everyday arithmetic is separated into pure functions without DSH imports and dispatched through one action-enumerated tool; budgeting returns allocations, allocatedTotal, leftover and balanced, while bill splitting explicitly handles rounding differences instead of returning only model-generated numbers.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plugin-local-life@0.3.2/lib/index.js) · SHA-256 `040f7d9f85cd0033fdca157c173790621be698d7e3273b0b7a7655e790176a46`

### dsh-plugin-maoxuan-pet@0.3.2

- 来源 / Source: [yuna78/dsh-maoxuan-pet](https://github.com/yuna78/dsh-maoxuan-pet)
- 中文：经典文本引文先查公开语料逐字核对，再分清历史情境与现代类比，最后给当天可验证动作；核不到不能加引号冒充原文。
- English: Verify quotations word-for-word against the corpus, distinguish historical context from modern analogy, and conclude with a testable near-term action; never fabricate quotations.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-maoxuan-pet@0.3.2/cordis.patch.yml) · SHA-256 `def5d6b7c843a6e9a8abdfb39bd7e71e547ff4c55a1fb71c6ec2df31102a30cb`

### dsh-plugin-nexus-sdlc@1.0.0

- 来源 / Source: [fnckerpoi/dsh-plugin-nexus-sdlc](https://github.com/Fnckerpoi/dsh-plugin-nexus-sdlc)
- 中文：声明式四角色委派按阶段传完整任务包与verdict，且明确persona只是治理约定，不是假装自动FSM或权限隔离。
- English: Pass complete task packages and verdicts across declarative role stages, explicitly treating persona guidance as governance rather than an automatic FSM or permission boundary.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-nexus-sdlc@1.0.0/cordis.patch.yml) · SHA-256 `920cbac37c22d003e94575346d735c5a03efedf51fc6baf6debe1b151480f656`

### dsh-plugin-recommender@0.2.0

- 来源 / Source: [mimosa776/dsh-plugin-recommender](https://github.com/mimosa776/dsh-plugin-recommender)
- 中文：audit_plugin 的输出契约把模式扫描 findings 的 file/line/count 与下载量、星数、发布时间等 stats 分开，并在使用指导中明说扫描是启发式；推荐信息与代码取证应保留不同来源和含义。
- English: The audit_plugin output contract separates pattern-scan findings with file/line/count from download, star and publication stats, and its guidance explicitly calls the scan heuristic; recommendation metadata and code evidence should retain distinct provenance and meaning.
- 风险 / Risk: 静态模式评分和口碑不能证明插件安全；本次没有调用其安装工具。 / Static pattern scores and popularity do not prove plugin safety; its installation tool was not invoked.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-plugin-recommender@0.2.0/lib/index.js) · SHA-256 `95bde0cd679c33095c99411d3b8c6a84a6048c41e0861f8c123e394710f5bf4d`

### dsh-plugin-slayer@0.1.0

- 来源 / Source: [yuna78/dsh-slayer](https://github.com/yuna78/dsh-slayer)
- 中文：持久teammate与一次性subagent工具面在agent创建时加调用guard，硬隔离比仅在persona里要求更可审计。
- English: Install invocation guards at agent creation to separate persistent teammate and one-shot subagent surfaces, making isolation more auditable than persona-only instructions.
- 风险 / Risk: 不引入谄媚人格或强制凑满并发的惩罚机制；研究硬隔离而非照搬价值取向。 / Do not adopt sycophantic personas or punishment for unused concurrency; study hard isolation, not those behavioral values.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-slayer@0.1.0/cordis.patch.yml) · SHA-256 `768161133e97264d256f889720d306981ab301ea6c63c1fec38d6bac38cbe3b9`

### dsh-plugin-task-runner@0.6.0

- 来源 / Source: [weixshaw/dsh-plugin-task-runner](https://github.com/weixshaw/dsh-plugin-task-runner)
- 中文：task_worker 先做提示词估算预算拒绝，再按调用会话信号量拒绝超并发，不自动切换模型。settleRun 等结果后始终 dispose，并保留执行和释放双重异常；非 completed 的 stopReason 返回失败，超长结果截断同时保存全文 artifact，finally 释放并发槽。
- English: task_worker rejects estimated over-budget prompts before per-session semaphore admission and never silently switches models. settleRun always disposes after awaiting the result and preserves both execution and disposal failures. Non-completed stopReason values become failures; long results are truncated with a full artifact saved, and finally releases the concurrency slot.
- 风险 / Risk: token 估算是启发式；未核验底层 provider 的上下文上限或本机实际并发效果。 / Token estimation is heuristic; provider context ceilings and actual local concurrency behavior were not verified.
- 片段 / Fragment: [lib/worker/index.js](https://unpkg.com/dsh-plugin-task-runner@0.6.0/lib/worker/index.js) · SHA-256 `170d1ce4b296741fcf05114402431d73077b099d07b8dd0201926e93203b9dfe`

### dsh-plugin-wiki-tools@0.14.2

- 来源 / Source: [lion-1209/dsh-plugin-wiki-tools](https://github.com/Lion-1209/dsh-plugin-wiki-tools)
- 中文：writePage 在页面锁内补齐 frontmatter、保留原 created 和未知字段，并在来源哈希未变时返回 alreadyIngested；共享主索引、文件夹索引和日志再按页面→__vault__ 的固定顺序获取全库锁，将单页并发与共享簿记并发分开。
- English: Inside the page lock, writePage completes frontmatter, preserves the original created value and unknown fields, and returns alreadyIngested for an unchanged source hash; shared master-index, folder-index and log updates then acquire the vault lock in a fixed page → __vault__ order, separating per-page concurrency from shared bookkeeping.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-plugin-wiki-tools@0.14.2/index.js) · SHA-256 `d50f5830642fe0b23f30c2c577fb88c721c72e336d1f423e973a79bd08de2f20`

### dsh-pm-workbench@0.1.0

- 来源 / Source: [781237194/agile-workbench](https://github.com/781237194/agile-workbench)
- 中文：本机启动器将路径解析、依赖预检和启动回执拆开：显式路径无效就报该路径的错误，不偷偷回退默认目录；启动时清除继承的 ELECTRON_RUN_AS_NODE，以 detached/stdio ignore 提交进程，并区分提交启动与窗口真正出现。
- English: The local launcher separates path resolution, dependency preflight and acknowledgement: an invalid explicit path errors instead of silently falling back, launch removes inherited ELECTRON_RUN_AS_NODE and uses detached/ignored stdio, and the receipt distinguishes submitting a launch from the window actually appearing.
- 风险 / Risk: 默认 apply 在找不到默认安装目标时会启动 PowerShell，下载安装器并执行；这不限于用户后来调用启动工具。本次没有运行该行为。 / By default, apply starts PowerShell to download and execute an installer when no default installation target exists; this is not restricted to a later user tool call. That behavior was not run here.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-pm-workbench@0.1.0/index.js) · SHA-256 `31556027979b6567f6f1065598c4284e9146f1e06f470d396954f7f154e4e4df`

### dsh-pptx-builder@1.1.0

- 来源 / Source: [zhdanovdmitriy/dsh-pptx-builder](https://github.com/ZhdanovDmitriy/dsh-pptx-builder)
- 中文：用受控pptx工具编辑真实OOXML交付，先inspect再按元素id修改；数值图表必须带来源，文件通用工具只保留读取，不给此面添加任意shell写作执行链。
- English: Edit a real OOXML deliverable through bounded pptx tools, inspecting before element-id updates; numerical charts carry sources, while generic file access is read-only rather than an arbitrary shell execution chain.
- 风险 / Risk: pptx_*在宿主全局注册，不宣称仅此预设能见；图表/公式等工具可能启动本机Python，研究未运行。 / pptx_* tools register host-wide; do not claim preset-only visibility. Chart/formula tools may start local Python; none were run.
- 片段 / Fragment: [package.json](https://unpkg.com/dsh-pptx-builder@1.1.0/package.json) · SHA-256 `e551916df1031f7c9a1f6b1a94968eb895a5cc5448ade8ba3a34b3783dc6c062`

### dsh-preset-conductor@0.1.0

- 来源 / Source: [wxid123/xiehome](https://github.com/wxid123/XieHome)
- 中文：按可观测任务规模决定是否规划/委派，独立工作并行、有依赖串行；来源承认这不是所有委派路径的强制隔离。
- English: Use observable task size to trigger planning/delegation, parallelize independent work and serialize dependencies; the source admits this does not enforce isolation across every route.
- 风险 / Risk: “无限制/不声明边界”人格不能覆盖宿主权限和安全边界，不引入该段。 / Unrestricted/no-boundary persona language cannot override host permissions or safety; do not adopt it.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-preset-conductor@0.1.0/cordis.patch.yml) · SHA-256 `4053ed3dc6f24015dc1f5b74f677a7e9fe7ca0b0f3565291bf9654be770ec2a4`

### dsh-preset-deep@0.1.2

- 来源 / Source: [anticbv/dsh-preset-deep](https://github.com/anticbv/dsh-preset-deep)
- 中文：事实标记文件/检索/记忆三类，记忆必须转成可查来源才能进结论；开工先写可运行完成条件，交叉模型验证按用户要求而非强制扇出。
- English: Label file/search/memory facts, upgrading memory to inspectable evidence before conclusions; define executable completion conditions and reserve model cross-checks for user-requested cases.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-preset-deep@0.1.2/cordis.patch.yml) · SHA-256 `8224b1d155f37fa04a30dfbcecf727e975650d435cafecb505a7c881a9ce5063`

### dsh-preset-doctor@0.9.3

- 来源 / Source: [drscrewdriver/dsh-preset-doctor](https://github.com/drscrewdriver/dsh-preset-doctor)
- 中文：实现中的启动任务固定 runScanFix({mode:'scan'})，延时一秒并在卸载清掉 timer；修复入口另走命令/设置桥。它与 README 开头“自动修复”的概括存在边界差异，研究应以扫描只读与显式修复分面的实际代码为准，不能照抄宣传作自动写盘保证。
- English: The startup task explicitly calls runScanFix({mode:'scan'}), delayed one second with timer cleanup on disposal; repair uses separate command/settings-bridge paths. This differs from the README's broad automatic-repair introduction. Research should follow the code's read-only scan/explicit repair separation rather than repeat promotional wording as an automatic-write guarantee.
- 风险 / Risk: 部分桥回调内部直接传 confirm:true；未审计外层 UI/HTTP 确认链，不能宣称所有修复均已证明获人工授权。 / Some bridge callbacks pass confirm:true internally; outer UI/HTTP confirmation chains were not audited, so human authorization for every repair is not established.
- 片段 / Fragment: [src/index.js](https://unpkg.com/dsh-preset-doctor@0.9.3/src/index.js) · SHA-256 `47486d293259a7c6598b2735b99af4242dc3a0f592be21a1245acad15f1e6b27`

### dsh-quit-idle-fix@0.1.0

- 来源 / Source: [shuaichewang/dsh-quit-idle-fix](https://github.com/shuaichewang/dsh-quit-idle-fix)
- 中文：清理 idle inbox 前同时要求 agent.status==='idle' 且 nextTurn 为空，只删四种 source.kind 白名单通知，并倒序调用 inbox.splice 避免索引位移；500ms 扫描 timer 随 effect 清除。修假忙应区分用户待办与系统提示，不能粗暴清空 nextStep。
- English: Idle-inbox cleanup requires both agent.status==='idle' and an empty nextTurn, removes only four allowlisted source.kind notice types, and splices backward to avoid index shifts. Its 500ms sweep timer is effect-disposed. Fixing false activity must distinguish queued user work from system notices, not clear nextStep wholesale.
- 风险 / Risk: 未验证这些通知在所有宿主版本中均可冗余删除，也未进行桌面退出验收。 / It was not verified that these notices are redundant in every host version, and desktop quit behavior was not tested.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-quit-idle-fix@0.1.0/index.js) · SHA-256 `77b080eb2cbe280ce4da177140b1595386810b86ffb801d27b4c0a8047164465`

### dsh-re-workbench@0.1.0

- 来源 / Source: [wxlei2004/dsh-plugins](https://github.com/wxlei2004/dsh-plugins)
- 中文：桥接外部重型工具时先提供环境自检工具，让模型在操作前确认依赖与端口状态，避免把"环境没装"误判成"操作失败"。
- English: When bridging a heavy external tool, expose an environment self-check first so the model confirms dependencies and port state rather than mistaking a missing install for a failed operation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-re-workbench@0.1.0/lib/index.js) · SHA-256 `565c6438ce2ae8f9f264168f4c2fd3de8bf0cfe8dd02d4736f9c90edc376e69d`

### dsh-redteam-mode@0.15.1

- 来源 / Source: [jueze-2019/dsh-redteam-mode](https://github.com/Jueze-2019/dsh-redteam-mode)
- 中文：可取的通用机制是每个假设带预期证据、失败信号和停止条件，并要求发现落库；内部六个明确不要手选的worker不凑独立配置数。
- English: Generalizable mechanisms attach expected evidence, failure signals and stop conditions to hypotheses and persist findings; six explicitly non-manual workers do not inflate independent configuration counts.
- 风险 / Risk: 其“给单位名称即授权/不问范围”约定不安全，不能引入；不运行任何探测、利用、隧道或攻击工具。 / Treating a target name as authorization and skipping scope confirmation is unsafe and must not be adopted; no scanning, exploitation, tunneling or attack tools were run.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-redteam-mode@0.15.1/cordis.patch.yml) · SHA-256 `3448cff87b6ac6f038a021085de447407f4246ae8a4747437f21493e56d82d6e`

### dsh-reverse-mode@0.3.5

- 来源 / Source: [xingxue-ux/dsh-reverse-mode](https://github.com/xingxue-ux/dsh-reverse-mode)
- 中文：把原先全局桥转成preset子树，工具注册继承scope，未选模式不挂载桥；只研究封装边界，不安装REA或执行其npx载荷。
- English: Move a global bridge into a preset subtree so tool registration inherits scope and unselected modes do not mount it; study encapsulation without installing REA or running its npx payload.
- 风险 / Risk: 上游二次开发来源须保留归属；桥接外部进程仍需单独权限审计。 / Retain upstream attribution and separately audit permissions for bridged external processes.
- 片段 / Fragment: [presets/reverse.patch.yml](https://unpkg.com/dsh-reverse-mode@0.3.5/presets/reverse.patch.yml) · SHA-256 `3684b6f734361589135f25c07fc99ffdc46236cf3789628eb6e237d98a0e75e5`

### dsh-roam-planner@0.2.3

- 来源 / Source: [antonylang/dsh-roam-planner](https://github.com/AntonyLang/dsh-roam-planner)
- 中文：行程采用 draft→candidate→adopted 状态转换：编辑丢弃旧候选并增加 revision，冻结候选只增加 version，采纳只接受 candidate 快照并保留 baseline 供下轮比较；工具返回 tripId/status/revision，不把工作稿和已提交计划共用一个可覆盖字段。
- English: Trips use draft → candidate → adopted transitions: editing drops the old candidate and increments revision, freezing increments only version, and adoption accepts only a candidate snapshot while retaining a baseline for the next draft; tools return tripId/status/revision instead of sharing one overwritable field between drafts and committed plans.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-roam-planner@0.2.3/index.js) · SHA-256 `663c8da7fedb103c93e0b6090ca9c5b90f712392a438f89145e8af05550c34ea`

### dsh-root-planner-preset@1.6.1

- 来源 / Source: [xiaoou2024/dsh-root-planner-preset](https://github.com/XiaoOu2024/dsh-root-planner-preset)
- 中文：根据运行时委派标记确定root/worker身份，决定留在root、执行在隔离worker；禁止任务结束留下进程，Cordis面另加只读运行时检查能力。
- English: Derive root/worker identity from runtime delegation markers, keep decisions at root and execution in fenced workers, prohibit surviving processes, and add read-only runtime inspection only in the Cordis face.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-root-planner-preset@1.6.1/cordis.patch.yml) · SHA-256 `fb0726d7fc1d61d67718d4d4600314edb91a6adabae059b3dfee87c0b6e60904`

### dsh-scholar-digest@0.1.1

- 来源 / Source: [liyang-cyber/dsh-scholar-digest](https://github.com/LiYang-cyber/dsh-scholar-digest)
- 中文：学术研究把多源核验元数据与HTML/XLSX/BibTeX/RIS等可重现交付分开，异步register返回disposer后还检查是否已dispose。
- English: Separate verified multi-source literature metadata from reproducible HTML/XLSX/BibTeX/RIS delivery, and handle disposal even when asynchronous registration resolves late.
- 风险 / Risk: 静态builder只解析到id，完整工具配置仍待实读追踪，因此暂不批准academic计数。 / The static builder currently resolves only its id; full tool configuration still needs tracing, so academic is not approved yet.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-scholar-digest@0.1.1/lib/index.js) · SHA-256 `de9e3128c442e34771398d9e1ef590ee0fb4149f991e52181a274afb24412850`

### dsh-session-flow@1.5.0

- 来源 / Source: [yeqingtang/dsh-session-flow](https://github.com/YeqingTang/dsh-session-flow)
- 中文：会话健康分类把 inflight、最近事件、未闭合工具调用与纯静默分开：未闭合工具进入 tool-wait，缺时间戳返回 unknown，不把长工具无输出直接判成 stalled；分类是可单测的纯函数，路由只消费结果。
- English: Session-health classification distinguishes inflight activity, recent events, open tool calls and silence: an open tool yields tool-wait and missing timestamps yield unknown, rather than labeling every quiet long tool stalled; classification is a separately testable pure function consumed by the route.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/host.js](https://unpkg.com/dsh-session-flow@1.5.0/lib/host.js) · SHA-256 `a2f9a63a4430d39609702b9317eda89b7208cf38583a51554fafa841d0178af3`

### dsh-session-hotkeys@1.9.5

- 来源 / Source: [yeyeyeyeshifu/dsh-session-hotkeys](https://github.com/YEYEYEYESHIFU/dsh-session-hotkeys)
- 中文：快捷键插件把页脚入口与 shell.overlay 分槽注册，归档确认框单独处理 Escape、Tab 与方向键的焦点切换；导出 inject 明确等待 sessions/workspaces/locale，而可选 uiWorkspace 留到按键时惰性解析。
- English: The hotkey plugin registers footer entry and shell.overlay separately, gives its archive confirmation explicit Escape, Tab and arrow-key focus handling, and declares sessions/workspaces/locale in inject while resolving optional uiWorkspace lazily at keypress time.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/client.js](https://unpkg.com/dsh-session-hotkeys@1.9.5/lib/client.js) · SHA-256 `2f63ec967d3aa6139e9e41ce3734a6047cf6648e56038cc42c15a2221f9b7f08`

### dsh-session-inherit@0.7.0

- 来源 / Source: [macilydots/dsh-session-inherit](https://github.com/MacilyDots/dsh-session-inherit)
- 中文：/inherit 解析器仅把符合 SESSION_ID_RE 的裸参数当会话 id，其余裸文本按下一步说明处理，另保留 --next 显式写法；输入解释与 preview/commit/retry 路由分开，避免把自然语言任务误报成非法 id。
- English: The /inherit parser treats a bare argument as a session ID only when it matches SESSION_ID_RE, otherwise interpreting it as next-step text while retaining explicit --next syntax; parsing is separate from preview/commit/retry routes, avoiding invalid-ID errors for natural-language tasks.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.mjs](https://unpkg.com/dsh-session-inherit@0.7.0/index.mjs) · SHA-256 `c1dba5e10dd7510c97a6d3cd85d927bd2f15a5aeb3a544236c0e0a389927886d`

### dsh-shutdown-after-task@0.2.0

- 来源 / Source: [virggle/dsh-shutdown-after-task](https://github.com/virggle/dsh-shutdown-after-task)
- 中文：关机状态初始 armed=false，只有已武装且根代理均不 running 时才进入倒计时，并根据错误集合跳过失败批次；这是把危险自动化建模成显式状态机的实例。但所读 arm/disarm/cancel 路由没有 method 检查，不能采信 README 所述 POST 约束已落实。
- English: Shutdown starts with armed=false and enters countdown only when armed and no root agent is running, skipping errored batches when configured. This models dangerous automation as explicit state. However, the inspected arm/disarm/cancel routes have no method checks, so the README's POST restriction is not established.
- 风险 / Risk: cancelShutdown 会撤销 armed，而新任务分支虽写“模式保持开启”仍调用它，存在可见实现/文案不一致；未执行任何关机操作。 / cancelShutdown disarms the mode even when the new-task branch says it remains armed, exposing an implementation/text mismatch. No shutdown operation was executed.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-shutdown-after-task@0.2.0/index.js) · SHA-256 `5534b409bf204b13b7caba46bff1638efdf5431a532297817e38f798b0aefbb1`

### dsh-slash-new@1.0.0

- 来源 / Source: [deqinglv/dsh-slash-new](https://github.com/deqingLv/dsh-slash-new)
- 中文：Host 命令只返回结果，浏览器在 command/executed 后通过 connectBlank/connectWorkspace 开空白会话，再用原生 /permission 重放可继承权限；实际新建成功与命令成功必须分开观察，缺服务或新 id 时明确告警。
- English: The host command only settles a result; after command/executed the browser opens a blank through connectBlank/connectWorkspace and replays inheritable permission through native /permission, so actual session creation must be observed separately from command success, with explicit warnings for missing services or a new ID.
- 风险 / Risk: 实现明确不继承 custom 权限混合，而保留宿主默认；且权限重放异步进行，不能照搬 README 将其概括为所有情况下权限绝不改变。 / The implementation explicitly does not inherit a custom permission mix and keeps the host default; permission replay is also asynchronous, so the README must not be generalized into unchanged permissions in every case.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-slash-new@1.0.0/lib/index.js) · SHA-256 `4c15201ecbb153f418d4c3c48059ab889ab23b00986f6a5491564dd7b11ed75d`

### dsh-sort-out-the-thoughts@0.3.10

- 来源 / Source: [hulibuld/dsh-sort-out-the-thoughts](https://github.com/hulibuld/dsh-sort-out-the-thoughts)
- 中文：思路工具将 advance 单独交给 markAdvanceAsked 并返回 shouldAsk/from/to；finish 要求传入 id，再把 stage 设为 archived，避免无身份归档。保存返回稳定 id，失败返回 ok:false 与 detail；调用方必须看结构化结果，不能把渲染出的“保存/归档”意图当成功事实。
- English: The thoughts tool routes advance separately through markAdvanceAsked and returns shouldAsk/from/to. finish requires an id argument before setting stage to archived. Saves return a stable id; failures return ok:false and detail. Callers must inspect structured results rather than treating a rendered save/archive intention as success.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-sort-out-the-thoughts@0.3.10/index.js) · SHA-256 `9a87a2be8f38f3d1f6be37bf5221cc15f9947b54f6e4587d633b73f3ca6d5fd4`

### dsh-stack@0.3.3

- 来源 / Source: [58fly/dsh-stack](https://github.com/58fly/dsh-stack)
- 中文：把always-on技能缩为常驻persona，细则按需加载；turn-stopping检查是否有真实验证和重复失败，并先排除不适用子会话。
- English: Condense always-on guidance into a resident persona while loading details on demand; check real verification and repeated failures at turn-stopping, excluding inapplicable child sessions first.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-stack@0.3.3/cordis.patch.yml) · SHA-256 `42c0739b7f6f3575d9ebdb9a360e60e26b0d96836688ab467e286473e20753bd`

### dsh-step-governor@0.2.2

- 来源 / Source: [jiewiw/dsh-step-governor](https://github.com/JiewiW/dsh-step-governor)
- 中文：tools/pre-execute 在下游决策非 deny 时才累计同目标调用，避免自阻断把计数越抬越高；deny 的 info 按 G2-A/G2-B 分支分别构造，避免缺失字段变 undefined 引发 JSON 序列化错误。可借鉴的是可解释计数和稳定错误载荷，不是已证明机械信号能判断任务语义价值。
- English: tools/pre-execute counts same-target calls only when the downstream decision is not deny, avoiding self-blocks inflating counters. Denial info is built separately for G2-A/G2-B so absent fields do not become undefined and break JSON serialization. The lesson is explainable counting and stable error payloads, not proof that mechanical signals judge semantic task value.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-step-governor@0.2.2/lib/index.js) · SHA-256 `c0d2a581788ee789efc3486d93d078ca1f6b2f008cc197988117c99769538d4e`

### dsh-story-mode@1.0.0

- 来源 / Source: [starkingcn/dsh-story](https://github.com/starkingcn/dsh-story)
- 中文：用户选择开关通过会话投影/命令持久化，再在请求中注入固定数量互斥走向；不要把UI瞬时状态当会话事实。
- English: Persist a choice toggle through session projections/commands, then inject a fixed set of mutually exclusive branches into requests; transient UI state is not session truth.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-story-mode@1.0.0/cordis.patch.yml) · SHA-256 `5a3ae1350c1abf4898f40261fa6ccd654b038c485bbc93e29507c39cdecebb4b`

### dsh-study-mode@0.3.27

- 来源 / Source: [waspqj/dsh-study-mode](https://github.com/waspqj/dsh-study-mode)
- 中文：回答区分知识库正文、模型未验证知识和必要联网；关联卡不是答案，枚举查询与相关性检索分开，避免倒出整库。
- English: Distinguish knowledge-base text, unverified model knowledge and necessary web checks; linked cards are not answers, and separate enumeration from relevance retrieval to avoid dumping the whole store.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-study-mode@0.3.27/cordis.patch.yml) · SHA-256 `e608548a71271262517b802f69916e56279e264b41f731113fa332a51a84512e`

### dsh-super-code@0.3.11

- 来源 / Source: [artlexyoung/dsh-super-code](https://github.com/ArtlexYoung/dsh-super-code)
- 中文：长记忆通过宿主domain表提供服务，压缩与shell是独立组合面；README基准只代表维护者给定版本/预算的报告，不外推到当前任务。
- English: Provide long-memory through host domain tables and separate compaction/shell composition surfaces; README benchmarks apply only to the maintainer's reported versions and budgets, not this task.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-super-code@0.3.11/cordis.patch.yml) · SHA-256 `ec19a23b58749bdde8afd83dd937a19dc6ab752e3fff69d000c46c15e13cc274`

### dsh-task-planning-preset@1.2.0

- 来源 / Source: [tbtnct/dsh-task-planning-mode](https://github.com/TBTNCT/dsh-task-planning-mode)
- 中文：规划面保留提问、读写计划和证据工具但不挂代理执行链；解释patch与include的baseUrl差异，动态读取提示词保持原文而非在研究中eval。
- English: Keep questions, plan artifacts and evidence tools without a worker execution chain; distinguish patch/include baseUrl behavior and preserve dynamic prompt reads without evaluating them during research.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-task-planning-preset@1.2.0/cordis.patch.yml) · SHA-256 `eaa87d980797c9282945b4650f522f5e89be4030616b88c62f2f32892246510f`

### dsh-task-reliability@0.4.11

- 来源 / Source: [baosfeng/my-dsh-plugins](https://github.com/baosfeng/my-dsh-plugins)
- 中文：llm/stream 包装保持同步返回流，直接取得 next() 并返回 wrapStreamForLoop，而非 async 返回 Promise，以兼容 yield* 消费方；无 sessionId 时原样放行。可靠性插件也必须守住事件返回形状，不能只看 for-await 场景可用就认定流适配通用。
- English: The llm/stream wrapper synchronously obtains next() and returns wrapStreamForLoop instead of an async Promise, preserving compatibility with yield* consumers; requests without sessionId pass through. Reliability plugins must preserve event return shapes rather than assuming for-await compatibility covers all stream adapters.
- 风险 / Risk: 同文件的 autopilot 路径会拦截提问或在超时后模拟继续；不能把缺少用户回答当作授权，不建议移植这种语义。 / The same file's autopilot paths intercept questions or simulate continuation after timeouts. Missing user answers are not authorization, and that semantic should not be adopted.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-task-reliability@0.4.11/lib/index.js) · SHA-256 `2ba68cc1c0e8dca2945378b15dd9f0a77b4d1593e798216209eb19934072ca33`

### dsh-task-runner@1.1.0

- 来源 / Source: [jing-hy/dsh-task-runner](https://github.com/jing-hy/dsh-task-runner)
- 中文：任务登记在 session/created 认领任务根目录严格子目录中的非 subagent 会话，session/disposed 只解除关联而保留目录；TaskRegistry 启动时把消失目录标为 missing，通过串行写链上的临时文件+rename 保存清单，让 UI 分组有可恢复的宿主登记层。
- English: Task registration adopts non-subagent sessions in strict descendants of the task root on session/created and only detaches associations on session/disposed, retaining directories; TaskRegistry marks disappeared directories missing at startup and saves manifests through temporary-file-plus-rename operations on a serialized write chain, backing UI grouping with a recoverable host registry.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-task-runner@1.1.0/lib/index.js) · SHA-256 `87a5fda4919612c91bba53cd3a5bbe685dac48270d9d197e6f450b0461c47ebe`

### dsh-team-control@0.2.3

- 来源 / Source: [hunmer/dsh-team-control](https://github.com/hunmer/dsh-team-control)
- 中文：向 sidecar 镜像 agent/status 时先查 sessionMember 绑定；maintenance 的 idle 仍记 running，heldSessions 的 idle 仍记 interrupted，其余 idle 等稳定窗口再收尾，避免压缩或人工中断被误判可继续派工。工具、计时器、缓存和自启 sidecar 在 effect 中集中清理。
- English: Mirroring agent/status to a sidecar first checks sessionMember bindings. Maintenance idle remains running, heldSessions idle remains interrupted, and ordinary idle waits for a settling window before finalization, preventing compaction or operator interruption from becoming dispatch availability. Effects centralize cleanup of tools, timers, caches, and an owned sidecar.
- 风险 / Risk: 另见 prepend approval/request 转给 Lead 的路径；未核验其授权来源，不能把模型 Lead 裁决等同人工许可。 / A prepend approval/request path redirects decisions to a Lead; its authorization provenance was not verified, and model-Lead adjudication is not equivalent to human permission.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-team-control@0.2.3/index.js) · SHA-256 `79806de7ddae97b4bbb2ca7009ad26581d0efb98538de6939f5fa249a413657f`

### dsh-team-rooms@1.0.9

- 来源 / Source: [perrylink/dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)
- 中文：房间命令注册可选，缺 commands 时仍可保留工具面；敏感工具操作通过 requireApproval 要求精确 allowed-once，服务缺失或其他结果均抛稳定 RoomError。列表投影还会检查调用会话确为成员，值得分清命令作者授权、工具审批与成员可见性。
- English: Room commands are optional, leaving tools available without commands. Sensitive tool operations use requireApproval requiring exactly allowed-once; a missing service or other outcome throws a stable RoomError. List projection also checks that the calling session is a member, separating command-author authorization, tool approval, and membership visibility.
- 风险 / Risk: README 标为退休并推荐宿主原生 Agent Teams；只研究历史边界，不当作当前替代实现。 / The README marks it retired in favor of native Agent Teams; study the historical boundaries rather than adopt it as a current replacement.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-team-rooms@1.0.9/lib/index.js) · SHA-256 `dc87d1301cf384224953550a1823e63b915f99841cef2c3c88ead1112757f489`

### dsh-tool-manager@1.2.13

- 来源 / Source: [pan17/dsh-tool-manager](https://github.com/pan17/dsh-tool-manager)
- 中文：保存工具分组时合并 standing preset 工具与探针、活跃 Agent 观察到的作用域工具，避免误判空组；Agent 本地 guard 拒绝关闭或未开放组调用，组装提示词过滤对应说明段，tool_list 留在 host 层供 PTC 继承，目录与执行面共享作用域感知。
- English: Group saving merges standing-preset tools with scoped tools observed by probes and live Agents to avoid false empty groups; an Agent-local guard rejects disabled or unopened-group calls, prompt assembly removes corresponding guidance, and host-level tool_list supports PTC inheritance, keeping catalog and execution scope-aware.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dist/index.js](https://unpkg.com/dsh-tool-manager@1.2.13/dist/index.js) · SHA-256 `c33ff66d00b1b3a9164ae96c5144bd13b24497625330b56f435970cac3f70e66`

### dsh-tool-orchestrate@0.1.0

- 来源 / Source: [apheli0os/deepseek-harness-orchestrate](https://github.com/apheli0os/deepseek-harness-orchestrate)
- 中文：工具在 workflowEngine.start 前调用 normalizeTaskGraph，集中检查任务数、提示词长度、重复 id、缺失/自身依赖和对象根输出 schema；模型数据经 args 交给包内固定脚本。调用取消转给 run.cancel，finally 摘 abort 监听并 await run.dispose，图验证和运行资源结算是两道独立边界。
- English: Before workflowEngine.start, the tool calls normalizeTaskGraph to check task counts, prompt lengths, duplicate ids, missing/self dependencies, and object-root output schemas. Model data goes through args to a package-owned fixed script. Cancellation calls run.cancel; finally removes the abort listener and awaits run.dispose. Graph validation and runtime resource settlement are separate boundaries.
- 风险 / Risk: 未运行 DAG，也未据此宣称子任务结果内容真实或整套实现无注入风险。 / No DAG was executed; this does not establish truthful task results or absence of injection risks throughout the implementation.
- 片段 / Fragment: [dist/index.js](https://unpkg.com/dsh-tool-orchestrate@0.1.0/dist/index.js) · SHA-256 `2238c7c8f3a157b6badfcfccf1e8e212a42592cc05b966264131a4edfce3aafd`

### dsh-travel-planner@1.0.0

- 来源 / Source: [ausertdream/travelplanner](https://github.com/AusertDream/TravelPlanner)
- 中文：旅行模式先环境自检，必需key缺失停下、可选增强不阻断；密钥状态只返回脱敏前缀/长度，规划查询不代订代付。
- English: Check the environment first, block on missing required keys but not optional enhancements, expose only redacted key status, and separate planning/querying from booking/payment.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [preset/cordis.patch.yml](https://unpkg.com/dsh-travel-planner@1.0.0/preset/cordis.patch.yml) · SHA-256 `adec4ca252e924e1a77581777ff6e651a9804fb258edb3dfc60c10b9c586551c`

### dsh-tray-launcher@1.5.2

- 来源 / Source: [fancr-code/dsh-tray-launcher](https://github.com/fancr-code/dsh-tray-launcher)
- 中文：宿主 apply 先按 win32 门控，再以固定 argv 启动包内 tray.ps1；DataDir 指向 DSH_HOME/dsh-tray 而非版本化 npm 目录，dispose 调用 child.kill。可学习平台隔离与可更新数据目录的分离，但仅 kill 直接子进程不能据此证明整棵进程树已结算。
- English: Host apply gates on win32, launches the bundled tray.ps1 with fixed argv, stores DataDir under DSH_HOME/dsh-tray rather than the versioned npm directory, and calls child.kill on disposal. This illustrates platform isolation and update-stable data placement; killing the direct child does not prove whole-tree settlement.
- 风险 / Risk: 入口直接使用 node:child_process，未审计 PowerShell 脚本、互斥或自定位实现，未启动托盘。 / The entry uses node:child_process directly; the PowerShell script, mutex, and self-location logic were not audited, and no tray was launched.
- 片段 / Fragment: [src/plugin.js](https://unpkg.com/dsh-tray-launcher@1.5.2/src/plugin.js) · SHA-256 `2c3ccfca9f176f637bfa2346d90b9222322ebd1f260b9ce29a31098d8c7bdd5d`

### dsh-tsm-agent@0.2.4

- 来源 / Source: [ljwzhaoxiaoniu/dlr](https://github.com/ljwzhaoxiaoniu/DLR)
- 中文：语义业务面把L1实体结构、L2领域共识、L3题级SOP分层，先映射物理列再SQL，结论附实际查询证据；场景数据不被伪装成多套预设。
- English: The semantic business face separates L1 entity structure, L2 domain consensus and L3 question-level SOP, maps physical columns before SQL and attaches actual query evidence; scenario datasets do not become extra presets.
- 风险 / Risk: MCP网关在宿主顶层，后端不可达会failOnStartupError；需独立tsm-core-dlr服务和场景。Host启动逻辑可能向DSH_HOME写/清除匹配的AGENTS副本，属于跨预设副作用，不能照搬；未启动服务或执行SQL。 / The MCP gateway is host-level and failOnStartupError requires a separately running tsm-core-dlr service/scenario. Host startup may write/remove a matching DSH_HOME AGENTS copy, a cross-preset side effect not to adopt. No service startup or SQL execution occurred.
- 片段 / Fragment: [package.json](https://unpkg.com/dsh-tsm-agent@0.2.4/package.json) · SHA-256 `cdb4d263c39a4f9dbd5e8dddeacc30d2cbbf9ce554ecd919ef7182ff145d8702`

### dsh-web-search-zai@0.2.0

- 来源 / Source: [kenny2077/dsh-web-search-zai](https://github.com/kenny2077/dsh-web-search-zai)
- 中文：搜索适配注册到既有 ctx.web，不另造模型工具；配置 thunk 在每次搜索开始时只求值一次，让模式、端点和凭据解析共用操作级快照。coding-plan 与 REST 按 billingMode 分支，MCP 分支合并调用方取消、截止和卸载信号，并在 finally 清理计时器与活动集合。
- English: Search registers with existing ctx.web rather than another model tool; its configuration thunk is evaluated once at search start, giving mode, endpoint and credential resolution an operation-level snapshot. Coding-plan and REST branch on billingMode, while MCP combines caller cancellation, deadline and unload signals and clears timers and active-operation entries in finally.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-web-search-zai@0.2.0/lib/index.js) · SHA-256 `b9c500d064c9af52516112f55c1ca3cf1a677b2cd8f13d38f27ffeb3e2776987`

### dsh-webui-oauth@0.8.4

- 来源 / Source: [wu-hins/dsh-webui-oauth](https://github.com/WU-HINS/dsh-webui-oauth)
- 中文：与同类插件争用同一批 webServer 路由时选择"检测到冲突直接拒绝启动并打印修复指令"，而不是降级运行；这比静默半可用更可诊断。
- English: When competing for the same webServer routes, refuse to start and print repair instructions instead of degrading silently — far easier to diagnose than a half-working state.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-webui-oauth@0.8.4/index.js) · SHA-256 `849bb3fae0965a08407186c0d42adc16c4b59bcf52f415a06c44a9fbf5869f2b`

### dsh-whale-elite-preset@0.2.0

- 来源 / Source: [szytree0312/dsh-whale-elite-preset](https://github.com/SZYTree0312/dsh-whale-elite-preset)
- 中文：定位证据→改后回读→可复现命令三道门，把完整工具结果和更晚压缩用于保真，不把少token当唯一目标。
- English: Use locate-evidence→read-back→reproducible-command gates, preserving full tool outputs and delaying compaction rather than optimizing tokens alone.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://raw.githubusercontent.com/SZYTree0312/dsh-whale-elite-preset/1cd22961f1c14aa147ccf4e048bc462046b5ad48/cordis.patch.yml) · SHA-256 `ac4252dfae73c342fecca8235978fba8bbaf9970d1cdc65760fcb284df606fb5`

### dsh-whale-loli@0.9.18

- 来源 / Source: [wxzjss/dsh-whale-loli](https://github.com/wxzjss/dsh-whale-loli)
- 中文：不同人格使用独立记忆文件，滚动摘要设条数上限并归档；prompt语言约定不等于宿主有隐藏的思考语言开关。
- English: Use independent memory files per persona and bounded archived rolling summaries; prompt language conventions do not imply a hidden host reasoning-language switch.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-whale-loli@0.9.18/cordis.patch.yml) · SHA-256 `c8cdeb1789c1261909f86bcbe2b1edf127d2b4cac716c00726ecb98f3b1203dc`

### dsh-workspace-settings@1.0.3

- 来源 / Source: [thunderunruly/workspace-settings](https://github.com/Thunderunruly/workspace-settings)
- 中文：工作区默认模型覆盖每次重新决策；已有 requestHeader 或显式 pending 选择不同模型时让路，并在 system-prompt/assemble 与 agent/request 两处同步 provider/model，切路由前先去掉旧 reasoningEffort 以免跨模型遗留档位。
- English: Workspace-default model overrides are reconsidered each time, yield to an existing requestHeader or a different explicit pending selection, synchronize provider/model in both system-prompt/assemble and agent/request, and strip inherited reasoningEffort before routing to avoid carrying an old model's effort.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [index.js](https://unpkg.com/dsh-workspace-settings@1.0.3/index.js) · SHA-256 `6ffef2cba11cdf27f5de99e769555742c40cd01195c5c58c92268172fe73eb4c`

### dsh-yolo-mode@0.6.6

- 来源 / Source: [severuszh/dsh-yolo-mode](https://github.com/SeverusZh/dsh-yolo-mode)
- 中文：用模型自动裁决沙箱升权申请时，必须显式说明它只是在做建议判断，不改变平台既有的审批与权限语义。
- English: Automating sandbox-escalation adjudication must state plainly that it only advises; it does not alter the platform authorization or permission semantics.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/dsh-yolo-mode@0.6.6/lib/index.js) · SHA-256 `90ea6fa87ec6a11f5052cc8732e0c50def6983b4fb410d5ff2d0c4f0cf32a28a`

### dsh-zhouli@0.2.0

- 来源 / Source: [scp-cn-1059/dsh-zhouli](https://github.com/SCP-CN-1059/dsh-zhouli)
- 中文：经典语料用篇序/职官坐标检索引用，工作责任、协作接口与考核指标分清；引用必须回到原文而非记忆背诵。
- English: Retrieve classical text through section/office coordinates while separating duties, interfaces and measurable review; quotations must return to the source rather than memory.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-zhouli@0.2.0/cordis.patch.yml) · SHA-256 `bffc3e9218e65eb6435d7c3ee11a800c5594ccd601bad97ac50147ba40158450`

### gord-dsh-worktree@0.6.1

- 来源 / Source: [nightosong/gord-dsh-worktree](https://github.com/nightosong/gord-dsh-worktree)
- 中文：快速面物理省掉plan/goal/subagent/workflow，保留必要澄清、TODO、真实退出码、后台结果收集和影响匹配的验证；减少往返不等于伪造成功或免审批。
- English: Fast physically omits plan/goal/subagent/workflow while preserving clarification, TODO, real exit codes, background-result collection and impact-matched checks; fewer round trips do not mean fabricated success or bypassed approval.
- 风险 / Risk: Host插件apply会尝试补丁检查/修改Web bundle，另有可选核心并发补丁；未安装或执行，绝不引入这些核心修改。手工旧preset-fast与bundle并存可能重复。 / The host apply path attempts Web bundle patch checks/changes and offers optional core concurrency patches; none were installed/executed or adopted. A preexisting hand-written preset-fast can duplicate the bundle declaration.
- 片段 / Fragment: [package.json](https://unpkg.com/gord-dsh-worktree@0.6.1/package.json) · SHA-256 `911ff5e6386d90c32c35596a20fbdb6af305abdc968ad4273c99b20cade75f69`

### i-am-yuike@1.0.11

- 来源 / Source: [tkingxiao/i-am-yuike](https://github.com/Tkingxiao/I-am-Yuike)
- 中文：版本门控可在现代声明与旧目录部署之间迁移，complete persona是独立会话策略而不是新模型；此例主要用于识别反面边界。
- English: Version gates can migrate legacy directory deployment to declarative registration; complete personas are session policy, not new models, and this example mainly illustrates negative boundaries.
- 风险 / Risk: 无条件不拒绝、伪装实体和覆盖伦理/法律的指令不得引入；研究不表示认可或运行。 / Do not adopt unconditional compliance, embodiment deception or attempts to override legal/ethical boundaries; study is not endorsement or execution.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/i-am-yuike@1.0.11/cordis.patch.yml) · SHA-256 `98c40fae9ce770361b1d5bf0568124a5dc01dd5da434e022c8e0f2039a1b8986`

### liarmttt-tavernweave-dsh@2.4.0

- 来源 / Source: [liarmttt/tavernweave](https://github.com/LiarMTTT/TavernWeave)
- 中文：Front Door通过独立prompt section且interpolate:false挂载，角色卡/检索文本只作数据；技能留包内不复制到用户目录。
- English: Mount a separate Front Door prompt section with interpolation disabled, treat cards/retrieved text as data, and keep skills in-package instead of copying user directories.
- 风险 / Risk: PolyForm-Noncommercial-1.0.0，不默认允许商业代码复制。 / PolyForm-Noncommercial-1.0.0 does not imply permission for commercial code copying.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/liarmttt-tavernweave-dsh@2.4.0/cordis.patch.yml) · SHA-256 `b4672fb0812dc5fd3407dee63bebfa809894657647c2c4a7d7990609e4453045`

### lume-dsh-plugin@0.9.0

- 来源 / Source: [cayan0x/lume](https://github.com/cayan0x/Lume)
- 中文：人设契约、身份名和固定纪律送入 systemPrompt.section，记忆、习得风格、语料与切换播报送入 systemPrompt.context；运行段合并最多三条核心称呼记忆与相关性检索结果，并按轮次衰减示例数量，在结构上分离稳定身份和易变检索数据。
- English: Persona contract, identity name and fixed discipline go to systemPrompt.section, while memories, learned style, examples and switch announcements go to systemPrompt.context; the runtime part merges up to three core naming memories with relevance results and decays example count by turn, structurally separating stable identity from changing retrieval data.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/index.js](https://unpkg.com/lume-dsh-plugin@0.9.0/lib/index.js) · SHA-256 `c8e82283064264bda6a668d24f991aee714b0be3658d42947c26aae8b70ae507`

### oh-my-dsh-slim@0.8.9

- 来源 / Source: [ninipa/oh-my-dsh-slim](https://github.com/ninipa/oh-my-dsh-slim)
- 中文：运行时先按宿主base解析官方能力；仅对明确已退休行受控跳过，其他解析失败仍显式失败，异步注册晚到也能释放。一个预设不把五个角色另凑五套。
- English: Resolve native capabilities from the host base, skipping only explicitly retired rows while failing loudly for other resolution errors, and dispose late registrations; one preset does not become five extra presets because it has specialist roles.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [preset/preset.js](https://unpkg.com/oh-my-dsh-slim@0.8.9/preset/preset.js) · SHA-256 `6d6b73e367ad430258f646e157391ff552036db0801ac9efeae1f3745f1fdf5b`

## 产物与未完成项 / Artifacts and remaining work

- [sources.json](./sources.json)：紧凑来源、固定版本/commit、integrity/hash、原生片段与审阅决定；[sources.schema.json](./sources.schema.json) 给出机器结构。仓库中的 `reviews*.json` 是按轮次追加的人工笔记（基础轮与后续 `roundN`），后轮可更正前轮决定；审阅脚本按轮次而非文件名字典序合并。所有笔记均需对应真实缓存实现文件，不自动从标题生成。
  [sources.json](./sources.json) carries compact pins, integrity/hashes, native fragments and decisions; [sources.schema.json](./sources.schema.json) defines its machine structure. The `reviews*.json` files are human-authored notes appended by round (base notes, then later `roundN`); a later round may correct an earlier decision, and the audit merges by round rather than lexical filename order. Every note must cite a real cached implementation file; none is generated from titles.
- 静态门槛现为：100 套合格预设配置（来自 63 个项目）、106 个合格独立原生插件项目，缺口 0/0。两个"交集"数字含义不同：所选两批 100 项子集内互不重叠（0），但有 50 个所选预设仓库同时提供原生插件集成，不能宣称"两组完全无交集"。未运行任何研究对象，静态核验不等于安全审计或行为验证。
  Static thresholds now stand at 100 qualified preset configurations across 63 projects and 106 qualified independent native plugin projects (gaps 0/0). The two overlap numbers mean different things: the chosen 100-item subsets do not intersect (0), yet 50 selected preset repositories also ship native plugin integration, so "the groups are disjoint" is false. No target was run; static verification is not a security audit or behavioural validation.
