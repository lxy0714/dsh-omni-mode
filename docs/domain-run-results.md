# 领域任务执行记录与复核 / Domain execution and review

[中文](#中文) · [English](#english)

## 中文

### 结论与口径

已在真实模型、真实文件和工具上**尝试全部 12 项**合成领域任务。首轮路由为 `custom-work / DeepSeek-Flash`：9 个执行者报告完成，2 个中途停止，1 个失败；这些是执行状态，**不是 9 项通过或成功率**。原产物、错误和中断均保留；停止/失败通知不足以确定模型或基础设施的根因，不擅自归因。

这轮是受指导、非盲的工程演示，不是可比对照实验。委派提示已给出若干工具路径、输入 schema 和计算提示；实际使用并行子会话，而原评分说明写“单会话逐题”。不能据此证明自动选择技能、全面专业能力提升、同条件方法收益或旧 40 题无退步。

用户随后切换了主代理模型至 `openai-codex / gpt-6.1-sol`。恢复阶段的代理使用默认继承路由，未逐个从原始请求中确认实际模型 ID；不把它们追认为原首轮。原始题集和已提交的评分草案保持不变；其中的 `not-run` 是模板状态，不再作为本次实际执行状态。

### 逐项事实，不计算总通过率

| 任务 | 首轮及独立复核事实 | 未通过或未核验部分 |
|---|---|---|
| 工程 | 交付修复源码、差异和测试证据；主代理独立核对有限数值与非法成员的异常行为，输入与测试字节未变 | 只覆盖合成 Node 案例，不是整个工程领域认证 |
| 游戏 | 执行者中止；原 `start` 指向缺失的入口，只留下单位加载和数值模块 | 首轮无可运行战斗、完整 QA 或交付说明；恢复版另记 |
| 安全 | 有带行号的本地审查报告及合成验证；正确区分属性读取、潜在写入、不可见调用方和日志 | `__proto__` 读取不等于原型污染；日志里的路径文本不证明进入文件参数，不硬判已穿越；未测真实目标 |
| 文档 | 有真实 8 页 PPTX；独立 ZIP CRC/XML 和文字读取正常；预览图已查看 | 预览是几何重建，不是 PowerPoint/LibreOffice 实际渲染 |
| 小说 | 有续写、显式事实检查与审读；正文保持北港、蓝钥匙，没有提前迁移 | `from/to` 被解释为章号，原设定未明确单位；脚本不能验证文学质量 |
| 研究 | 正确指出 S1 仅“声称批量导出”，S2 仅“没有性能数字”；拒绝虚构第二项 | 原题/评分草案却要求两项能力，存在夹具冲突；不是现实世界研究认证 |
| 个性化 | 正文 113 个 Unicode 码点（含换行），无感叹号，无永久记忆承诺 | 字数/标点不等于所有表达品质；“只含提示词流程”的措辞低估了包内程序能力 |
| 助理 | 3 个 ICS 事件、6 个端点与 Asia/Shanghai→UTC 独立重算一致；有依赖待办 | 未导入日历、发送邀请或预约；此前评分器误把 6 个端点当成 6 个事件 |
| 分子生物 | 4 条合成序列的长度、歧义数及两种 GC 分母口径独立重算一致 | 仅基础格式与算术；不证明临床、功能或实验结论 |
| 业务 | 执行者中止；模型的复合键和关系可保留，但原日志已记载 NULL 主键和查询失败 | SQLite `TEXT PRIMARY KEY` 未显式 `NOT NULL`，与模型声明不一致；文档交付不完整；恢复版另记 |
| 数据→游戏→图表 | 数值正确，有真实 SVG/PNG | 首图把 ratio 阈值放在单体 efficiency 轴，语义错误；已另存修正版，不能倒称首图全对 |
| 代码动画/音频 | 子代理失败；主代理补渲染出 640×400、150 帧、6 秒 H264 MP4 和 GIF，独立全解码正常 | 主代理提供过错误“无回答默认静音”指令；仅写提问文件不等于收到回答。原交互不合格，不能追认。动画左栏的生成结果漂移也是代码模拟，不是模型实测。用户后来要求自做音频，具体形式尚未确认，未新增音轨 |

### 评分器与草案的缺陷

- 先前对进行中产物的 `4/12`、`9/12` 等显示已撤回。评分器在观察结果后改了否定句、SVG 命名空间、事件数量及文件检查等逻辑，且未覆盖原标准的全部内容，不能称冻结成绩。
- 研究草案强制两项能力，但来源仅支持一项主张。安全草案把属性读取/日志文本过早写成风险对应关系。保留这些错误，不逼执行者编造以满足它们。
- 评分草案手写的 `frozenAt` 与真实提交时间不一致；它不能作精确时间证据。草案在委派前的本地提交为 `a9e4fa9`，但这不证明其后实现的评分器也被冻结。
- 至少工程子会话有完整 Omni 系统提示注入证据；未逐一核完全部执行者的提示版本与哈希，不能泛称“完全没加载”，也不能由此宣称全部加载/自动路由验收。

### 产物核验与保存

新核验器只检查具体事实，不计算模型分数：输入字节完整性、保留快照、修复模块的独立行为例、FASTA/时区重算、PPTX 容器、媒体探测/全解码及修正版图表校验。命令中的路径由维护者明确指定；依赖现有 Python、FFmpeg 和包内运行器，不在运行时安装。

```sh
node scripts/benchmark/verify-domain-artifacts.mjs \
  --run-root <original-run-root> \
  --recovery-root <separate-recovery-root> \
  --snapshot-root <preserved-snapshot-root> \
  --out <new-local-receipt.json>
```

首次独立工程核验记录包含 22 项具体检查，无不匹配；**不是 22 项模型任务通过**。该保存快照是在复核阶段创建的晚期快照，不伪称每个代理结束瞬间的原始快照。原始产物与恢复产物分目录保存，清单含文件 SHA-256。运行记录需要与本机原始会话和产物一起复核；仓库摘要不能替代全部原始轨迹。

### 本轮恢复已完成的交付

- **游戏**：独立目录有可运行 Node 文本战斗、数值模型、QA 与素材边界文档。主代理审读后重跑 `node --test game.test.mjs`：24 项通过；`node game.mjs demo` 真正到达第 8 回合终局，玩家剩 8 HP、敌方 0 HP。没有引擎/真人试玩，8 分钟仍是未测目标。
- **业务**：补齐模型、一致性、开放问题与恢复说明四份双语文档。主代理用同一个独立 Python/SQLite 检查器实跑首轮 SQL：26/29，退出 2；只加两处显式 `NOT NULL` 的恢复候选：29/29，退出 0。失败包含 NULL 客户主键、NULL 订单主键及由此污染的查询。未定义的行号范围/空字符串等规则不偷偷补造。
- **图表**：用包内运行器另存正确指标语义的 SVG/PNG，核验完成标记、全解码，并实际读图；2.00 仅用于独立 ratio 面板，不再放在单体效率轴上。

这些是实做修复，不是首轮成绩提升。精确命令与退出码保存在本地独立复核收据中；文件哈希和执行状态另存于 `benchmark/domain-execution-ledger.json`，不改题集模板。音频未明确的部分与 Office 真渲染等限制继续保留。当前不发布新 Release，不升级包版本，不再次改本机 profile。

### 后续原生三项与原40题对照

后续另冻结合成输入与验收标准，再以普通任务要求启动三个原生新子会话；委派没有给技能名、工具路径或参考答案，也没有父对话种子。研究会话自行加载研究方法；游戏数值/中文图表会话自行组合游戏、代码媒体等方法。工程首轮取消，获准后另目录恢复，自行加载工程方法。三份产物均由主代理复核，但**不是三次正常首轮通过**：只有两个正常完成通知，工程恢复在交付文件和结果后以 `PI_AI_ERROR / The usage limit has been reached` 结束。

工程恢复的既有5项测试、独立3,616组整数区间穷举、17种非法输入及冻结输入/小数/最大有限值检查通过，测试与用户笔记字节未变。研究报告逐项对照原始合成资料。真实1600×1120中文PNG经过独立算术、运行器校验、全解码和实际看图；ratio=5.25与上限2.00分区展示，不假称游戏整体已平衡。另10项事实检查不是10道模型题。原生请求实际为 `openai-codex / gpt-6.1-sol / max`；受控回归两臂均为同模型的 `high`，不同轨道不混算。

先运行修订52题集中的原40个ID；核对发现4题提示曾变动，随后**另跑字节未改的原40题**。再针对真实观察到的“恢复产物改变字段结构、混淆文件修复与会话恢复”增加一条通用persona防护，不含题目答案；以同一原40题单独复测。驱动、评分器、模型路由、原40题文件均未改；两次临时套题切换后，修订题集均按SHA-256逐字节恢复。

下表是**原始收据判定**，不是统计提升证明。通过数取每题最早完整行为配对，并单列基础设施恢复；不能替换首轮中断或行为失败。

| 套题与候选 | 首轮完整配对 | 含单列恢复的完整配对 | 旧版通过 | 新版通过 | 原判关键退步 |
|---|---:|---:|---:|---:|---|
| 修订组原40个ID，防护前 | 36/40 | 40/40 | 38 | 38 | research-02、review-02 |
| 未改动原40题，防护前 | 39/40 | 40/40 | 36 | 35 | review-02、recover-04、recover-05 |
| 未改动原40题，通用防护后 | 39/40 | 40/40 | 38 | 34 | research-02、review-02、recover-03、recover-04 |

目标恢复用例 `recover-05` 在防护后通过，但不能由单次变化宣称因果收益或整体无退步。其余输出契约问题与失败保留：例如引用精确ID/数组形状、未明示状态枚举、输出列表与计数的区别。对这些限制的解释不改写原判为通过，也不把所有失败一概归因于评分器。原生探针使用的是防护前版本；新增防护没有新的完整原生会话复验。

**发布结论：暂不发布。** 三项实际产物及自动方法选择已有可核查证据，但修复后仍有4个关键退步信号，整体门槛未满足。保持当前开发候选，不升级版本、不切换账号或付费通道、不迁移本机配置。详见[分组收据摘要](../benchmark/native-session-results.json)；原始受控收据、选定原生请求头、事件引用、源码及独立检查保存在本地证据包，不声称该摘要是完整原生会话导出或云CI结果。

## English

### Conclusion and scope

All **12 synthetic domain tasks were attempted** with a real model, files and tools. On the original `custom-work / DeepSeek-Flash` route, nine workers reported completion, two stopped and one failed. These are execution states, **not nine passes or a success rate**. Original artifacts, errors and interruptions remain retained. Termination notices alone do not establish whether the root cause was the model or infrastructure.

This was a guided, non-blind engineering demonstration, not a comparable controlled experiment. Delegations supplied tool locations, schemas and some calculation hints. They used parallel child sessions rather than the rubric's stated single-session sequential execution. The run cannot establish automatic skill routing, broad professional improvement, same-condition method benefits or non-regression on the old 40 cases.

The user later changed the lead route to `openai-codex / gpt-6.1-sol`. Recovery delegates use the inherited default route; their exact effective model IDs were not individually confirmed from raw requests. Recovery is separate from the original first attempts. The source cases and committed rubric draft remain unchanged: `not-run` in that template is not the current execution ledger.

### Per-task evidence, without an overall pass rate

| Task | Original attempt and independently reviewed facts | Remaining failure or limit |
|---|---|---|
| Engineering | Delivered fix, diff and test evidence; independent finite-number/error examples checked; inputs and tests unchanged | One synthetic Node problem, not domain certification |
| Game | Worker stopped; `start` points to a missing entry; only unit loading/balance modules exist | No complete original combat/QA delivery; recovery recorded separately |
| Security | Local evidence-linked review distinguishes property reads, conditional writes, missing caller code and logs | Reading `__proto__` is not pollution; a traversal-looking log ID does not prove a file dataflow; no real-target testing |
| Documents | Real eight-slide PPTX; independent ZIP CRC/XML/text checks; preview images inspected | Geometric previews are not PowerPoint/LibreOffice rendering |
| Fiction | Editable continuation and explicit fact review maintain North Port and the blue key | Chapter-number interpretation of unspecified intervals; no automated literary assessment |
| Research | Correctly refuses a second invented capability; S1 claims batch export, S2 provides no performance figures | Original prompt/rubric demands two capabilities despite this evidence conflict; not real-world research validation |
| Personalization | 113 Unicode code points including newlines, no exclamation marks or permanent-memory promise | Counting is not general style quality; wording understates bundled executable capabilities |
| Assistant | Three ICS events and six endpoints match independent timezone recomputation; dependency todos exist | No import/invitations/bookings; earlier checker confused six endpoints with six events |
| Molecular biology | Four synthetic sequences independently match length, ambiguity and both GC conventions | Basic format/arithmetic only, not clinical/functional/experimental conclusions |
| Business | Worker stopped; composite keys/relations retained, but original logs show NULL-key and query failures | SQLite text PKs lack explicit NOT NULL despite model claims; incomplete delivery; recovery separate |
| Data→game→chart | Correct arithmetic and real SVG/PNG | Original chart misplaces a ratio threshold on an individual-efficiency axis; corrected copy does not erase this failure |
| Code animation/audio | Child failed; lead-assisted 640×400, 150-frame, six-second H264/GIF artifacts independently decode | Driver incorrectly instructed default silence without an answer. A question file is not a user choice. The drifting model-output bars are a code simulation, not a measured model comparison. Later self-produced-audio request remains unspecified; no new audio added |

### Scoring defects retained, not hidden

Earlier in-progress `4/12`, `9/12` and similar displays are withdrawn. The checker was edited after outcomes were visible, using inadequate keyword/filename tests and omitting full rubric requirements. The research count conflicts with its sources; security wording overstates what the supplied code/logs prove. No worker should fabricate findings to satisfy either error.

The draft's manually entered `frozenAt` conflicts with the real commit time and is not reliable timing evidence. Local commit `a9e4fa9` predates delegation, but does not establish a frozen implementation of the later checker. At least the engineering child has a full Omni-system-prompt injection record; all twelve prompt revisions/hashes have not been individually audited, so neither universal absence nor universal routing acceptance is claimed.

### Artifact inspection and recovery

The command above inspects concrete facts only: input/snapshot hashes, independent examples for the delivered fix, FASTA/timezone recomputation, OOXML structure, real media probe/full decode and the corrected chart. It uses explicitly supplied local paths and existing Python/FFmpeg/bundled tools, with no automatic dependency installation.

The first independent receipt has 22 concrete checks with no mismatches; **that is not 22 passed model tasks**. The preserved snapshot was captured late during review, not at every worker's termination. Originals and recovery files remain separate with SHA-256 inventories. Repository summaries do not replace raw local session traces and artifacts.

### Recovery deliverables now completed

- **Game:** a runnable zero-dependency Node text combat prototype, arithmetic, QA and asset boundaries. After source review, the lead independently reran 24 tests successfully and the demo reached a real eight-round terminal state (player 8 HP, enemy 0). No engine/human playtest; eight minutes is still an unmeasured goal.
- **Business:** four bilingual model/consistency/open-question/recovery documents. The identical independently authored Python/SQLite checker gives the original SQL 26/29, exit 2, versus 29/29, exit 0 for the candidate adding only two explicit NOT NULL constraints. Original failures concern NULL customer/order keys and resulting query pollution. Undefined line-number/blank-identifier rules are not invented.
- **Chart:** a separate SVG/PNG rendered by the bundled runner, with completion marker, decode verification and actual visual inspection. The 2.00 limit now applies only to the ratio panel, not individual efficiency axes.

These are repairs, not rewritten first-attempt gains. Exact commands/exits are retained in local independent receipts; `benchmark/domain-execution-ledger.json` records hashes and execution states separately from the unchanged case template. Unsettled audio and missing native Office rendering remain explicit. No new Release, version bump or additional profile migration is performed.

### Subsequent native probes and the unchanged original40

Three additional synthetic tasks had inputs and criteria frozen before fresh native child sessions received ordinary task briefs, with no skill names, tool paths, reference answers or parent-conversation seed. Research independently loaded the research method; game-data/Chinese-chart work independently composed game and code-media methods. Engineering was cancelled first, then resumed with authorization in a separate directory and independently loaded engineering. All three artifacts were reviewed, but **this is not three normal first-attempt passes**: only two completed normally; engineering delivered its fix/results before ending with `PI_AI_ERROR / The usage limit has been reached`.

Engineering passed its five existing tests, 3,616 independent integer-interval collections, 17 invalid-input types and frozen-input/decimal/maximum-finite checks, preserving tests and user notes byte-for-byte. Research was reviewed against its synthetic sources. The actual 1600×1120 Chinese PNG passed independent arithmetic, runner validation, full decode and visual review. Its ratio 5.25 and limit 2.00 occupy a separate panel, without claiming balanced gameplay. Ten other factual checks are not ten model tasks. Native requests used `openai-codex / gpt-6.1-sol / max`; both controlled arms used `high` on that model. These tracks are not pooled.

The original 40 identities were first run within the revised52 suite. After finding four changed prompts, the **byte-identical original40** was run separately. One general persona guard then addressed observed changes to recovered field structures and confusion between file repair and session restoration, without embedding answers. The unchanged original40 was rerun separately. Driver, grader, model route and original40 bytes stayed fixed; revised suite bytes were SHA-256-verified after both temporary input switches were restored.

The table reports **grades recorded in original receipts**, not statistical improvement. Completed outcomes use the earliest complete behavioral pair per case, with infrastructure recovery explicit; these do not replace primary interruptions or behavioral failures.

| Suite and candidate | Complete primary pairs | Complete pairs with separate recovery | Baseline passes | Candidate passes | Recorded critical regressions |
|---|---:|---:|---:|---:|---|
| Original40 identities in revised52, before guard | 36/40 | 40/40 | 38 | 38 | research-02, review-02 |
| Unchanged original40, before guard | 39/40 | 40/40 | 36 | 35 | review-02, recover-04, recover-05 |
| Unchanged original40, after general guard | 39/40 | 40/40 | 38 | 34 | research-02, review-02, recover-03, recover-04 |

The targeted `recover-05` case passed after the guard; one changed outcome does not establish causality or overall non-regression. Remaining contract issues/failures are retained, including exact citation IDs/array shapes, unspecified status enums and lists versus counts. Explanations neither turn recorded failures into passes nor blame every failure on the grader. Native probes used the pre-guard version; the new guard has not had a new full native-session retest.

**Release decision: do not release yet.** Three actual artifacts and spontaneous method selection have auditable evidence, but four critical-regression signals remain after repair. Keep the development candidate without a version bump, account/payment-route switch or local configuration migration. See the [separated receipt summary](../benchmark/native-session-results.json). Raw controlled receipts, selected native request headers, event references, source and independent checks remain in the local evidence package; the repository summary is not a complete native-session export or cloud-CI result.
