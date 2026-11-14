# 全能模式 / Omni mode v1.7.0（正式版 / current release）

[中文](#中文) · [English](#english)

## 中文

同一个「全能模式」、同一个 `omni` 预设 ID。本次加入领域专长与**用代码**制作图片视频的能力，不调用生图或视频模型。`v1.7.0` 由 `v1.7.0-rc.1` 预发布转正：功能范围与预发布一致，兼容门禁放宽到当前最新的 DSH `0.2.2-rc.3`。

> **本版已可正常使用，但仍带着一条未修复的已知限制。** 用字节未改动的原 40 题、同一模型、同一工具与评分器复测，旧版通过 38 题、新版通过 34 题，有 4 题从通过变为不通过（`research-02`、`review-02`、`recover-03`、`recover-04`）。复核发现其中多数差异来自题面未规定的封闭取值或类型（如状态枚举、字符串数组与对象数组、引用列表是否允许附加项），**但"题面不完整"不等于已经证明质量没有下降**。这条限制在修复并重新冻结复测前一直有效，详见[执行复核](domain-run-results.md#中文)。

```sh
# 正式版安装 / Install current release
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0
```

也可下载本 Release 的 TGZ 后在插件管理器添加。安装后重启引擎、新建对话，选择「全能模式」；使用你实际的 profile。旧本地包与本包同为 `omni` ID，不能同时启用。上一个稳定版 `v1.5.0` 仍可回退。

### 新增内容

- **十个领域技能**：工程、游戏、安全网络与逆向、文档演示、小说叙事、研究学习、陪伴个性化、助理、分子生物数据、业务语义。按需加载，不常驻。
- **能力索引**：100 套来源配置引用与 23 个能力条目，用 verified / needs-dependency / method-only / uncovered 四种状态如实标注。
- **11 个本地操作**：数据校验与转换、游戏数值初筛、小说连续性、FASTA 统计、实体关系一致性、引用覆盖、本地指标提取、Markdown 大纲、待办依赖、统一格式日历草稿。只用 Node 内置模块，不新增生产依赖。
- **代码视觉**：场景源码 → SVG → 明确版本的 resvg → FFmpeg 出 PNG/GIF/MP4。有授权素材优先用素材，否则从零绘制；视频音频需求未明确会先询问。依赖需显式准备，不会在激活或渲染时静默安装。

### 这次转正实际改了什么

- 兼容门禁从 `>=0.2.2-rc.1 <=0.2.2-rc.2` 放宽为 **`>=0.2.2-rc.1 <=0.2.2-rc.3`**，把当前最新的 rc.3 纳入。
- 门禁不再只是"测试版本落在范围内"：`scripts/verify-package.mjs` 现在把受支持版本写成**冻结清单**，既要求范围恰好接受这三版，也反过来断言 `0.2.1-rc.5`、`0.2.2-alpha.3`、`0.2.2-rc.4`、`0.2.2`、`0.2.3-rc.1` 都被拒绝——避免以后把"范围写得宽松"当成"已经验证"。
- 开发依赖与 lock 同步到 `0.2.2-rc.3`，Node 受支持下限仍为 `>=24.9.0`。
- 更正文文档中一处与实际不符的计数：真实渲染测试实测为 **23 项**（此前正文写作 22 项，与 `VERIFICATION.md` 的 23 项冲突）。数字以本次实际运行为准。

### 验证到什么程度

已实际执行：

- **三种宿主版本的隔离安装与原生集成**：`0.2.2-rc.1`、`0.2.2-rc.2`、`0.2.2-rc.3` 各自独立安装后，均跑通完整预设激活、11 个技能与 `omni-method`、`grilling` 正文逐字加载、推理选档、自适应切换、手动压缩事务、服务隔离与独立进程恢复。三者均 `result: PASS`，`serviceLeaks: 0`。
- 263 项仓库测试、64 项能力契约测试、**23 项真实渲染测试**（真实 resvg 2.6.2 + FFmpeg 6.1.1，0 跳过）。
- 从解包后的安装包独立完成中文 SVG/PNG/GIF/MP4 端到端产出，并完整解码。
- 真实 Harness 中确认 11 个技能、能力索引与两个运行器可从安装包加载，且同名外部诱饵不能冒充。
- 用读图工具查看实际画面并修复了字体证明图的截断显示问题。

**没有验证、也不声称的事**：集成里的模型是本地确定性模拟适配器，**没有调用真实付费供应商**（无隔离凭据/路由可用）。桌面应用实机 UI、Windows 打包更新、其他平台与三维渲染均未验证。原 40 题的 4 个关键警报仍在，不宣称整体无退步。

### 你的实际使用反馈

你在本版预发布期间已用它连续跑了多个真实任务，并据此要求转正。这属于**使用者反馈**，记录了"在实际任务中可用"这一事实；它不是独立行为评测，也不能替代上面那条未通过的整体门槛。两者分开记，不互相覆盖。

`quality.js`、`adaptive.js`、`pool.js` 与上游 grilling 原文自 v1.5.0 起字节未变；推理选档、自适应保留、权限与审批边界均无改动。详细证据与未证事项见[增强证据](enhancement-evidence.md#中文)。

渲染支持范围为 Linux arm64 实测，其他平台与三维未验证。附件提供 TGZ 与 SHA256；未发布 npm，不覆盖历史标签（`v1.7.0-rc.1` 预发布记录保留）。

## English

The same Omni preset and the same `omni` preset ID. This release adds domain specialties and the ability to make images and video **with code**, using no image or video generation models. `v1.7.0` promotes `v1.7.0-rc.1` to a regular release: the feature set is unchanged, and the compatibility gate now covers the latest DSH `0.2.2-rc.3`.

> **This version is usable, but it still ships with one known limitation.** Re-running the byte-identical original 40 cases on the same model, tools and grader gives 38 baseline passes versus 34 candidate passes, with four cases moving from pass to fail (`research-02`, `review-02`, `recover-03`, `recover-04`). Review found most of those differences stem from closed values or types the prompts never specified (status enums, string versus object arrays, whether a citation list may carry extra items), **but an under-specified prompt is not proof that quality did not drop**. That limitation stands until the contracts are fixed, re-frozen and re-measured; see the [execution review](domain-run-results.md#english).

```sh
# Install current release
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0
```

Or add the release TGZ through the plugin manager. Restart, create a new conversation and select `全能模式`; use your actual profile. The legacy local bundle declares the same `omni` ID and cannot be enabled simultaneously. The previous stable `v1.5.0` remains available for rollback.

### What is new

- **Ten domain skills**: engineering, game, security/network/RE, documents, fiction, research, personalization, assistant, molecular-biology data and business semantics. Loaded on demand, not resident.
- **Capability index**: references to 100 source configurations and 23 capability entries, honestly labelled verified / needs-dependency / method-only / uncovered.
- **11 local operations**: data validation and transformation, preliminary game arithmetic, fiction continuity, FASTA statistics, entity-relation consistency, citation coverage, local indicator extraction, Markdown outlines, todo dependencies and a calendar draft in a fixed format. Node built-ins only; no new production dependency.
- **Code media**: scene source → SVG → pinned resvg → FFmpeg for PNG/GIF/MP4. Authorized assets are reused when available, otherwise drawn from scratch; audio for video is asked first. Dependencies are prepared explicitly and never installed silently at activation or render time.

### What actually changed in this promotion

- The gate widens from `>=0.2.2-rc.1 <=0.2.2-rc.2` to **`>=0.2.2-rc.1 <=0.2.2-rc.3`**, covering the current rc.3.
- The gate is no longer merely "the tested version happens to fall inside the range": `scripts/verify-package.mjs` now holds a **frozen census** of supported versions, requiring the range to admit exactly these three and asserting that `0.2.1-rc.5`, `0.2.2-alpha.3`, `0.2.2-rc.4`, `0.2.2` and `0.2.3-rc.1` are all refused — so a wider range can never be mistaken for verified support.
- The development dependency and lock move to `0.2.2-rc.3`; the supported Node floor stays `>=24.9.0`.
- Corrects one documentation count that disagreed with reality: the real render suite is **23 tests**, where the prose said 22 and `VERIFICATION.md` said 23. The measured run now decides.

### How far this is verified

Actually executed:

- **Isolated installs and native integration on three host versions**: `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` were each installed separately and each passed full preset activation, verbatim loading of all 11 skills plus `omni-method` and `grilling`, reasoning selection, adaptive switching, the manual compaction transaction, service isolation and resume in an independent process. All three returned `result: PASS` with `serviceLeaks: 0`.
- 263 repository tests, 64 capability contract tests and **23 real render tests** (real resvg 2.6.2 + FFmpeg 6.1.1, 0 skipped).
- Independent end-to-end Chinese SVG/PNG/GIF/MP4 production from the extracted package, with full decoding.
- In a real Harness, 11 skills, the capability index and both runners load from the installed package, and same-name external decoys cannot substitute for them.
- Actual frames viewed with an image-reading tool, which caught and fixed a truncation display issue in the font proof sheet.

**Not verified, and not claimed**: the integration model is a deterministic local fixture; **no real paid provider was called** (no isolated credential or route was available). Desktop-app UI, the Windows packaged updater, other platforms and 3D rendering remain unverified. The four critical warnings from the original 40 cases stand, so overall non-regression is not claimed.

### Your own usage feedback

You have already used this build for multiple real tasks during its pre-release period and asked for promotion on that basis. That is **user-reported feedback**: it records that the build was usable in real work, and it is neither an independent behavioral evaluation nor a substitute for the unmet overall gate above. The two are recorded separately and neither overrides the other.

`quality.js`, `adaptive.js`, `pool.js` and the upstream grilling text are byte-for-byte unchanged since v1.5.0; reasoning selection, adaptive retention and permission/approval boundaries are untouched. See [enhancement evidence](enhancement-evidence.md#english) for details and unproven items.

Rendering is validated on Linux arm64 only; other platforms and 3D remain unverified. The release attaches a TGZ and SHA256; nothing is published to npm and no historical tag is overwritten (the `v1.7.0-rc.1` pre-release record is preserved).
