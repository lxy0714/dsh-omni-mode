# 阶段 A：公开契约实测 / Phase A: public-contract results

[中文](#中文) · [English](#english)

## 中文

### 结论

**新公开契约版本已有完整 40 对记录：v1.5 基线与 v1.7 候选均为 40/40 通过，关键通过均为 40。** 原先四项差异及恢复修复用例在新版本中均通过；记录中未发现候选相对基线的关键退步，亦无模拟任务写成原生会话已恢复的中间信号。

这不能写成“预设能力已经提高”：候选策略及技能本轮没有改变，双方共同获得更明确的接口规范；同题单轮也不是盲测或因果证明。本轮实际加强的是验证底座，而非领域功能。历史原题、旧分、旧失败记录和旧门槛均保留。

**严格的干净首轮门槛仍为 false。** 中断时有一次调用结果未知，不能因为后来补齐记录就抹掉该缺口；因此“记录内结果条件满足”与“严格首轮验收通过”必须分开。

### 实际结果与来源

| 项目 | 基线 | 候选 |
|---|---:|---:|
| 完整记录内通过 | 40/40 | 40/40 |
| 关键通过 | 40/40 | 40/40 |
| 已记录的基础设施错误 | 0 | 0 |
| 模拟恢复真值异常写入 | 0 | 0 |

- 实验 ID：`be73ada7-cdc7-47a5-a7b2-a673d453a000`。
- 40 份原始收据、80 个分支、390 次已记录模型调用；另有一个不计分接线任务，不混入成绩。
- 实际路由：`openai-codex / gpt-6.1-sol / high`；双方相同，未切换供应商或降低推理档位。
- 80 个分支用冻结评分器离线重放，与各自原分逐对象一致，差异为 0。
- 每方的完成状态为 38 个 `complete` 和 2 个按题意等用户回答的 `needs-user`；后两项正确停下，不代表生成了未授权成果。
- 四个重点任务为 `research-02`、`review-02`、`recover-03`、`recover-04`；另核查 `recover-05`。通过指本套受控产物/轨迹判据，不代表真实网站、部署、账号或原生会话恢复验收。

### 中断与格式缺陷如何处理

1. **未知中断保留**：2026-11-14T12:52:35.895Z 发起的批量调用中断后无持久结果。恢复时确认仅有此前 8 份收据、无在运行任务。冻结驱动逐题等待写完收据后才进入下一题，因此后续题可继续；首题 `debug-04` 是否已产生推理仍未知。其后保存的完整配对只算首份已记录结果，不冒称已证实的干净首轮。
2. **不捏造失败或恢复**：未知调用没有虚构调用次数、产物、分数或提供商失败收据，也没有塞入基础设施恢复轮。单独日志保留未知状态；严格门槛因此保持 false。
3. **封套版本兼容**：本次冻结写入器的描述符版本 1 覆盖了原拟写的收据版本 2。原始文件确实为版本 1，未被改写。分析器仅对这个已知驱动哈希和协议，在内存中投影封套版本以复用旧验证接口，明确记录投影数量及原始 SHA；不改变题目、工具轨迹、成果或原评分。其他不认识的版本仍拒绝。
4. **防止错误归功**：旧评分器、旧实验和新实验彼此分开。新成绩不回填旧的 `releaseGateSatisfied:false`，也不把共同规范改善算作候选独占收益。

独立复核另核对了 390 条请求摘要和 100 次历史检查反馈，均无差异。请求摘要证明控制器边界的记录一致性，不是服务端签名或完整 wire 日志。诊断只覆盖模拟输入下结构化写入的顶层恢复真值，不是全面语义安全证明；五个重点任务还进行了人工轨迹复核。

试验收齐后，另为**未来写入**修复了封套覆盖顺序，并补充“省略中断证据必须拒绝”的 API 负例。新写入器通过本地 mock/文件测试，不冒称已重装并经真实提供商复测；本次旧收据、旧驱动快照和分数不改。后续源码变化另有记录。

### 冻结标识

```text
原40题: d4b960440eadf1bdb6c867c564a2e0633d2df2f0bd73a4bfd89e413cfe19bca5
新套题: 9b995d3c2c054afababb3d35da52ad8a3cba303cbc61f987eca11db6f4523318
公开契约: 05d8b7a291ab07755a59021a44e658084424b62e8196b940cbe153d32b779677
评分器: b6c72ddedd521585e6807863f06d70513c5c1110a0f3855b61b6c4fe18772b1c
本次驱动: 66e03a0ab11104cde281e2e99272ff1cd00089e87231363a98141b3ddbaf15a0
候选策略: baf0eadf5c1525a03bbf8e953734af69d3885b2892cae61be640fc03da4d243a
```

### 验证、运行态与剩余条件

- 原仓库 263 项测试、独立新增 37 项测试均通过；完整 `npm run verify` 通过，包括文档/声明检查、rc.1 真实宿主加 mock 推理的创建/续接集成、打包与解包消费者检查。37 项不冒充已纳入原 263 项的套件。
- 本轮真实提供商推理来自上述 80 个受控分支；宿主集成中的 mock 不是这份实测分数，也不代表 rc.3 本轮复测。
- 没有重新安装约 1.2 GB SDK。测试按需借用现有运行时；开发评测助手不是生产预设依赖，也没有新增第二个预设。
- 插件管理器初期曾提示完整配置需重启，未擅自重启。完成后临时助手移除操作返回 `applied`；配置目录已无该条目，实际工具目录也无该工具，测试借用链接已移除，源码及证据保留。原有旧评测助手的缺 SDK 警告仍单列，未将整个 profile 宣称无问题。
- 仍缺：无未知中断的严格首轮证明；跨真实领域至少三类实际功能/成果增强；真实项目、设备和所需外部服务验收。未发布 1.8，也未重新发布 1.7。

### 开发仓库复核入口

下列命令仅用于含开发文件和本次原始记录的仓库，不是已安装运行包的功能。输出使用新文件名，不覆盖原件。

```sh
node --test scripts/benchmark/contract-report.test.mjs
node scripts/benchmark/contract-report.mjs \
  --experiment be73ada7-cdc7-47a5-a7b2-a673d453a000 \
  --out new-report.json
```

下一步仍以同一通用 omni 为核心，按全部已分类领域推进实际能力；旧40题只作为回归之一，不靠继续猜格式或反复跑同一批样本包装提升。完整历史归因见[首轮审计](stage-a-audit.md#中文)，后续范围见[路线图](roadmap-1.8.md#中文)。

## English

### Conclusion

**The separate public-contract version has 40 complete recorded pairs: both the v1.5 baseline and v1.7 candidate pass 40/40, including 40 critical passes.** The four previously discordant cases and the recovery-repair case pass in this version. Recorded pairs show no critical candidate regression or intermediate simulated-task claim of native restoration.

This does not establish improved preset capability. Candidate policy/skills were unchanged, both arms received clearer common interface constraints, and this same-case single round is neither held-out nor causal evidence. The actual enhancement is verification infrastructure, not domain functionality. Original cases, scores, failures and the historical gate remain unchanged.

**The strict clean-first-attempt gate remains false.** An interrupted invocation has unknown outcome; completing the recorded pairs cannot erase that gap. Recorded outcome conditions and strict first-attempt acceptance are distinct.

### Measured results and provenance

| Item | Baseline | Candidate |
|---|---:|---:|
| Passes among complete recorded pairs | 40/40 | 40/40 |
| Critical passes | 40/40 | 40/40 |
| Recorded infrastructure errors | 0 | 0 |
| Intermediate simulated-restoration flags | 0 | 0 |

The experiment ID is `be73ada7-cdc7-47a5-a7b2-a673d453a000`: 40 original receipts, 80 arms and 390 recorded model calls, excluding a separate unscored wiring pilot. Both arms used `openai-codex / gpt-6.1-sol / high`; no provider switch or reasoning downgrade occurred. Replaying all 80 arms with the frozen grader matches every stored grade exactly. Each arm has 38 `complete` and two correctly waiting `needs-user` outcomes; waiting is not unauthorized artifact completion.

The targeted cases are `research-02`, `review-02`, `recover-03`, `recover-04`, with `recover-05` also inspected. Passing means the bounded fixture artifact/trace predicates, not live-web, deployment, account or native Session acceptance. Exact source/contract/grader/driver/policy hashes are recorded in the Chinese section above.

### Interruptions and the receipt-envelope defect

An invocation started at 2026-11-14T12:52:35.895Z was interrupted without a durable result. On continuation, only the preceding eight receipts existed and no task was running. The frozen driver awaits each receipt before entering the next case, so subsequent cases could continue. Whether inference for the first case, `debug-04`, began remains unknown. Its later complete pair is its first recorded result, not a proven clean first attempt.

No calls, scores, artifacts or provider-failure receipt were invented for that invocation. Its unknown status is kept in a separate note, not inserted into a recovery round; strict acceptance remains false.

The frozen writer spreads descriptor version 1 after intended receipt version 2. Original receipts therefore genuinely retain version 1. The analyzer permits an explicitly disclosed, in-memory envelope projection only for this known driver hash and protocol, retaining original hashes and all outcome/trace fields. Unknown versions remain rejected. This is not rewriting original files, grades or history.

Independent review also verified 390 request digests and 100 historical checks without differences. These establish controller-boundary record consistency, not provider signatures or complete wire logs. The diagnostic only detects a top-level restoration flag in structured simulated-task writes, not every semantic safety issue; the five targeted cases received manual trace review as well.

After this cohort finished, the spread order was separately corrected for **future receipts**, with a negative test requiring callers to supply interruption evidence explicitly. The corrected writer passed local mock/file tests, not a claimed reinstallation and new real-provider trial. Old receipts, frozen driver and scores remain untouched; post-cohort source changes are separately recorded.

### Verification and remaining conditions

All 263 existing repository tests and 37 separately run new tests passed. Full `npm run verify` passed, including documentation/claim checks, real rc.1 host create/resume with mock inference, and packed/extracted consumer checks. The extra 37 are not falsely counted inside the original 263.

The 80 controlled arms used the real configured provider. Host-integration mocks are not these model scores, and this is not a fresh rc.3 test. No approximately 1.2 GB SDK reinstallation occurred. Dependencies were borrowed from the installed runtime; the temporary evaluator is not a production preset dependency or a second preset.

The plugin manager initially requested a restart for full configuration application; none was forced. After evaluation, temporary-bundle removal returned `applied`, and both the configuration directory and actual tool directory no longer contained it. Borrowed test links were removed while sources/evidence were retained. The pre-existing legacy evaluator's missing-SDK warning remains disclosed; the entire profile is not declared issue-free.

Still missing: a clean-first-attempt proof without unknown interruption; at least three actual domain functionality/artifact enhancements; real-project/device/external-service acceptance where required. No 1.8 release or 1.7 re-release was made.

Use the development-only commands above to reproduce analysis when the original receipts are available, writing a new output file. Continue strengthening the same general omni across all classified domains. Original40 remain one regression suite, not a reason to manufacture gains through guessing formats or repeatedly rerunning the same known samples. See the [initial audit](stage-a-audit.md#english) and [roadmap](roadmap-1.8.md#english).
