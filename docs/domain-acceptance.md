# 领域与跨域验收 / Domain and cross-domain acceptance

[中文](#中文) · [English](#english)

## 中文

### 三种证据不能混用

1. **来源分类**：100套配置的角色、方法、工具声明及哈希核对，证明研究依据，不证明本机已接入或模型会正确使用。
2. **本地操作工程验收**：真实启动包内CLI，用合成输入检查明确的转换、计算、格式和拒绝契约，证明这些具体操作，不证明整个领域专业能力。
3. **真实模型领域任务**：让同一全能模式识别任务、选择技能、组合真实工具并交付成果，单独记录原始轨迹与产物。只有这一步才能评估自动路由和实际任务交付；不能拿前两项代替。

新任务集含23个本地操作案例和12个待执行的领域/跨域任务，覆盖全部10个分类。案例与标准见[任务集](https://github.com/lxy0714/dsh-omni-mode/blob/main/benchmark/domain-acceptance.json)。这批案例在实现设计过程中编写，已经观察过部分实现与调试结果，**不是未见盲测**，不宣称统计性模型提升。

### 工程案例

涵盖CSV/JSON类型与转换、游戏数值初筛、小说显式事实连续性、合成FASTA基础统计、实体关联结构、引用覆盖、本地字符串指标提取、Markdown大纲、待办依赖和UTC ICS草稿；同时覆盖非法输入、缺少来源、循环依赖和控制字符拒绝。

边界必须随结果保留：引用结构通过不表示来源真实；IP提取不表示扫描、归因或恶意判定；数值初筛不表示实机游戏平衡；序列统计不是临床/功能结论；Markdown不是PPTX；ICS文件不等于已导入日历或预约成功。

仓库开发环境运行：

```sh
node --test scripts/benchmark/accept-domains.test.mjs
node scripts/benchmark/accept-domains.mjs
```

可用 `--out <新的收据路径>` 留下独占创建的工程日志，不覆盖已有记录。输出记录题集哈希、实际运行源码哈希、Node与平台、逐题失败/阻塞，以及未执行的模型任务数。运行期间源码变化会标记 `unstable-source`，不能混成一个稳定实验。测试收据不是用户最终成果；写入异常不得被当成成功验收。

### 模型任务与媒体产物

领域任务需要另行准备授权工作区、输入与所需真实工具。固定题面/标准后，记录真实模型路由、技能/人设/工具/驱动版本及原始结果；未运行、缺依赖、权限拒绝、取消和模型失败分别保留。不能选择最好的一次替换首轮，也不能把模板里的 `not-run` 自动改成通过。

代码媒体单独验收：有可用素材使用素材，否则从零代码生成；中文文字与版面需查看真实图片；GIF/MP4需真实编码、ffprobe、完整解码和关键帧检查；交付可编辑源码、输入及成品。音频需求未明确时必须先询问，测试夹具里的已询问字段不是平台授权。

原40题继续作为历史回归参考，不重写旧成绩。新增工具带来的可完成任务范围，与同模型/同工具条件下的方法质量改进分别报告。至少验证三类实际增强，但不能硬凑旧题涨分、汇总不同评分器/路由，或把CLI案例通过率当作模型成功率。

## English

### Three evidence layers must remain distinct

1. **Source classification:** roles, methods, tool declarations and hashes across 100 configurations establish research provenance, not local integration or correct model use.
2. **Local-operation engineering acceptance:** actually launching the packaged CLI against synthetic inputs checks explicit conversion, computation, format and rejection contracts. It establishes those operations, not whole-domain expertise.
3. **Real-model domain tasks:** the same Omni preset must identify work, choose skills, combine actual tools and deliver artifacts, retaining raw traces and results. This layer alone evaluates routing and task delivery; the first two cannot substitute for it.

The new set contains 23 local-operation cases and 12 unexecuted domain/cross-domain tasks spanning all 10 categories; see the [case set](https://github.com/lxy0714/dsh-omni-mode/blob/main/benchmark/domain-acceptance.json). Cases were authored during implementation design, after observing some code and debugging outcomes. They are **not held-out confirmation** and establish no statistical model-quality improvement.

### Engineering cases

Cases cover CSV/JSON validation/transformation, preliminary game arithmetic, explicit fictional canon, basic synthetic FASTA statistics, entity-relation consistency, citation coverage, local string indicators, Markdown outlines, todo dependencies and UTC ICS drafts. Negative cases cover malformed inputs, missing sources, cycles and forbidden control characters.

Keep the limits with every result: citation structure does not prove source truth; IP extraction is not scanning, attribution or maliciousness; preliminary arithmetic is not game playtesting; sequence statistics are not clinical/functional conclusions; Markdown is not PPTX; an ICS file is not a calendar import or successful booking.

Run in a repository development checkout:

```sh
node --test scripts/benchmark/accept-domains.test.mjs
node scripts/benchmark/accept-domains.mjs
```

Use `--out <new-receipt-path>` to exclusively create an engineering log without overwriting an earlier record. Receipts include case-set and executed-source hashes, Node/platform identity, per-case failures/blocks and the unexecuted model-task count. Source changes during a run produce `unstable-source`, not a coherent experiment. A test receipt is not a user's final artifact; receipt-write errors are never successful acceptance.

### Model tasks and media artifacts

Prepare authorized fixture workspaces, inputs and actual tools separately. Freeze prompts/rubrics and retain model route, skill/persona/tool/driver versions and raw results. Preserve unexecuted tasks, missing dependencies, denial, cancellation and model failures distinctly. Never replace a first result with the best retry or automatically turn a template's `not-run` into success.

Code media requires separate acceptance: reuse available authorized assets or generate from scratch in code; inspect actual Chinese text/layout; really encode, probe, fully decode and inspect key GIF/MP4 frames; deliver editable source, inputs and final files. Ask if audio requirements are unspecified. An asked field in a fixture is not platform authorization.

Keep the original 40 cases as historical regression evidence without rewriting scores. Report tool-enabled coverage separately from method-quality changes under the same model/tools. Verify at least three genuine enhancements without manufacturing old-case gains, mixing graders/routes or relabeling CLI pass rates as model success rates.
