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

## 读写与验收 / Reads, writes and acceptance
只读获准的输入，写新文件须明确`--out <path> --allow-write`，可用`--root`约束；不覆盖、不联网/导入执行素材代码。不得静默安装引擎、生成器或FFmpeg；代码媒体另按`omni-code-media`真实依赖验收，不能以模型生成作为默认/失败回退。 / Read only authorized inputs; explicit output path plus `--allow-write`, optionally `--root`; no overwrite/network/asset-code execution. Never silently install engines/generators/FFmpeg. Code media has separate dependency acceptance; no generative-model default/fallback.

验收必须分开：数值单测、编辑器导入、设备运行、玩家试玩、发布。`doctor --test`只验证本地数值操作，不为游戏制作全流程背书。 / Separate numerical tests, editor import, device execution, playtests and release acceptance. Doctor tests validate the local numerical operation only.
