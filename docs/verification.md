# 验证分层 / Verification layers

[中文](#中文) · [English](#english)

## 中文

当前正式版（`1.7.0`）在本机通过 263 项仓库测试、64 项领域能力契约测试与 23 项真实渲染测试。上一个稳定版 `v1.5.0` 仍可回退。工程验收与真实模型行为验收是两件事，本版仍带着未通过的行为门槛，详见[增强证据](enhancement-evidence.md#中文)。

```sh
npm ci --ignore-scripts
npm run verify
```

完整检查包括：

1. 运行时语法、包元数据、组合 ID 唯一性、模块/配置解析、locale/icon 导出和精确宿主版本。
2. 仓库测试共 263 项：原有推理选档、未知能力、用户手选、失败/取消、保留档位、模型切换、空闲生命周期保护、官方裁剪器及隔离/清理，加上执行方法、评分器/汇总器、预设分类、领域验收与领域能力契约。
3. 领域能力契约 64 项：11 个本地操作的正常/边界/拒绝路径，CLI 读写与不覆盖、父目录软链接拒绝、ENOSPC 与异常 link 的显式模拟回归，以及只读随包文件的目录校验。
4. 真实渲染 23 项：真实 resvg 与 FFmpeg 下的中文出片、GIF/MP4 编码与完整解码、超时/取消清理、目录碰撞、不安全 SVG 与缺依赖阻塞；无依赖时明确标记 BLOCKED，不用 mock 冒充通过。
5. 真实隔离 Host 中的完整预设激活、工具执行、压力裁剪、切小窗口、手动压缩、JSONL 校验与两个独立进程的正常退出/恢复；手动推理选择必须保留；并从本包内发现 `grilling`、`omni-method` 与 11 个领域技能，逐字加载正文、确认路径来自安装包，且同名外部诱饵不能冒充；能力索引与两个运行器也必须随包可解析。
6. npm 打包、白名单校验、TGZ 解包，并对解包后的实际安装内容重复 Host/恢复场景与技能发现断言；技能正文 Git blob 须与上游 `d2f09a18` 一致。

模型适配器为本地确定性模拟。这证明受控条件下的执行/生命周期行为，不证明真实供应商效果或普遍兼容。测试不重启用户引擎，不改其 profile、不复制凭据、不创建 Web 服务器。

原始 fixture Session 与日志保留在被忽略的 `.verification/` 目录，不发布作者机器路径或进程 ID。

本机证据为 Android/Ubuntu、Node 24.22.1、DSH 0.2.2-rc.1、0.2.2-rc.2 与 0.2.2-rc.3 均已**隔离安装**并实测；渲染仅在 Linux arm64 实测。最新提交在 GitHub 的 Node 24 与 24.9.0 双矩阵 CI 已通过；新提交仍以 Actions 实际结果为准，不能从工作流文件推断。其他系统、付费供应商、长期负载、突然断电和所有第三方组合未验证。

## English

The current release (`1.7.0`) passes 263 repository tests, 64 domain capability contract tests and 23 real render tests locally. The previous stable `v1.5.0` remains available for rollback. Engineering acceptance and real-model behavioral acceptance are different; this release still ships with the behavioral gate unmet, as explained in [enhancement evidence](enhancement-evidence.md#english).

Commands:

```sh
npm ci --ignore-scripts
npm run verify
```

The full check includes:

1. Runtime JavaScript syntax, package metadata, unique composition IDs, module/schema resolution, locale/icon exports and exact Harness version.
2. 263 repository tests: the original reasoning selection, unknown capabilities, manual choices, errors/cancellation, retention tiers, model switches, idle lifecycle protection, official pruner behavior and service isolation/cleanup, plus the execution method, grader/summarizer, preset classification, domain acceptance and domain capability contracts.
3. 64 domain capability contract tests: positive, boundary and rejection paths for all 11 local operations, CLI read/write without overwrite, parent-symlink refusal, explicitly simulated ENOSPC and abnormal-link regressions, and catalog validation that reads only shipped files.
4. 23 real render tests under real resvg and FFmpeg: Chinese output, GIF/MP4 encoding with full decoding, timeout/cancellation cleanup, output collisions, unsafe SVG and missing-dependency blocking. Without dependencies they report explicit BLOCKED rather than a mocked pass.
5. Full preset activation in a real isolated Harness Host, real tool execution, pressure pruning, switching to a smaller declared model, manual compaction, JSONL validation, and normal shutdown/resume in two independent processes; manual reasoning choices must survive resume; `grilling`, `omni-method` and all 11 domain skills must be discovered from the installed package and load verbatim, with exact paths and same-name external decoys unable to substitute; the capability index and both runners must also resolve.
6. `npm pack`, release-file allowlist checks, TGZ extraction and repeating the full Host/recovery and skill-discovery scenarios against the extracted package; the vendored body's Git blob must match upstream `d2f09a18`.

The model adapter is local and deterministic. This proves execution/lifecycle behavior under fixtures, not real-provider quality or universal compatibility. The test does not restart the user's engine, touch their profile, copy credentials or create a Web server.

Raw fixture sessions and logs stay in ignored `.verification/` directories. No author-machine artifact paths or process IDs are published.

Local platform evidence: Android/Ubuntu, Node 24.22.1, DSH 0.2.2-rc.1, 0.2.2-rc.2 and 0.2.2-rc.3 were each **installed in isolation** and tested; rendering is validated on Linux arm64 only. The latest commits passed GitHub CI on both Node 24 and 24.9.0; each newer commit must still be checked on Actions rather than inferred from the workflow file. Other systems, paid suppliers, long-running load, abrupt power loss and all third-party plugin combinations are unverified.
