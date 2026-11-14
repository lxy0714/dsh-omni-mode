# 验证入口 / Verification

[中文](#中文) · [English](#english)

## 中文

公开验证记录见[验证分层](docs/verification.md#中文)；哪些增强已真正执行、哪些仍未证明，见[增强证据与未证事项](docs/enhancement-evidence.md#中文)。不发布原始 Session、进程 ID 或作者机器路径。

运行 `npm ci --ignore-scripts` 和 `npm run verify` 可复现检查。集成使用真实 Harness 服务与本地确定性模拟推理，不调用付费供应商。

当前仓库测试 263 项、领域能力契约 64 项、真实渲染 23 项（真实 resvg + FFmpeg，0 跳过）；文档中的数字由 `scripts/check-claims.mjs` 与实际测试结果比对，不一致即失败。代码视觉的真实渲染测试需要显式设置工具环境与 FFmpeg，否则会明确标记 BLOCKED 而不是假装通过。DSH 兼容版本 `0.2.2-rc.1`、`0.2.2-rc.2`、`0.2.2-rc.3` 各自隔离安装后跑过完整原生集成；这些是本地受控测试，不是桌面实机验收。

## English

Public notes live in [verification layers](docs/verification.md#english); what was actually executed and what remains unproven is in [enhancement evidence and unproven claims](docs/enhancement-evidence.md#english). Raw sessions, process IDs and author-machine paths are not published.

Run `npm ci --ignore-scripts` and `npm run verify`. Integration uses real Harness services and deterministic local mock inference, not a paid provider.

Current figures: 263 repository tests, 64 domain capability contracts and 23 real render tests (real resvg + FFmpeg, 0 skipped). Numbers in the docs are compared with actual test results by `scripts/check-claims.mjs`, which fails on any mismatch. Real render tests need an explicit tool environment and FFmpeg; without them the suite reports BLOCKED rather than pretending to pass. DSH `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` were each installed in isolation and passed the full native integration; that is controlled local testing, not desktop-app acceptance.
