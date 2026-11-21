# 1.8阶段B开发态结果 / Phase B development evidence

[中文](#中文) · [English](#english)

## 中文

### 状态与范围

这是同一`dsh-omni-mode`/`omni`的**未发布源码增强**，不是新预设，也不是正式1.7标签的回写。全部领域覆盖计划继续保留；本批只深化游戏数值、工程影响与Markdown核验三类，不修改用户真实游戏工程、不制作宣传片、不安装大SDK或常驻Host插件。

默认环境实测**512 项仓库测试通过（共522项，10项跳过），含192 项能力契约测试**。目录从23条/11个本地操作增加到27条/15个；四个新操作为`game.offline`、`game.growth`、`engineering.impact`、`documents.audit`。100套来源配置/63项目的静态证据投影保持不变；native-only目录更新不是重审来源。完整输入与调用见[CLI指南](../capabilities/README.md)。

### 可以据此相信什么

- 游戏：有界大整数/有理数精确结算；秒cap→完整乘积→显式一次取整→收益cap。成长曲线按每等级从base独立计算，不递推取整、不暗定游戏经济参数。虚拟资源工作单不是真实游戏平衡结论。
- 工程：声明图的反向闭包、全部相交测试、未知与覆盖缺口保守full-suite；`testsExecuted:false`描述操作本身，调用者真正跑测须另留日志。模型图不证明源码/测试归属完整或真实全仓覆盖。
- 文档：固定CommonMark 0.31.2/GitHub Slugger 2.0.0，约399609字节原始代码与许可，仅该操作的短生命周期进程加载；不读用户目标文件、抓网页或渲染HTML。普通定位是块范围，定义观察明确全文范围；GFM脚注、其他HTML/目录/资源片段和有歧义的未解析候选须另核验。

### 反证与修正没有被抹掉

手写原型29自测通过，但独立48例发现16差异，因而没有据此验收。原源文件/测试与失败记录保留。改用标准解析器后，独立88矩阵又发现孤立脚注、跨行候选、定义语法/Unicode折叠及错误回显四组问题，均按根因修复。

最终文档50自测通过；独立旧48/386断言通过，原88/827断言仍为**86过、2红**，没有改原预期使其变绿。剩余U04/U05仅旧预期`E_DUPLICATE`与现在优先校验路径返回`E_PATH`不同，均拒绝且不回显合成凭据；另6隐私组/24断言通过。新增22独立组/26次真实worker/279断言通过。7个transport mock单列，**没有声称真实OOM/超时故障已诱发**。

### 实际任务与综合验收

三类实际任务均已真实调用CLI并读回，不只写方法：

- 游戏工作单：3资源/5等级结果；Lead用独立BigInt直接幂与交叉相乘验算，输入原样、重复等级保留；零分母真实`E_SCHEMA/exit1`。只是虚拟最小单位演示，不修改真实游戏平衡。
- 工程：真实5模块/6导入边切片，从游戏文件影响注册器再到CLI；4个测试ID经固定白名单在34文件SHA一致快照真正跑出90/90。未归属真实清单改动正确建议full-suite/继续发现。辅助指南执行后改动曾触发一次哈希检查失败，收据及前后SHA保留；它不是图节点/测试快照，核心来源与全部快照仍严格相符。Lead独立用Floyd-Warshall核对影响与选择结果。
- 文档：真实指南+游戏技能正文/3实物资产，7链接中4清单目标解析、3外部URL结构检查，0问题；单独合成缺目标负例正确`valid:false/MISSING_TARGET:1/exit0`，未破坏实物。子代理读源/构建输入后遇到账户用量上限，Lead核对输入字节后接手实际调用与读回；不换供应商、不重试该账户，不冒称子代理无中断全程完成。

首批实现时的`npm run verify`记录为：28份双语页面、396仓库/192能力契约测试、已安装rc.1的隔离Host（**mock推理**）、95文件解包消费。解包后四新操作有5次真实CLI调用（含文档负例），安装包不含测试时`doctor --test`明确报告unsupported。另37项阶段A回归通过。源码doctor当时运行6个测试文件并记录24项哈希；它不是本轮维护者证据检查器。

任务均有明确方法提示，不是盲测或同模型因果提升实验；原生Agent轨迹、受控参数、文件SHA、单元mock与真实命令日志分开留存。开发态打包清单版本仍为1.7.0，**不等同已发布1.7标签内容，不应当作正式升级**。

### 未证边界与历史

- **自主使用报告更正**：后续六个Agent任务省略了工具名，但提示使用项目已有能力；至少G1读到参考数值、D2记录对照预期。真实CLI调用仍可作为有提示的使用证据，不能证明无提示自主发现。旧自动检查不能支撑“六项逐项独立校验通过”；原报告、任务和结果保留。
- **发布关卡复核**：维护者证据先实跑、再比对实际输入和执行结果；检查不是签名证明。默认10项跳过来自未显式配置工具环境或测试字体。配置独立的锁定 resvg 2.6.2、现有 FFmpeg/ffprobe 6.1.1 和授权中文字体后，逐字源码副本中的媒体组实测 **23/23 通过、无跳过**。用既有中文测试示例另跑 SVG/PNG/GIF/MP4，执行产物验证和完整解码，并检查字形与首尾帧。这是 Linux arm64/proot 的测试结果，不代表所有平台；严格首轮历史门槛仍待验收，不发布。

本机当前宿主仍是 DSH 0.2.2-rc.1/Node 24.22.1。兼容性复验复用 rc.1，并在独立目录验证官方 rc.2、rc.3、rc.4、rc.5；均为隔离 Host 与模拟推理，不是付费模型质量或线上服务验收。详见[兼容性说明](compatibility.md#中文)。原40题、评分器、历史失败、阶段A未知中断与`releaseGateSatisfied:false`不改写；见[阶段A完整结果](stage-a-contract-results.md#中文)。核心质量/保留/桥接、默认persona与技能frontmatter未为此扩写；只测UTF8字节与哈希，不编造精确token变化。

没有提交、上传、发布、升级当前profile或重启引擎。可回退既往正式标签；标准解析组件的原许可和档案SSRI/文件SHA见[第三方声明](../THIRD_PARTY_NOTICES.md)及[来源记录](../capabilities/vendor/provenance.json)。

## English

### Status and scope

This is **unreleased source work in the same preset**, not another preset or a rewrite of the published 1.7 tag. The all-domain roadmap remains; this batch deepens game arithmetic, engineering impact and Markdown auditing only. No live game project, promotional film, large SDK installation or resident Host plugin is involved.

**512 repository tests pass out of 522 (10 skipped), including 192 capability contract tests**, in the default environment. Entries grow from 23/11 local operations to 27/15, adding `game.offline`, `game.growth`, `engineering.impact` and `documents.audit`. The static 100-configuration/63-project evidence projection stays unchanged; native metadata refresh is not a source re-audit. See the [CLI guide](../capabilities/README.md).

### What the evidence establishes

- Game: bounded exact integers/rationals, explicit time cap/full product/rounding/reward cap, independent growth powers without rounded recurrence or invented economy policy. The virtual-resource worksheet is not live-game balance acceptance.
- Engineering: declared reverse closure/all intersecting tests with conservative fallback. The operation itself never executes tests; caller execution needs separate logs. The supplied graph does not prove whole-repository coverage.
- Documents: pinned CommonMark/GitHub Slugger, 399609 bytes of original source/licenses, loaded only in a short-lived worker. No user-target reads, network or HTML rendering. Honest block/document-wide locations; GFM footnotes, other HTML, directory/asset fragments and ambiguous unparsed candidates need review.

### Counterevidence is retained

The handwritten prototype passed 29 own tests but failed 16 of 48 independent cases, so it was not accepted. Original source/tests and failures remain archived. A subsequent 88-case review found four further classes involving removed footnotes, multiline candidates, definition grammar/case folding and diagnostic disclosure; their root causes were corrected.

The final 50-test suite and independent old48/386 assertions pass. The **unchanged original88 remains 86 passing/2 red across 827 assertions**, not relabelled green: U04/U05 expect `E_DUPLICATE`, while the corrected path-first contract returns `E_PATH`; both reject input without echoing synthetic credentials. Six additional privacy cases/24 assertions and 22 independent groups/26 real workers/279 assertions pass. Seven mocked transport outcomes are explicitly separate; real OOM/timeout induction is not claimed.

### Actual tasks and integrated acceptance

All three tasks used real CLI invocations and saved-output readback:

- Game: three resources/five levels independently checked with direct BigInt powers/cross-products; original parameters and duplicates preserved. The real zero-denominator rejection is E_SCHEMA/exit1, not live balance acceptance.
- Engineering: five modules/six actual static imports; four test IDs execute 90/90 tests through a fixed allowlist in a 34-file byte-identical snapshot. An unmapped real manifest change requests full-suite/discovery. One auxiliary-guide drift caused a preserved hash-check failure; core/snapshot evidence stays exact. Lead separately verifies closure/selection using Floyd-Warshall.
- Documents: actual guide/game skill plus three real assets produce seven links, four resolved inventory targets, three structural external URLs and zero issues. A separate synthetic missing target correctly yields valid:false/MISSING_TARGET:1/exit0. The child hit an account quota after preparation; Lead verified input bytes and completed real CLI/readback, without retrying the account, changing provider or claiming uninterrupted child completion.

The first implementation's `npm run verify` recorded 28 bilingual pages, 396 repository/192 contract tests, the installed rc.1 in an isolated Host with **mock inference**, and a 95-file extracted consumer. Five actual CLI probes exercised all four additions, including a negative document case. Installed-only doctor tests report unsupported. Another 37 Stage A regressions passed; the source doctor then ran six test files and fingerprinted 24 files. It is not this round's maintainer evidence checker.

These are method-guided tasks, not blind or same-model causal experiments. Native traces, parameters, hashes, unit mocks and command logs remain separate. Development package metadata is still 1.7.0, **not the published 1.7 tag content or a formal upgrade**.

### Limits and history

- **Autonomy report correction:** later prompts omitted tool names but directed six agents to use existing project capabilities; at least G1 read reference values and D2 recorded a cross-check against expected results. Real CLI invocations establish prompted use, not unprompted discovery. The old automated check does not support a claim that every product passed independent validation. Original reports, tasks and results remain intact.
- **Release-gate review:** maintainer evidence comes from actual tests and verifies recorded inputs and execution consistency; it is not signed proof. Ten baseline skips are due to unconfigured tool or font inputs. With a standalone locked resvg 2.6.2, existing FFmpeg/ffprobe 6.1.1 and the authorized Chinese font, the media suites passed **23/23 with no skips** in a byte-identical source copy. The existing Chinese fixture also rendered SVG/PNG/GIF/MP4 and passed artifact verification and full decoding; glyphs and first/last frames were visually checked. These results are scoped to Linux arm64/proot. The strict first-attempt historical gate remains open. Do not release.

The live installation remains DSH 0.2.2-rc.1/Node 24.22.1. Compatibility reuses rc.1 and exercises official rc.2, rc.3, rc.4 and rc.5 from fresh test directories. All use isolated Hosts and mock inference, not paid-provider quality or production service acceptance. See [Compatibility](compatibility.md#english). Original40, grading, failures, the Phase A unknown interruption and `releaseGateSatisfied:false` remain unchanged; see [Phase A](stage-a-contract-results.md#english). Core policy/retention/bridge, default persona and skill frontmatter are not expanded; byte/hash measurements are not invented token counts.

No commit, upload, publication, profile upgrade or engine restart is performed. Preserve [third-party notices](../THIRD_PARTY_NOTICES.md) and [pinned provenance](../capabilities/vendor/provenance.json); rollback remains the earlier released tag.
