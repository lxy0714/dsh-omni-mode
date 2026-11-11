# DSH 静态来源研究 / DSH static source research

## 已确认的计数单位 / Confirmed counting units

用户经 Lead 明确确认：目标是 **100 套真正可独立选择、配置实质不同的 Agent 预设**，项目数另列；另选 **100 个独立原生 DSH 插件项目**。不同版本、改名、纯翻译与同构 fork 不凑数；同仓多套可计配置而不能伪装成多个项目。两组交集单列，不宣称 200 个不同仓库。

The user confirmed through the Lead: **100 independently selectable, substantively distinct Agent preset configurations**, with projects counted separately, plus **100 independent native DSH plugin projects**. Repeated versions, renames, pure translations and isomorphic forks do not count. Multiple presets in one repository are configurations, not multiple projects. Cross-group overlap is explicit; no claim of 200 repositories is made.

## 实际进度 / Actual progress

状态 / Status: **partial**. 证据生成时间 / Evidence generated: 2026-11-11T15:54:23.074Z.

| 指标 / Metric | 实际 / Actual |
| --- | --- |
| 目录线索 / Catalog leads | 5324 |
| 选择性尝试包数 / Selected packages attempted | 348 |
| 原始声明/注册配置池 / Raw declaration/registration pool | 141 |
| 精确哈希去重配置池（非最终合格数）/ Exact-hash pool, not final eligibility | 140 |
| 预设项目池（谱系未穷尽）/ Preset project pool, lineage not exhaustive | 63 |
| 原生插件项目池（非学习完成数）/ Native plugin pool, not completed studies | 306 |
| 已审阅且合格预设配置 / Reviewed qualified preset configurations | 90 |
| 对应预设项目 / Corresponding preset projects | 56 |
| 已审阅且合格原生插件项目 / Reviewed qualified native plugin projects | 19 |
| 预设缺口 / Preset gap | 10 |
| 插件缺口 / Plugin gap | 81 |
| 实读学习点项目数 / Projects with reviewed learning points | 82 |
| 最终两组交集项目 / Selected cross-group overlapping projects | 0 |

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
- 中文：共享看板依赖Cordis服务键而非模块全局，更新路由先校验id并以落盘快照跨重启恢复。
- English: Materialize shared boards through a Cordis service instead of module globals, validate IDs in update routes, and recover from persisted snapshots.
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
- 中文：协作由Codex主动请求已授权工作区，DSH仅以prefix路由承接；不得把跨工具协作变成唤醒闲置外部会话。
- English: Codex initiates requests to authorized workspaces through a DSH prefix route; cross-tool collaboration must not imply waking idle external sessions.
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
- 中文：窄工具面只给novel_read/apply_change，写入以SHA版本和一次性原生审批保护；agent与preset作用域分别负责释放限制。
- English: Expose only novel_read/apply_change, guarding writes with SHA revisions and one-shot native approvals; agent and preset scopes separately dispose restrictions.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [lib/agent.js](https://unpkg.com/@ethanyoq/dsh-ai-novel-writer@0.1.0/lib/agent.js) · SHA-256 `e0f9baac3a7364eab31b7b6c411d5ebe5eeaf7b11d6991dc11199efe3e8593fd`

### @fallnstrelitzia/dsh-chat-settings@1.2.0

- 来源 / Source: [fallnstrelitzia/dsh-chat-settings](https://github.com/FallnStrelitzia/dsh-chat-settings)
- 中文：会话级prompt变换先await下游组装并校验对象形状，request钩子绑定agent作用域，不靠改全局配置实现单会话覆盖。
- English: Await downstream prompt assembly and validate its shape; bind request hooks to the agent scope instead of changing global settings for per-chat overrides.
- 风险 / Risk: package未声明许可证，README徽章不能替代完整许可核验。 / Package declares no license; README badges are not a substitute for full license verification.
- 片段 / Fragment: [index.js](https://unpkg.com/@fallnstrelitzia/dsh-chat-settings@1.2.0/index.js) · SHA-256 `3f0c2594045609f9feefff4870f4b77f87198ced616f90344f75fce4a938eef6`

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

### @godv61/dsh-task-engine@0.40.1

- 来源 / Source: [godv61/dsh-task-engine](https://github.com/godv61/dsh-task-engine)
- 中文：工程persona要求先声明analysis/implementation意图，并以源码行范围和hash冻结证据，避免用一段自述证明完成。
- English: Declare analysis versus implementation intent first, then freeze evidence using source line ranges and hashes rather than self-reported completion.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@godv61/dsh-task-engine@0.40.1/cordis.patch.yml) · SHA-256 `5af84d2efb2a4f95484e06faed9ac77a65d528df999a1d82d53e07ea6b278de4`

### @goodjin2/dsh-superpowers@0.3.1

- 来源 / Source: [goodjin/dsh-superpowers](https://github.com/goodjin/dsh-superpowers)
- 中文：将技能阶段和delegate_skill绑定，使不同开发技能可选不同子代理模型；应按任务激活而非全局强塞流程。
- English: Bind skill stages to delegate_skill so different development skills can choose different worker models; activate per task instead of globally imposing the workflow.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@goodjin2/dsh-superpowers@0.3.1/cordis.patch.yml) · SHA-256 `fa7b7662cb0d304931762929af602359f3d960c9cd2644642c193532316fdad3`

### @ifrankwang/openspec-agents@1.5.0

- 来源 / Source: [ifrankwang/openspec-agents](https://github.com/ifrankwang/openspec-agents)
- 中文：开发与审查是不同物理agent，工具未挂载时应报告而不是在shell寻找隐藏工具；身份与验收职责要显式传递。
- English: Separate implementation and review into physical agents; report missing tools instead of hunting hidden installs, and pass identity and acceptance duties explicitly.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [dsh/cordis.patch.yml](https://unpkg.com/@ifrankwang/openspec-agents@1.5.0/dsh/cordis.patch.yml) · SHA-256 `e7d1eb157a045524463db3ea4a8707db5b2e9705f3f054a09a2e15cd4f993a9f`

### @jhcai11/oh-my-dsh@0.1.2

- 来源 / Source: [sevenology7/oh-my-dsh](https://github.com/SeveNOlogy7/oh-my-dsh)
- 中文：其四个主面分别承担统筹、深度实现、访谈规划、按批准计划派工；另外七个明写delegation target，不应混作十一套独立用户工作模式。
- English: Four primary faces separate orchestration, deep implementation, interviews/planning, and execution of an approved plan; seven explicit delegation targets must not be conflated with eleven independent user modes.
- 风险 / Risk: 四主面仍需追踪共享运行时的role配置映射才可最终计数；当前暂不批准。 / The four primary faces still require tracing role configuration through the shared runtime; none are approved yet.
- 片段 / Fragment: [presets/omd-sisyphus.patch.yml](https://unpkg.com/@jhcai11/oh-my-dsh@0.1.2/presets/omd-sisyphus.patch.yml) · SHA-256 `c592e3231a0673e2a5563fab0b094a01183958e335ee3b5233a392e86065b255`

### @maximehu97/dsh-meeting@0.3.0

- 来源 / Source: [maximehu97/dsh-meeting](https://github.com/maximehu97/dsh-meeting)
- 中文：把个人代理的对外信息压成可用/勉强/需本人点头三态，保留原始隐私本地并把例外决定交还本人。
- English: Reduce cross-agent availability to three states while retaining private reasons locally and returning exceptions to the person.
- 风险 / Risk: README明确无鉴权、仅可信局域网；不得当安全通信方案引入。 / README explicitly says no authentication and trusted LAN only; do not adopt it as a secure communications design.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@maximehu97/dsh-meeting@0.3.0/cordis.patch.yml) · SHA-256 `35ae937e6c9bea7088096a2da2bfe97a7918c364f96881f78b28620283f12e03`

### @nilesh32236/dsh-squad@1.1.0

- 来源 / Source: [nilesh32236/dsh-squad](https://github.com/nilesh32236/dsh-squad)
- 中文：跨工作区worker由幂等名称绑定，报告必须包含答案本身；reviewer区分观察与推断，auditor把每个数字和done声明重新对照原始证据。
- English: Bind cross-workspace workers by idempotent names and require reports to contain the answer itself; reviewers separate observation from inference, while auditors recheck numbers and done claims against primary evidence.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@nilesh32236/dsh-squad@1.1.0/cordis.patch.yml) · SHA-256 `d6325c56c702273fd078e3ab9f63af81b97b297d2f29f23a6e2587327d7469eb`

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

### @yujp_vc/ppt-assistant@1.8.0

- 来源 / Source: [yujpvc/ppt-assistant](https://github.com/YujpVc/ppt-assistant)
- 中文：把演示文稿生成收敛为单独模式，保留既有权限而不重复请求提权；生成后做逐页渲染复核，不修改标准模式。
- English: Isolate presentation generation in its own mode, respect existing permissions without redundant escalation, and render/review slides without modifying standard mode.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/@yujp_vc/ppt-assistant@1.8.0/cordis.patch.yml) · SHA-256 `82d223d6ea149bb5fa66f4613225124138102a05a0e643f85426261e50e02d67`

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

### dsh-aiyayi@1.5.20

- 来源 / Source: [bayihy/dsh-aiyayi](https://github.com/bayihy/dsh-aiyayi)
- 中文：伙伴人格、执行者和只读检索员分别有不同工具面；核心记忆常驻、分类档案按需读取，摘录员必须保留数字/页码而不替派发者下结论。
- English: Companion, executor, and read-only retriever have distinct tool surfaces; keep core memory resident and load archives on demand, requiring exact numbers/pages in extracts without delegating conclusions to the retriever.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-aiyayi@1.5.20/cordis.patch.yml) · SHA-256 `bd7aae4c538e9447e7921f891b80d2c642472930126ff4c099a18934c6b68ca3`

### dsh-atn@0.6.3

- 来源 / Source: [ff66ccff/dsh-atn](https://github.com/ff66ccff/dsh-ATN)
- 中文：用atn_start显式建立共享目标和网络/节点/任务身份，并把协作限制在独立预算内；README的企业安全效果仍须另行验证。
- English: Use atn_start to establish a shared objective and network/node/task identities, keeping collaboration within independent budgets; enterprise security claims still require separate verification.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-atn@0.6.3/cordis.patch.yml) · SHA-256 `7da1ff9d0769aa844117e5eaf9bb0d26674f13bbcb0e5efeee5fff3eea9a829d`

### dsh-awesome-preset@2.5.0

- 来源 / Source: [jaylor-wang/dsh-awesome-preset](https://github.com/Jaylor-Wang/dsh-awesome-preset)
- 中文：日常编码面主动移除目标、计划、子代理和TODO，减少编排开销；同时保留不可逆发布操作必须核对远端事实的边界。
- English: Remove goals, planning, workers and TODO from routine coding to reduce orchestration overhead, while retaining read-only remote verification for irreversible publishing operations.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-awesome-preset@2.5.0/cordis.patch.yml) · SHA-256 `eba5ecab30c167a0bc284df2e985c47209d45c845837b636aace3e23d18c126c`

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

### dsh-molbio-tools@0.25.0

- 来源 / Source: [lovy2004/dsh-molbio-tools](https://github.com/lovy2004/dsh-molbio-tools)
- 中文：领域模式将可复核计算工具与生物学结论分界，工具报告估算模型/范围，图可选回附供视觉核对而不默认当作科学验证。
- English: Separate reproducible domain calculations from biological conclusions, report estimation models/limits, and optionally attach plots for visual checking without calling that scientific validation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-molbio-tools@0.25.0/cordis.patch.yml) · SHA-256 `dfa2d8ce00c61e6111a8338f3fa74929bd00daf251becf81410272a795beeaa2`

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

### dsh-pi-mode@0.3.5

- 来源 / Source: [fujingzhai/youxia-dsh-plugins](https://github.com/fujingzhai/youxia-dsh-plugins)
- 中文：共用核心组合，通过编辑器能力与交付通道形成Pi、Pi+、IM三种实质工具面，监听tools/change刷新实际可用能力，而非复制整份模式。
- English: Share a core composition while varying edit capabilities and delivery channels across Pi, Pi+ and IM, refreshing real capabilities on tools/change rather than copying entire modes.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-pi-mode@0.3.5/cordis.patch.yml) · SHA-256 `f7d7fe9357867e2550e1e57a87de0d915b2e44ff758078612f4c49eb205cb020`

### dsh-plugin-agent-collaboration@0.5.0

- 来源 / Source: [leo-sail/dsh-plugin-agent-collaboration](https://github.com/Leo-sail/dsh-plugin-agent-collaboration)
- 中文：持久Bot与coordinator分成不同工具面（14行与10行），将房间协作与临时子代理分清；来源只是社区实现，不冒充官方保证。
- English: Separate persistent Bots and coordinator into different tool surfaces (14 versus 10 rows), distinguishing room collaboration from temporary workers without implying official guarantees.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-agent-collaboration@0.5.0/cordis.patch.yml) · SHA-256 `a94c7c4de7eec5fc975b3a24f5dfeed33eed16908edd78dac2dca1e003f341f0`

### dsh-plugin-dev-workflow@0.2.6

- 来源 / Source: [yuna78/dsh-plugin-dev-workflow](https://github.com/yuna78/dsh-plugin-dev-workflow)
- 中文：Request→Feedback→Task→Verify→Completion逐环留原话与真实退出码，反馈不自动升格偏好/规范，知识晋升要明确确认。
- English: Preserve verbatim requests/feedback and actual exit codes across Request→Feedback→Task→Verify→Completion; feedback does not automatically become durable policy, and knowledge promotion needs confirmation.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-dev-workflow@0.2.6/cordis.patch.yml) · SHA-256 `8a08dbbd5489455a1a141d35b12d3954acb3b536b3353ffa7c7f0783a509cf8e`

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

### dsh-plugin-slayer@0.1.0

- 来源 / Source: [yuna78/dsh-slayer](https://github.com/yuna78/dsh-slayer)
- 中文：持久teammate与一次性subagent工具面在agent创建时加调用guard，硬隔离比仅在persona里要求更可审计。
- English: Install invocation guards at agent creation to separate persistent teammate and one-shot subagent surfaces, making isolation more auditable than persona-only instructions.
- 风险 / Risk: 不引入谄媚人格或强制凑满并发的惩罚机制；研究硬隔离而非照搬价值取向。 / Do not adopt sycophantic personas or punishment for unused concurrency; study hard isolation, not those behavioral values.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-plugin-slayer@0.1.0/cordis.patch.yml) · SHA-256 `768161133e97264d256f889720d306981ab301ea6c63c1fec38d6bac38cbe3b9`

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

### dsh-stack@0.3.3

- 来源 / Source: [58fly/dsh-stack](https://github.com/58fly/dsh-stack)
- 中文：把always-on技能缩为常驻persona，细则按需加载；turn-stopping检查是否有真实验证和重复失败，并先排除不适用子会话。
- English: Condense always-on guidance into a resident persona while loading details on demand; check real verification and repeated failures at turn-stopping, excluding inapplicable child sessions first.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-stack@0.3.3/cordis.patch.yml) · SHA-256 `42c0739b7f6f3575d9ebdb9a360e60e26b0d96836688ab467e286473e20753bd`

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

### dsh-travel-planner@1.0.0

- 来源 / Source: [ausertdream/travelplanner](https://github.com/AusertDream/TravelPlanner)
- 中文：旅行模式先环境自检，必需key缺失停下、可选增强不阻断；密钥状态只返回脱敏前缀/长度，规划查询不代订代付。
- English: Check the environment first, block on missing required keys but not optional enhancements, expose only redacted key status, and separate planning/querying from booking/payment.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [preset/cordis.patch.yml](https://unpkg.com/dsh-travel-planner@1.0.0/preset/cordis.patch.yml) · SHA-256 `adec4ca252e924e1a77581777ff6e651a9804fb258edb3dfc60c10b9c586551c`

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

### dsh-zhouli@0.2.0

- 来源 / Source: [scp-cn-1059/dsh-zhouli](https://github.com/SCP-CN-1059/dsh-zhouli)
- 中文：经典语料用篇序/职官坐标检索引用，工作责任、协作接口与考核指标分清；引用必须回到原文而非记忆背诵。
- English: Retrieve classical text through section/office coordinates while separating duties, interfaces and measurable review; quotations must return to the source rather than memory.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [cordis.patch.yml](https://unpkg.com/dsh-zhouli@0.2.0/cordis.patch.yml) · SHA-256 `bffc3e9218e65eb6435d7c3ee11a800c5594ccd601bad97ac50147ba40158450`

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

### oh-my-dsh-slim@0.8.9

- 来源 / Source: [ninipa/oh-my-dsh-slim](https://github.com/ninipa/oh-my-dsh-slim)
- 中文：运行时先按宿主base解析官方能力；仅对明确已退休行受控跳过，其他解析失败仍显式失败，异步注册晚到也能释放。一个预设不把五个角色另凑五套。
- English: Resolve native capabilities from the host base, skipping only explicitly retired rows while failing loudly for other resolution errors, and dispose late registrations; one preset does not become five extra presets because it has specialist roles.
- 风险 / Risk: 仅学习机制；未运行，需单独做兼容性和权限验证。 / Study the mechanism only; not run, with compatibility and permission validation still required.
- 片段 / Fragment: [preset/preset.js](https://unpkg.com/oh-my-dsh-slim@0.8.9/preset/preset.js) · SHA-256 `6d6b73e367ad430258f646e157391ff552036db0801ac9efeae1f3745f1fdf5b`

## 产物与未完成项 / Artifacts and remaining work

- [sources.json](./sources.json)：紧凑来源、固定版本/commit、integrity/hash、原生片段与审阅决定；[sources.schema.json](./sources.schema.json) 给出机器结构。[reviews.json](./reviews.json) 与 [reviews.plugins.json](./reviews.plugins.json) 是人工笔记，不自动从标题生成。
  [sources.json](./sources.json) carries compact pins, integrity/hashes, native fragments and decisions; [sources.schema.json](./sources.schema.json) defines its machine structure. [reviews.json](./reviews.json) and [reviews.plugins.json](./reviews.plugins.json) contain human-authored notes, not title-generated guesses.
- 当前仍缺 10 套经审阅合格预设、81 个经审阅独立原生插件项目；下一步先完成缓存里的未审阅 README+关键片段、动态注册实证、纯翻译/同构谱系排除，再从剩余候选补差。不得将内部worker或扫描数量直接换算成达标。
  Still missing 10 reviewed qualified presets and 81 reviewed independent native plugin projects. Next review cached README/key fragments, resolve dynamic registration, remove translation/isomorphic lineages, then fill remaining gaps from additional leads. Internal workers and scan counts must not be converted into completion.
