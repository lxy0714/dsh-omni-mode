---
name: omni-game
description: 游戏概念、GDD、实现、关卡、叙事、引擎、QA与发布的阶段交付及确定性数值检查；明确引擎、素材与实机验证缺口。 / Stage-specific game concept, GDD, build, level, narrative, engine, QA and release delivery with deterministic numerical checks; disclose engine, asset and playtest gaps.
---

# 游戏制作与数值QA / Game production and numerical QA

## 选择交付阶段，不扮演十个岗位 / Select a delivery stage, not ten personas
来源为`dsh-game-studio-presets`固定commit的十个独立配置、同一个highho项目；出处与文本哈希见`../../capabilities/catalog.json`及`../../capabilities/source-excerpts.json`。学习的是以下不同成果契约，不复制十套预设。 / Provenance is ten independent configurations in one pinned highho project, not ten projects. See those resources for source hashes/excerpts. Reuse distinct delivery contracts below inside one preset.

- **studio**：版本目标、平台/输入、循环、预算、风险和跨阶段验收；只合成当前任务需要的阶段。 / Version goal, platform/input, loop, budget, risks and cross-stage acceptance; compose only needed stages.
- **concept**：一句核心体验、30秒循环、目标玩家、独特取舍、必砍范围、可证伪原型测试。 / Core experience, 30-second loop, audience, differentiating tradeoff, cuts and falsifiable prototype test.
- **design/GDD**：规则/状态转换、字段/单位/边界、资源经济、失败条件、UX与验收用例；标注待定参数。 / Rules/state transitions, fields/units/bounds, resource economy, failure conditions, UX and acceptance cases; mark undecided parameters.
- **build**：最小可玩垂直切片、实际项目文件、输入/碰撞/保存接口、运行命令和可复现实测；没有引擎不可声称实机可玩。 / Minimal playable slice, actual files, input/collision/save interfaces, run command and reproducible play evidence; no engine means no playable claim.
- **art-audio**：资产清单`用途/尺寸/帧率/色板/授权/命名/导入路径`及音量/循环/混音要求。游戏素材、地图、音乐、音效任务使用当前可见的游戏素材大师时先读对应guide；没有该工具则明确依赖，不能编造方法。 / Asset manifest with purpose/dimensions/frame rate/palette/license/naming/import path plus loudness/loop/mix requirements. When the visible game-material tool is used, read its topic guide first; otherwise disclose dependency instead of inventing methods.
- **QA**：平台/输入/版本矩阵、复现步骤、期望与实际、存档/数值/性能边界、严重度和未测项。 / Platform/input/version matrix, repro steps, expected/actual, save/numerical/performance boundaries, severity and untested areas.
- **release**：构建标识、版本变更、许可证、干净安装/升级/存档兼容、可执行回滚和发布授权；不自动上架。 / Build ID, changes, licenses, clean install/upgrade/save compatibility, executable rollback and publishing authority; no automatic release.
- **narrative**：人物目标、玩家能动性、分支条件/状态变量、收束点和旁白不越权；必要时组合`omni-fiction`检查显式设定。 / Character goals, player agency, branch conditions/state variables, convergence and non-overriding narration; compose fiction checks when needed.
- **level**：入口/出口、导航线索、节奏、关键路径/可选路径、可达性、软锁/难度和测量计划；纸面关卡不等于可玩关卡。 / Entry/exit, navigation, pacing, critical/optional routes, reachability, soft locks/difficulty and measurement plan; paper design is not a playable level.
- **engine**：实际引擎/版本/目标设备、更新/固定步长、场景/实体生命周期、坐标/单位、资源释放和性能预算；按项目API写，不猜版本。 / Actual engine/version/device, update/fixed step, scene/entity lifecycle, coordinates/units, resource disposal and performance budget; follow the project API, not guessed versions.

## 原生数值检查 / Native numerical checks
读取`../../capabilities/README.md`；用当前可见shell运行`node <package-root>/capabilities/runner.mjs run game.balance --input <authorized-json>`，完整schema由`list`提供。 / Read the CLI guide; run via the visible shell on an authorized JSON input. `list` exposes the full schema.

```json
{"units":[{"id":"scout","hp":60,"damage":12,"interval":0.5,"cost":20},{"id":"tank","hp":180,"damage":30,"interval":2,"cost":60}],"maxEfficiencyRatio":4}
```
`hp>0, interval>0, cost>0, damage>=0`，ID唯一。输出`dps=damage/interval`、`efficiency=dps/cost`、正效率最大/最小比及用户阈值问题；零输出另列问题。hp仅保留输入合法性，不在此模型中充当生存能力指标。 / Positive HP/interval/cost, nonnegative damage, unique IDs. Output DPS, DPS/cost, positive-efficiency max/min ratio and user-threshold issues; zero damage is separately flagged. HP is validated input, not a survivability metric in this model.

必须注明第一性模型缺口：不含护甲、射程、命中、移动、冷却触发、随机或玩家反馈。用户未给阈值时报告计算，不编一个“行业平衡标准”。 / Explicitly state omissions: armor, range, accuracy, movement, cooldown triggers, randomness and player feedback. Without a user threshold, report calculations rather than invent an industry balance standard.

