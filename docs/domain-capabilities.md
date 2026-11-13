# 领域专长与代码视觉 / Domain specialties and code media

[中文](#中文) · [English](#english)

## 中文

### 这次加强的是同一个全能模式

`1.7.0-dev.1` 仍是一个包、一个显示名「全能模式」、一个 `omni` 预设。新增的是**按需加载的领域方法**、一份**能力索引**，以及两个**可在本机真实运行的命令行工具**。没有第二套预设，没有把一百份人设拼进来。

原有推理选档、自适应保留、grilling 原文、权限与审批边界都没有改动。

### 十个领域的专业技能

| 技能 | 覆盖方向 |
|---|---|
| `omni-engineering` | 软件工程、架构、调试、测试、DevOps 与 CSV/JSON 数据契约 |
| `omni-game` | 游戏概念、GDD、实现、关卡、叙事、引擎、QA 与发布阶段 |
| `omni-cyber` | 防御、本地与明确授权的安全/网络/静态逆向；不含扫描器或提权 |
| `omni-documents` | 可溯源 Markdown、演示叙事与逐页视觉验收 |
| `omni-fiction` | 设定、人物、时间线、章节账本与连续性检查 |
| `omni-research` | 一手来源研究、论文阅读、学习诊断与引用覆盖 |
| `omni-personalization` | 依据用户草稿适配语气与陪伴方式；不虚构记忆或身份 |
| `omni-assistant` | 待办、会议可用性、旅行规划与清理风险清单 |
| `omni-molbio` | 本地 FASTA 格式、长度、歧义与 GC 统计 |
| `omni-business` | 实体/关系、业务共识与可证伪行动假设 |

另有 `omni-method`（复杂任务执行方法）与 `omni-code-media`（代码视觉）。

这些都是**方法**，不是自动获得的外部能力。每个领域的真实可用程度要看下面这份索引。

### 能力索引与四种成熟度

包内 `capabilities/catalog.json` 记录 100 套来源配置的引用、23 个能力条目及成熟度：

- **verified**：本地契约有独立测试。只证明该操作本身，不代表整个领域已认证。
- **needs-dependency**：需要明确的外部工具、账户或项目环境，当前未验收。
- **method-only**：只有方法与模板，不是自动执行或测试结论。
- **uncovered**：当前未覆盖，必须如实说明并研究或提出可选增强。

查看方式：

```sh
node <包根>/capabilities/runner.mjs list
node <包根>/capabilities/runner.mjs doctor          # 说明安装与验收区别
node <包根>/capabilities/runner.mjs doctor --test   # 真正跑本包契约测试
node <包根>/capabilities/runner.mjs run data.validate --json '{"format":"csv","text":"id\nA\n","fields":[{"name":"id","type":"string"}]}'
```

`run` 需要 `--input` 或 `--json` 二选一；写文件必须显式 `--out <新路径> --allow-write`，且不与已有文件冲突。`--root` 只用于防止误写到范围外，**不是安全沙箱**；文件写入继续遵守宿主原有权限与审批。

典型边界：引用结构通过不等于来源真实；提取到 IP 不等于做过扫描或归因；游戏数值初筛不等于实机平衡；序列统计不是临床或功能结论；Markdown 不是 PPTX；ICS 草稿不等于已导入日历或预约成功。

### 代码绘制图片与视频

不调用图像或视频生成模型，用代码产出二维成品：

- 场景源码生成静态 SVG → 由明确版本的可选 `@resvg/resvg-js` 栅格化为 PNG → FFmpeg 编码 GIF/MP4。
- **有可用且授权的素材就用素材，没有就从零用代码制作**；素材路径做规范化与越界检查。
- 视频音轨需求未明确时必须先询问；已回答的不重复问。静态图片不触发无关的音频询问。
- 交付可编辑源码、必要输入/素材、成品和可复跑命令。字体证明图只用于核对字形可读性，节选有上限并以 `…` 标注截断，不是排版样张。

环境需要显式准备，绝不在预设激活或渲染时静默安装：Node 24+、可选工具环境中的 resvg，以及用户自备的 FFmpeg/ffprobe。设置方式见包内 `media/README.md`。

```sh
node <包根>/media/runner.mjs doctor --tool-env <授权工具环境> --ffmpeg /usr/bin/ffmpeg --ffprobe /usr/bin/ffprobe
node <包根>/media/runner.mjs render --project <project.json> --output-root <已授权目录> --name <新作业名> --tool-env <授权工具环境>
node <包根>/media/runner.mjs validate --artifact <成品目录> --tool-env <授权工具环境>
```

场景源码在受管子进程中执行，**不是沙箱**，也不导入 DSH Host。只运行按原有 shell 策略获准的源码。渲染会真实编码、探测、完整解码并抽取关键帧；缺依赖会明确标记阻塞，不用其他格式冒充。取消与超时会清理本次作业自己的中间文件，不删除你的输入。

### 验证到了哪一层

- 能力目录：63 项本地契约测试通过。
- 代码视觉：22 项测试在真实 resvg 与 FFmpeg 下通过，0 跳过，含真实中文渲染、GIF/MP4 编码解码、超时、取消、碰撞与不安全 SVG 拒绝。
- 原生集成：11 个专业技能、能力索引与两个运行器都能从安装包被发现并加载。
- 领域工程验收：23 个案例全部通过，但这是 **CLI 契约验收**。

**尚未完成**：12 个真实模型领域/跨域任务仍是 `not-run`。因此目前能证明的是"方法与本地操作真实可用"，还不能证明模型会正确自动选用、专业水平提升或旧 40 题涨分。来源研究是静态审阅，未安装或运行任何被研究对象。

## English

### The same Omni preset, strengthened

`1.7.0-dev.1` is still one package, one display name (`全能模式`) and one `omni` preset. What is new: **on-demand domain methods**, a **capability index**, and two **locally runnable command-line tools**. No second preset; one hundred personas were not concatenated.

Reasoning selection, adaptive retention, the upstream grilling text and authorization/approval boundaries are unchanged.

### Ten domain skills

| Skill | Focus |
|---|---|
| `omni-engineering` | Software engineering, architecture, debugging, testing, DevOps and CSV/JSON data contracts |
| `omni-game` | Game concept, GDD, implementation, levels, narrative, engine, QA and release stages |
| `omni-cyber` | Defensive, local and explicitly authorized security/network/static RE; no scanner or privilege escalation |
| `omni-documents` | Traceable Markdown, presentation narrative and per-page visual acceptance |
| `omni-fiction` | Canon, characters, timeline, chapter ledgers and continuity checks |
| `omni-research` | Primary-source research, paper reading, learning diagnosis and citation coverage |
| `omni-personalization` | Tone and companionship adapted from user drafts; no invented memory or identity |
| `omni-assistant` | Todos, meeting availability, travel planning and cleanup risk manifests |
| `omni-molbio` | Local FASTA format, length, ambiguity and GC statistics |
| `omni-business` | Entities/relations, business consensus and falsifiable action hypotheses |

Plus `omni-method` (complex-task execution) and `omni-code-media` (code media).

These are **methods**, not external capability gained automatically. Real availability per domain is in the index below.

### Capability index and four maturity states

`capabilities/catalog.json` records references to the 100 source configurations, 23 capability entries and their maturity:

- **verified**: the local contract has independent tests. This proves that operation only, not domain certification.
- **needs-dependency**: requires explicit external tools, accounts or project environments; not accepted here.
- **method-only**: method and templates only, not automatic execution or a test result.
- **uncovered**: not covered; must be disclosed, researched or proposed as an optional enhancement.

```sh
node <bundle-root>/capabilities/runner.mjs list
node <bundle-root>/capabilities/runner.mjs doctor          # explains installed vs accepted
node <bundle-root>/capabilities/runner.mjs doctor --test   # actually runs package contract tests
node <bundle-root>/capabilities/runner.mjs run data.validate --json '{"format":"csv","text":"id\nA\n","fields":[{"name":"id","type":"string"}]}'
```

`run` takes exactly one of `--input` or `--json`. Writing requires an explicit `--out <new-path> --allow-write` and never overwrites an existing file. `--root` guards against accidental out-of-scope writes and is **not a security sandbox**; the host's own permission and approval rules still apply.

Limits to keep: passing citation structure is not source truth; an extracted IP is not a scan or attribution; preliminary game arithmetic is not playtesting; sequence statistics are not clinical or functional conclusions; Markdown is not PPTX; an ICS draft is not a calendar import or successful booking.

### Drawing images and video with code

No image or video generation models; 2D artifacts are produced by code:

- Scene source renders static SVG frames → an explicitly pinned optional `@resvg/resvg-js` rasterizes PNG → FFmpeg encodes GIF/MP4.
- **Use available, authorized assets when they exist; otherwise create from scratch in code.** Asset paths are canonicalized and containment-checked.
- Ask before assuming audio for video; do not re-ask once answered. Still images trigger no unrelated audio question.
- Deliver editable source, needed inputs/assets, final artifacts and a reproduce command. The font proof only checks glyph readability; its excerpt is capped and marks truncation with `…`, so it is not a layout specimen.

The environment is prepared explicitly and never installed silently at preset activation or render time: Node 24+, resvg in an optional tool environment, and your own FFmpeg/ffprobe. See `media/README.md`.

```sh
node <bundle-root>/media/runner.mjs doctor --tool-env <authorized-tool-env> --ffmpeg /usr/bin/ffmpeg --ffprobe /usr/bin/ffprobe
node <bundle-root>/media/runner.mjs render --project <project.json> --output-root <authorized-dir> --name <new-job-name> --tool-env <authorized-tool-env>
node <bundle-root>/media/runner.mjs validate --artifact <artifact-dir> --tool-env <authorized-tool-env>
```

Scene source runs in an owned child process. That is **not a sandbox**, and it is never imported into DSH Host. Only run source approved under the existing shell policy. Rendering really encodes, probes, fully decodes and extracts key frames; missing dependencies are explicit blocks rather than a format substitution. Cancellation and timeouts clean only this job's own intermediates, never your inputs.

### Verification level reached

- Capability directory: 63 local contract tests pass.
- Code media: 22 tests pass under real resvg and FFmpeg with 0 skipped, covering real Chinese rendering, GIF/MP4 encode/decode, timeouts, cancellation, collisions and unsafe-SVG rejection.
- Native integration: all 11 specialist skills, the capability index and both runners are discoverable and loadable from the installed package.
- Domain engineering acceptance: 23 cases pass — but this is **CLI contract acceptance**.

**Not yet done**: the 12 real-model domain/cross-domain tasks remain `not-run`. What is proven today is that the methods and local operations genuinely work, not that the model selects them correctly, that professional quality improved, or that the original 40 cases gained scores. Source research was static review; no researched subject was installed or executed.
