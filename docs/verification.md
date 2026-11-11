# 验证分层 / Verification layers

[中文](#中文) · [English](#english)

## 中文

本地 1.2 基线通过了 31 项策略/Cordis 测试和完整原生 Harness 会话恢复。公开 1.3 保留该运行时行为，增加可移植测试运行时发现、解包消费与公开 GitHub 安装验证；1.3.1 只补齐双语页面，不改运行时行为。

```sh
npm ci --ignore-scripts
npm run verify
```

完整检查包括：

1. 运行时语法、包元数据、组合 ID 唯一性、模块/配置解析、locale/icon 导出和精确宿主版本。
2. 31 项测试：推理选档、未知能力、用户手选、失败/取消、保留档位、模型切换、空闲生命周期保护、官方裁剪器及隔离/清理。
3. 真实隔离 Host 中的完整预设激活、工具执行、压力裁剪、切小窗口、手动压缩、JSONL 校验与两个独立进程的正常退出/恢复；手动推理选择必须保留。
4. npm 打包、白名单校验、TGZ 解包，并对解包后的实际安装内容重复 Host/恢复场景。

模型适配器为本地确定性模拟。这证明受控条件下的执行/生命周期行为，不证明真实供应商效果或普遍兼容。测试不重启用户引擎，不改其 profile、不复制凭据、不创建 Web 服务器。

原始 fixture Session 与日志保留在被忽略的 `.verification/` 目录，不发布作者机器路径或进程 ID。

本机证据为 Android/Ubuntu、Node 24.22.1、DSH 0.2.2-rc.1。1.3.0 的 GitHub Ubuntu/Node24 CI 已通过；新提交的状态仍以 Actions 实际结果为准，不能从工作流文件推断。其他系统、付费供应商、长期负载、突然断电和所有第三方组合未验证。

## English

The local 1.2 baseline passed 31 strategy/Cordis tests and full native Harness session recovery. Public 1.3 retains that runtime behavior and adds portable test-runtime discovery, extracted-package consumption and public GitHub installation checks. Version 1.3.1 completes bilingual pages without changing runtime behavior.

Commands:

```sh
npm ci --ignore-scripts
npm run verify
```

The full check includes:

1. Runtime JavaScript syntax, package metadata, unique composition IDs, module/schema resolution, locale/icon exports and exact Harness version.
2. 31 tests covering reasoning selection, unknown capabilities, manual choices, errors/cancellation, retention tiers, model switches, idle lifecycle protection, official pruner behavior and service isolation/cleanup.
3. Full preset activation in a real isolated Harness Host, real tool execution, pressure pruning, switching to a smaller declared model, manual compaction, JSONL validation, and normal shutdown/resume in two independent processes. Manual reasoning choices must survive resume.
4. `npm pack`, release-file allowlist checks, TGZ extraction and repeating the full Host/recovery scenario against the extracted package rather than the source checkout.

The model adapter is local and deterministic. This proves execution/lifecycle behavior under fixtures, not real-provider quality or universal compatibility. The test does not restart the user's engine, touch their profile, copy credentials or create a Web server.

Raw fixture sessions and logs stay in ignored `.verification/` directories. No author-machine artifact paths or process IDs are published.

Local platform evidence: Android/Ubuntu, Node 24.22.1, DSH 0.2.2-rc.1. The 1.3.0 Ubuntu/Node24 GitHub CI passed; each newer commit must still be checked on GitHub Actions rather than inferred from the workflow file. Other systems, paid suppliers, long-running load, abrupt power loss and all third-party plugin combinations are unverified.
