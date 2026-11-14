# 全能模式 / Omni mode v1.7.0-rc.1（实验性预发布 / experimental pre-release）

[中文](#中文) · [English](#english)

## 中文

同一个「全能模式」、同一个 `omni` 预设 ID。本次加入领域专长与**用代码**制作图片视频的能力，不调用生图或视频模型。

> **这是预发布，不是稳定版。** 稳定版仍是 `v1.5.0`；本版为 `v1.7.0-rc.1`。功能可用，但**按既定标准，关键无退步未达成**，因此不宣布验收通过。
>
> **未达成、必须如实告知的部分：** 用字节未改动的原 40 题、同一模型 `gpt-6.1-sol`、同一工具与评分器复测，旧版通过 38 题、新版通过 34 题，有 4 题从通过变为不通过（`research-02`、`review-02`、`recover-03`、`recover-04`）。复核发现其中多数差异来自题面未规定的封闭取值或类型（如状态枚举、字符串数组与对象数组、引用列表是否允许附加项），**但"题面不完整"不等于已经证明质量没有下降**。这条限制在修复并重新冻结复测前一直有效，详见[执行复核](domain-run-results.md#中文)。

```sh
# 预发布安装 / Pre-release install
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0-rc.1
```

也可下载本 Release 的 TGZ 后在插件管理器添加。安装后重启引擎、新建对话，选择「全能模式」；使用你实际的 profile。旧本地包与本包同为 `omni` ID，不能同时启用。预发布可能继续改动，不希望承担变动风险时请继续使用稳定版 `v1.5.0`。

### 新增内容

- **十个领域技能**：工程、游戏、安全网络与逆向、文档演示、小说叙事、研究学习、陪伴个性化、助理、分子生物数据、业务语义。按需加载，不常驻。
- **能力索引**：100 套来源配置引用与 23 个能力条目，用 verified / needs-dependency / method-only / uncovered 四种状态如实标注。
- **11 个本地操作**：数据校验与转换、游戏数值初筛、小说连续性、FASTA 统计、实体关系一致性、引用覆盖、本地指标提取、Markdown 大纲、待办依赖、统一格式日历草稿。只用 Node 内置模块，不新增生产依赖。
- **代码视觉**：场景源码 → SVG → 明确版本的 resvg → FFmpeg 出 PNG/GIF/MP4。有授权素材优先用素材，否则从零绘制；视频音频需求未明确会先询问。依赖需显式准备，不会在激活或渲染时静默安装。

### 验证到什么程度

已实际执行：

- 263 项仓库测试、64 项能力契约测试、22 项真实渲染测试（真实 resvg + FFmpeg，0 跳过）。
- 从解包后的安装包独立完成中文 SVG/PNG/GIF/MP4 端到端产出，并完整解码。
- 真实 Harness 中确认 11 个技能、能力索引与两个运行器可从安装包加载，且同名外部诱饵不能冒充。
- 用读图工具查看实际画面并修复了字体证明图的截断显示问题。

**未通过整体门槛（本预发布即在此前提下提供）**：12 项指导式任务不公布总通过率。三个无能力提示的原生探针已有实际产物与自主方法选择证据，但首轮/恢复分列。原 40 题在加入通用恢复防护前后各跑一轮，防护后仍有上述 4 题关键警报，目标用例通过不等于整体无退步。仍不宣称专业水平提升或统计性涨分，详见[执行复核](domain-run-results.md#中文)。来源研究为静态审阅，未安装或运行任何被研究对象。

`quality.js`、`adaptive.js`、`pool.js` 与上游 grilling 原文自 v1.5.0 起字节未变；推理选档、自适应保留、权限与审批边界均无改动。详细证据与未证事项见[增强证据](enhancement-evidence.md#中文)。

兼容门禁为 `engines.dsh: ">=0.2.2-rc.1 <=0.2.2-rc.2"`：rc.1 是官方 `latest`（桌面端实际提供的版本），rc.2 是 `next` 预发布；两者均已隔离安装并实测通过原生集成、11 技能加载、选档、压缩事务与服务隔离，范围外版本由宿主拒绝。渲染支持范围为 Linux arm64 实测，其他平台与三维未验证。附件提供 TGZ 与 SHA256；未发布 npm，不覆盖历史标签。

## English

The same Omni preset and the same `omni` preset ID. This release adds domain specialties and the ability to make images and video **with code**, using no image or video generation models.

> **This is a pre-release, not a stable version.** Stable remains `v1.5.0`; this release is `v1.7.0-rc.1`. The features work, but **critical non-regression was not achieved** under the agreed standard, so acceptance is not declared as passed.
>
> **What was not achieved and must be stated plainly:** re-running the byte-identical original 40 cases on the same `gpt-6.1-sol` model, tools and grader gives 38 baseline passes versus 34 candidate passes, with four cases moving from pass to fail (`research-02`, `review-02`, `recover-03`, `recover-04`). Review found most of those differences stem from closed values or types the prompts never specified (status enums, string versus object arrays, whether a citation list may carry extra items), **but an under-specified prompt is not proof that quality did not drop**. That limitation stands until the contracts are fixed, re-frozen and re-measured; see the [execution review](domain-run-results.md#english).

```sh
# Pre-release install
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0-rc.1
```

Or add the release TGZ through the plugin manager. Restart, create a new conversation and select `全能模式`; use your actual profile. The legacy local bundle declares the same `omni` ID and cannot be enabled simultaneously.

### What is new

- **Ten domain skills**: engineering, game, security/network/RE, documents, fiction, research, personalization, assistant, molecular-biology data and business semantics. Loaded on demand, not resident.
- **Capability index**: references to 100 source configurations and 23 capability entries, honestly labelled verified / needs-dependency / method-only / uncovered.
- **11 local operations**: data validation and transformation, preliminary game arithmetic, fiction continuity, FASTA statistics, entity-relation consistency, citation coverage, local indicator extraction, Markdown outlines, todo dependencies and a calendar draft in a fixed format. Node built-ins only; no new production dependency.
- **Code media**: scene source → SVG → pinned resvg → FFmpeg for PNG/GIF/MP4. Authorized assets are reused when available, otherwise drawn from scratch; audio for video is asked first. Dependencies are prepared explicitly and never installed silently at activation or render time.

### How far this is verified

Actually executed:

- 263 repository tests, 64 capability contract tests and 22 real render tests (real resvg + FFmpeg, 0 skipped).
- Independent end-to-end Chinese SVG/PNG/GIF/MP4 production from the extracted package, with full decoding.
- In a real Harness, 11 skills, the capability index and both runners load from the installed package, and same-name external decoys cannot substitute for them.
- Actual frames viewed with an image-reading tool, which caught and fixed a truncation display issue in the font proof sheet.

**Overall gate not passed (this pre-release ships under that caveat)**: the twelve guided tasks have no overall pass rate. Three native probes without capability hints have actual artifacts and spontaneous method-selection evidence, with first attempts/recovery separate. The original 40 cases ran once before and once after the general recovery guard; four critical warnings remain after it. A targeted pass is not overall non-regression. No professional or statistical improvement is claimed; see the [execution review](domain-run-results.md#english). Source research remains static-only, without installing or running researched subjects.

`quality.js`, `adaptive.js`, `pool.js` and the upstream grilling text are byte-for-byte unchanged since v1.5.0; reasoning selection, adaptive retention and permission/approval boundaries are untouched. See [enhancement evidence](enhancement-evidence.md#english) for details and unproven items.

The gate is `engines.dsh: ">=0.2.2-rc.1 <=0.2.2-rc.2"`: rc.1 is the official `latest` the desktop app ships, rc.2 the `next` pre-release. Both were installed in isolation and passed native integration, 11-skill loading, reasoning selection, compaction transactions and service isolation; the host refuses anything outside that range. Rendering is validated on Linux arm64 only; other platforms and 3D remain unverified. The release attaches a TGZ and SHA256; nothing is published to npm and no historical tag is overwritten.