## 放置游戏精确结算 / Exact idle-game settlement
先用`node <package-root>/capabilities/runner.mjs list`核对闭合schema，再以`node <package-root>/capabilities/runner.mjs run <game.offline|game.growth> --input <authorized-json>`调用。只算显式数据，不读存档、操作工程、连接服务器或发布；不替用户定平衡。 / Check closed schemas with `list`, then run either operation with explicit input. Pure declared-data calculation only: no saves, project edits, servers, publishing or invented balance policy.

- **game.offline**：必填安全整数秒`elapsedSeconds,maxOfflineSeconds`、有理效率`efficiency`、`rounding`和资源`resources:[{id,ratePerSecond,rewardCap}]`，资源ID唯一。`t=min(elapsedSeconds,maxOfflineSeconds)`；每资源精确求`t*ratePerSecond*efficiency`，一次取整后再`min(roundedAmount,rewardCap)`。效率可为0或>1，不暗自钳制；cap为本次收益上限，不是库存容量；余数不跨调用结转。 / Required safe-integer seconds, rational efficiency, rounding and uniquely named resources. Multiply the full exact product per resource, round once, then cap this invocation's award (not inventory). Efficiency may be zero or above one; no hidden clamp or fractional carry.
- **game.growth**：必填整数字符串`base`、有理`multiplier`、`levels`和`rounding`；每等级独立求`base*(numerator/denominator)^level`后取整，**不逐步舍入**、不暗设游戏数值cap。保持等级输入顺序，允许重复、倍率1/缩减/0；0级始终为base（空积，含0倍率）。 / Required integer base, rational multiplier, requested levels and rounding. Independently evaluate each level from base, never a rounded recurrence or hidden gameplay value cap; preserve order/duplicates. Level zero is base, including a zero multiplier.
- 所有有理数为`{numerator,denominator}`；大值用≤128位规范非负十进制整数字符串，分母正，拒绝符号、前导0、空白、小数及科学计数法。取整必须显式`floor|ceil|half-up|half-even`（后两者最近整数，半值分别向上/向偶）；输出约分的`exactAmount`及整数字符串，不转Number或近似。 / Rationals use these two decimal-string fields, positive denominator, no coercion/noncanonical text. Rounding is explicit: floor, ceiling, nearest with ties up, or nearest with ties even. Reduced exact fractions and rounded integers remain strings.

最小输入 / Minimal inputs:
```json
{"elapsedSeconds":12,"maxOfflineSeconds":10,"efficiency":{"numerator":"2","denominator":"5"},"rounding":"half-up","resources":[{"id":"gold","ratePerSecond":{"numerator":"7","denominator":"3"},"rewardCap":"8"}]}
```
```json
{"base":"3","multiplier":{"numerator":"3","denominator":"2"},"levels":[3,0,2,1],"rounding":"floor"}
```
前者精确28/3→9→8；后者按原顺序10、3、6、4（不是逐步舍入所得9、3、6、4）。 / Offline: exact 28/3 → rounded 9 → award 8. Growth: 10, 3, 6, 4 in input order, not the rounded-recurrence result.

执行硬限不是平衡建议：秒为0..`Number.MAX_SAFE_INTEGER`；资源1..100、ID≤64字符；等级1..128项、每项0..10000；保留中间整数≤4096位、累计输出数值字符串≤131072位、非0/1乘法按两操作数十进制位数乘积累计≤100000000（每调用重置；拒绝前瞬时乘积最多8192位）。有界乘法/幂超限直接`E_LIMIT`，即使最终取整可能更小也不近似；不合法schema/零分母为`E_SCHEMA`，长度越界为`E_LIMIT`，重复资源为`E_DUPLICATE`。 / Execution guards, not balance advice: safe seconds; 100 resources/64-character IDs; 128 levels up to 10000; 4096-digit retained intermediate integers; 131072 aggregate numeric-string output digits. Each nonzero/nonidentity multiplication costs the product of operand decimal lengths, at most 100000000 per call; rejected transient products are at most 8192 digits. Fail closed without approximation. Local arithmetic is not engine/save migration, economic balance or device acceptance.

## 读写与验收 / Reads, writes and acceptance

`game.build-check` 按输入的目标、版本和同一制品 SHA-256 核对每项必测记录。先用 CLI `list` 看闭合 schema；用实际获准构建和测试结果整理清单，保留未测或失败。旧构建、错目标、错制品不能借用通过状态。结果仅是供给清单对账，不调用引擎、不读真实工程、不替代真机试玩、实测存档和发布授权。 / `game.build-check` matches required tests to a declared target, build and artifact SHA-256. Discover the closed schema with `list`; populate it from authorized build/test observations and retain missing or failed work. Old builds, other targets and other artifacts cannot count. It does not access engines or actual game projects and cannot replace device playtests, save checks or release authorization.
只读获准的输入，写新文件须明确`--out <path> --allow-write`，可用`--root`约束；不覆盖、不联网/导入执行素材代码。不得静默安装引擎、生成器或FFmpeg；代码媒体另按`omni-code-media`真实依赖验收，不能以模型生成作为默认/失败回退。 / Read only authorized inputs; explicit output path plus `--allow-write`, optionally `--root`; no overwrite/network/asset-code execution. Never silently install engines/generators/FFmpeg. Code media has separate dependency acceptance; no generative-model default/fallback.

验收必须分开：数值单测、编辑器导入、设备运行、玩家试玩、发布。`doctor --test`只验证本地数值操作，不为游戏制作全流程背书。 / Separate numerical tests, editor import, device execution, playtests and release acceptance. Doctor tests validate the local numerical operation only.
