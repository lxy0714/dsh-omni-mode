# 增强证据与未证事项 / Enhancement evidence and unproven claims

[中文](#中文) · [English](#english)

## 中文

### 本文回答什么

`1.7.0-rc.1` 声称加强的是**同一个**全能模式。这里逐条列出：哪些增强是真实执行过的、哪些只是方法或尚未验证，以及"关键无退步"具体覆盖到哪一层。

所有记录均可在本仓库复现，命令附在每节。没有使用付费模型调用完成的项目会明确标注。

### 三类真实增强（均已实际执行）

**一、结构化数据操作真实可用。** 不是"写了函数"，而是真的启动包内 CLI，用合成输入跑通并核对输出。

- 23 个工程案例全部通过，含正向结果、错误拒绝（未闭合引号、循环依赖、非法控制字符）与边界值。
- 运行器会记录**实际执行的源码哈希**；本次运行期间源码未变化（`sourceStable: true`），说明结果对应的是同一份代码。
- 复现：`node scripts/benchmark/accept-domains.mjs`

**二、代码视觉链路真实出片。** 不调用任何图像或视频生成模型。

- 22 项测试在真实 resvg 2.6.2 + FFmpeg 6.1.1 下通过，**0 跳过**，覆盖真实中文渲染、GIF/MP4 编码、完整解码、超时、取消、目录碰撞、不安全 SVG 拒绝、缺依赖明确阻塞。
- 从**解包后的安装包**独立跑通端到端：中文 SVG/PNG/GIF/MP4 产出，MP4 为 h264/yuv420p、24 帧、2.000 秒，GIF 24 帧，PNG 签名与 480×350 尺寸正确，`.complete.json` 提交标记存在。
- 画面已用读图工具实际查看：中文正常显示；字体证明图曾把 `values` 截成 `v`，经像素测量确认右边距 132px、并非裁切，而是取样卡在固定字符数，已改为用 `…` 明确标注截断并加入尺寸断言。
- 复现：设置 `OMNI_MEDIA_TOOL_ENV` / `OMNI_MEDIA_FFMPEG` / `OMNI_MEDIA_FFPROBE` / `OMNI_MEDIA_TEST_FONT` 后运行 `node --test media/render.test.mjs media/safety.test.mjs`

**三、领域方法与能力索引在真实 Harness 中可发现、可加载。**

- 真实 DSH 服务、独立进程创建与恢复两种场景下，11 个专业技能、能力索引 `capabilities/catalog.json` 与两个运行器都从**安装包**解析到确切文件并加载。
- 对每个技能做的是**路径与正文严格比对**，且项目内放置同名诱饵，确保不是被外部同名文件冒充。
- 能力索引含 100 套来源配置引用与 23 个能力条目，用四种成熟度区分真实状态。
- 复现：`node integration.mjs`

### 字体路径越界被收紧

审核素材授权时发现不一致：素材路径会拒绝 `../../etc/passwd`，但**字体路径可以直接指向项目外任意可读文件**（实测 `/etc/hostname` 被接受）。修复为：项目内字体与素材同样做包含性检查；项目外字体必须用绝对路径并显式声明 `externalAuthorization: true`。

修复过程还暴露出第二个问题：运行器把字体快照传给 worker 时丢掉了授权字段，导致合法授权也会失效。两处已一并修正，并新增回归测试覆盖"相对路径逃逸被拒 / 绝对路径未授权被拒 / 显式授权通过"三种情况。

### 一个被修掉的假通过缺陷

排查领域夹具时发现：嵌套运行 `node --test` 会继承 `NODE_TEST_CONTEXT`，导致子进程**不执行任何测试就返回 0**。这曾让 `doctor --test` 在仓库测试内部报出 `accepted: true`，实际什么都没跑——直接威胁"已验证"的诚信。

已修复：自检子进程显式移除该变量；领域夹具测试同样处理。并加了回归测试**直接证明这个陷阱存在**（继承上下文时故意失败的测试返回 0，移除后返回非 0），避免以后再次静默失效。修复后 `doctor --test` 在两种上下文下都产出约 4900 字节的真实测试日志。

### 领域夹具可执行性

12 个领域/跨域案例过去只有题面、没有可运行输入，无法真正执行。现已补齐 34 个自包含合成夹具（无第三方代码），并验证：

- 工程案例的初始状态**确实失败**，且一个最小修复能让它通过——证明案例可解、判据有效。
- 游戏、小说、分子生物（DNA/RNA 两种字母表）、日历、数据转换与校验等夹具都能被真实操作消费，数值正确。
- 案例校验强制每个任务必须有夹具目录和 README，防止以后出现"无法执行的空壳案例"。

模型侧任务现已全部尝试，但存在中断、评分草案冲突及部分交付缺陷；执行不等于通过，详见[执行复核](domain-run-results.md#中文)。

### "关键无退步"覆盖到哪一层

已确认：

- `quality.js`、`adaptive.js`、`pool.js` 与上游 grilling 原文**自 v1.5.0 起字节未变**（SHA-256 见下）。
- 仓库测试 263 项全过；能力契约 64 项全过；真实渲染 22 项全过。
- 原生集成仍验证推理选档、自适应保留、压缩事务、会话持久化、服务隔离，无泄漏。
- 安装包消费、同名技能诱饵拒绝仍通过；CI 在 `7863c55` 与 `2a8ad02` 两次提交上双 Node 矩阵均通过。

核心文件 SHA-256（与 v1.5.0 一致）：

```
quality.js              f0bb863148310169fd93e71974e003e34135be1eac8aaebad19950302cabb200
adaptive.js             05a44856c3d11240d1fd590d64f56f71796597439f8d46d08a5a6d3f47f3d66a
pool.js                 451c9591174fc0fc25381f040fc6ddff93930ea0fcc9fe1ef1364df5498a9d49
skills/grilling/SKILL.md a146842ed93ca43d833550fa9adf02e58cb63c83fea9d4b4522995b82242d4e2
```

**未确认**：真实模型行为层面的无退步。旧 40 题的历史成绩保持不变，此前记录的候选关键退步（如 research-02）不被本次工程验收推翻。

### 明确未证明的事

- **整体行为验收仍未通过**。12 项受指导任务不公布总通过率；后续三个无能力提示的原生探针有产物复核及自主方法选择证据，取消/交付后错误与恢复分列。未改动原40题的防护前/后对照仍有关键警报，不据此声称专业提升或整体无退步；详见[执行复核](domain-run-results.md#中文)。
- 领域工程验收是 **CLI 契约验收**，不是专业能力认证。引用结构通过不等于来源真实；提取 IP 不等于扫描或归因；游戏数值初筛不等于实机平衡；序列统计不是临床/功能结论；Markdown 不是 PPTX；ICS 草案不等于已预约成功。
- 来源研究是**静态审阅**：被研究对象全部未安装、未 import、未运行。
- 依赖外部工具/账户/项目环境的能力标为 `needs-dependency`，只有方法说明的标为 `method-only`，未覆盖的标为 `uncovered`——这些都不是已实现。
- 渲染支持范围是 Linux arm64 实测；其他平台与三维未验证。

### 复现入口

```sh
npm ci --ignore-scripts
npm run verify                # 文档、263 项测试、原生集成、打包消费
node capabilities/runner.mjs doctor --test
node scripts/benchmark/accept-domains.mjs
```

## English

### What this document answers

`1.7.0-rc.1` claims to strengthen **the same** Omni preset. This page lists, item by item, which enhancements were genuinely executed, which are method-only or still unverified, and exactly how far "no critical regression" reaches.

Every record is reproducible from this repository; commands follow each section. Anything not completed with paid model calls is marked as such.

### Three genuine enhancements (all actually executed)

**1. Structured data operations really work.** Not "functions were written" — the packaged CLI was launched against synthetic inputs and its output checked.

- All 23 engineering cases pass, including positive results, correct rejections (unterminated quote, dependency cycle, forbidden control characters) and boundary values.
- The runner records **hashes of the source it actually executed**; source did not change during the run (`sourceStable: true`), so the results correspond to one code version.
- Reproduce: `node scripts/benchmark/accept-domains.mjs`

**2. The code-media pipeline really produces artifacts.** No image or video generation model is used.

- 22 tests pass under real resvg 2.6.2 + FFmpeg 6.1.1 with **0 skipped**, covering real Chinese rendering, GIF/MP4 encoding, full decode, timeout, cancellation, output collisions, unsafe-SVG rejection and explicit blocking on missing dependencies.
- The **extracted package** was run end to end independently: Chinese SVG/PNG/GIF/MP4 produced, MP4 h264/yuv420p with 24 frames over 2.000 s, GIF 24 frames, PNG signature and 480×350 dimensions correct, `.complete.json` commit marker present.
- Frames were actually viewed with an image-reading tool: Chinese text renders correctly. The font proof sheet once appeared to clip `values` to `v`; pixel measurement showed a 132 px right margin, so it was a fixed-character slice rather than a renderer failure, and it now marks truncation with `…` plus a dimension assertion.
- Reproduce: set `OMNI_MEDIA_TOOL_ENV` / `OMNI_MEDIA_FFMPEG` / `OMNI_MEDIA_FFPROBE` / `OMNI_MEDIA_TEST_FONT`, then run `node --test media/render.test.mjs media/safety.test.mjs`

**3. Domain methods and the capability index are discoverable and loadable in a real Harness.**

- Under real DSH services, across independent create and resume processes, all 11 specialist skills, the capability index `capabilities/catalog.json` and both runners resolve to exact files in the **installed package** and load.
- Each skill is checked by **strict path and body comparison**, with same-name decoys planted in the project, so an external file cannot masquerade as the packaged skill.
- The index carries references to 100 source configurations and 23 capability entries with four maturity states.
- Reproduce: `node integration.mjs`

### Font paths outside the project are now gated

While auditing asset authorization we found an inconsistency: asset paths rejected `../../etc/passwd`, but a **font path could point at any readable file outside the project** (a probe accepted `/etc/hostname`). Fonts inside the project now get the same containment check as assets; a font outside it must be an absolute path carrying an explicit `externalAuthorization: true`.

The fix exposed a second defect: the runner rebuilt the font snapshot for the worker and dropped the authorization field, so even a legitimate authorization failed. Both are fixed, with a regression covering relative escape, absolute-without-authorization and explicitly authorized.

### A false-pass defect that was fixed

While validating the domain fixtures we found that a nested `node --test` inherits `NODE_TEST_CONTEXT`, which makes the child **exit 0 without running any test**. That once let `doctor --test` report `accepted: true` from inside the repository suite while nothing ran — a direct threat to the integrity of the "verified" claims.

Fixed: the self-check child now strips that variable, and the fixture test does the same. A regression test **proves the trap exists** (an intentionally failing test returns 0 with the context and non-zero without it) so it cannot silently return. After the fix, `doctor --test` emits roughly 4900 bytes of real test output in both contexts.

### Domain fixture runnability

The 12 domain/cross-domain cases previously had prompts but no runnable inputs. All now ship 34 self-contained synthetic fixtures (no third-party code), verified as follows:

- The engineering case **genuinely fails** at baseline, and a minimal fix makes it pass — proving the case is solvable and its rubric meaningful.
- Game, fiction, molecular-biology (both DNA and RNA alphabets), calendar, data transformation and validation fixtures are all consumed by real operations with correct values.
- Case validation now requires a fixture directory and README per task, preventing "unexecutable shell" cases.

All model-side tasks have now been attempted, but interruptions, rubric conflicts and delivery defects remain. Execution is not acceptance; see the [execution review](domain-run-results.md#english).

### How far "no critical regression" reaches

Confirmed:

- `quality.js`, `adaptive.js`, `pool.js` and the upstream grilling text are **byte-for-byte unchanged since v1.5.0** (SHA-256 below).
- 263 repository tests, 64 capability contract tests and 22 real render tests all pass.
- Native integration still verifies reasoning selection, adaptive retention, compaction transactions, session persistence and service isolation with no leaks.
- Packaged-consumer checks and same-name skill decoy rejection still pass; CI passed on both Node versions for commits `7863c55` and `2a8ad02`.

Core file SHA-256 (identical to v1.5.0):

```
quality.js              f0bb863148310169fd93e71974e003e34135be1eac8aaebad19950302cabb200
adaptive.js             05a44856c3d11240d1fd590d64f56f71796597439f8d46d08a5a6d3f47f3d66a
pool.js                 451c9591174fc0fc25381f040fc6ddff93930ea0fcc9fe1ef1364df5498a9d49
skills/grilling/SKILL.md a146842ed93ca43d833550fa9adf02e58cb63c83fea9d4b4522995b82242d4e2
```

**Not confirmed**: behavioral non-regression on a real model. The historical 40-case results are unchanged, and previously recorded candidate regressions (for example research-02) are not overturned by this engineering acceptance.

### Explicitly unproven

- **Overall behavioral acceptance has not passed.** The twelve guided tasks have no overall pass rate. Three later native probes without capability hints have artifact review and spontaneous method-selection evidence, with cancellation/post-delivery error and recovery separate. Before/after-guard comparisons on the unchanged original40 retain critical warnings, not professional improvement or overall non-regression; see the [execution review](domain-run-results.md#english).
- Domain engineering acceptance is **CLI contract acceptance**, not professional certification. Passing citation structure is not source truth; an extracted IP is not a scan or attribution; preliminary game arithmetic is not playtesting; sequence statistics are not clinical/functional conclusions; Markdown is not PPTX; an ICS draft is not a successful booking.
- Source research was **static review**: every researched subject stayed uninstalled, unimported and unexecuted.
- Capabilities needing external tools, accounts or project environments are `needs-dependency`; method-only entries are `method-only`; uncovered ones are `uncovered`. None of those is implemented capability.
- Rendering is validated on Linux arm64 only; other platforms and 3D remain unverified.

### Reproduction entry points

```sh
npm ci --ignore-scripts
npm run verify                # docs, 263 tests, native integration, packaged consumer
node capabilities/runner.mjs doctor --test
node scripts/benchmark/accept-domains.mjs
```
