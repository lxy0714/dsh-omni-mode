# 1.8 阶段 C：本地契约与实测 / Phase C: Local contracts and task evidence

[中文](#中文) · [English](#english)

## 中文

**`v1.8.0` 使用同一个 `dsh-omni-mode` 包和 `omni` 预设。** 本页记录阶段 C 的本地操作与实例；此前的 [阶段 B 证据](stage-b-results.md#中文)独立保留。

### 五个可执行切片

| 操作 | 核对什么 | 不等于 |
| --- | --- | --- |
| `engineering.delivery-check` | 限定候选摘要与必需回执，报告缺失、错候选、失败、未跑 | 验签、已执行检查、部署许可 |
| `game.build-check` | 目标、版本、制品摘要和每项必测声明是否关联 | 实际引擎构建、真机、上架批准 |
| `fiction.thread-check` | 按披露顺序匹配伏笔与后续回收；提前和重复单列复核 | 解析正文或评价文学质量 |
| `research.quote-check` | 供给片段内的指定区间逐行等值，不去别处补匹配 | 原件真伪、语境、主张支撑 |
| `personalization.style-draft` | 仅在显式同意后生成当前范围的枚举规则，撤回检查当前声明 | 自动应用、读取原稿、身份推断、写记忆 |

使用[本地 CLI 指南](../capabilities/README.md)和机器可读的[目录](../capabilities/catalog.json)发现完整 schema。20 个操作的 `verified` 只指测试过的本地契约；原有 5 个方法型、5 个依赖型、2 个未覆盖条目仍在。未重新研究 100 套来源配置/63 个项目。

### 实际本地任务

- 工程：取此前 rc.5 实际解包验证的 tarball 和日志，重新计算两者 SHA-256，再把日志回执绑定到对应候选；故意不提供回滚演练回执，输出 `MISSING_RECEIPT`。不把旧包的通过转给新候选。
- 游戏：读取仓库的数值夹具，实际生成三角色数值工作表并独立重算 DPS；把已观察结果绑定到工作表 SHA-256，清单正确保留引擎冒烟测试未测。只是可复算的本地样例，不是引擎、实机或真实游戏工程。
- 研究：从真实已发布标签 `v1.7.0` 的许可证读取并固定片段，检查标题的确切位置；故意把同一文字指向下一行，得到 `text-mismatch`。核对操作没读取原件、没联网，也不输出原文。

三个任务均实际运行 CLI，独立断言输出，保留输入、命令、摘要和 stdout。小说与风格也有专门契约测试与解包探针；不把这些探针当真实用户稿件或生产验收。

### 验收范围

这些实例证明本地操作在所给输入上产生预期结果；不代表真实项目、外部服务或模型能力改善。宿主、包与渲染的实测范围见[验证说明](verification.md#中文)。

## English

**`v1.8.0` uses the same `dsh-omni-mode` package and `omni` preset.** This page records Phase C operations and local examples; [Phase B evidence](stage-b-results.md#english) remains separate.

### Five executable slices

| Operation | Checks | Does not prove |
| --- | --- | --- |
| `engineering.delivery-check` | Required declared receipts bound to one candidate; missing, mismatched, failed or unrun checks | Signature validity, execution or deployment approval |
| `game.build-check` | Declared target, build, artifact digest and required test linkage | Engine builds, on-device tests or store approval |
| `fiction.thread-check` | Setup and payoff in disclosure order; flags early and repeated events for review | Prose parsing or literary quality |
| `research.quote-check` | Exact lines at the stated location within the supplied excerpt; no match elsewhere | Original authenticity, context or claim support |
| `personalization.style-draft` | Enum-only scoped suggestions after explicit consent; undo compares supplied current state | Application, original-draft access, identity inference or memory writes |

See the [local CLI guide](../capabilities/README.md) and machine-readable [catalog](../capabilities/catalog.json) for complete schemas. `verified` applies only to the 20 tested local contracts. The five method, five dependency and two uncovered entries remain. The 100-configuration/63-project source inventory was not re-audited.

### Actual local tasks

- Engineering: rehash the prior rc.5 archive and its real unpacked-consumer log and bind that receipt to the same candidate; omit any rollback rehearsal receipt and detect `MISSING_RECEIPT`. An older package's result does not carry over to the new candidate.
- Game: use the repository's arithmetic fixture to generate a real three-unit worksheet and independently recompute DPS; bind the observed check to the worksheet SHA-256 and leave the engine smoke untested. This is a reproducible local example, not engine, device or real-project acceptance.
- Research: read the actual tagged `v1.7.0` license and check its heading at the exact supplied location; use that same text at the next line as a negative control and get `text-mismatch`. The operation does not access the original, use network or echo quotation text.

All three ran through the CLI with independent result assertions and retained inputs, commands, digests and stdout. Fiction and style have separate contract tests and unpacked-consumer probes; those do not constitute real-draft or production acceptance.

### Acceptance scope

These examples establish the expected results for supplied inputs, not acceptance of real projects or external services, or improved model quality. See [verification](verification.md#english) for Host, package and rendering evidence.
