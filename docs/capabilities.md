# 能力边界 / Capability boundaries

[中文](#中文) · [English](#english)

## 中文

「全能模式」改的是**行为与工具子集**：何时追问、如何规划、怎么组合已有能力、何时验证。它**不创造能力**。本页把常见能力按来源分三类，避免把「装了预设」误解成「什么都能做」。

### A. 预设本身能影响

| 能力 | 说明 |
|---|---|
| 工作流程 | 理解目标 → 规划 → 执行 → 验证 → 交付；默认 grilling 决定何时先问 |
| 工具子集 | 选择本预设挂载哪些官方工具（文件、终端、搜索、子代理、计划模式等） |
| 模型选档 | 新会话按可识别标签取最高推理档位，不换供应商或模型 |
| 信息保留 | 按模型窗口在三个隔离池中选择官方裁剪策略 |
| 技能 | 随包提供 `grilling`；也可自行加入其他技能目录 |
| 人设与约束 | 证据优先、缺证据如实报告、歧义先问、不伪造完成 |

### B. 需要另装插件

以下能力预设写什么都不会凭空出现，必须有对应插件并启用：

- 上下文压缩/裁剪的替代实现、记忆与跨会话召回
- 模型路由与多供应商接入、视觉/OCR、语音合成与识别
- 真实浏览器与登录态、会话管理/回滚、通知与 IM
- 文档 Office/数据库连接、设备与桌面操控、MCP 桥接面板
- 插件市场索引、UI 主题与装饰

### C. 需要账号、凭据或宿主配置

- 任何模型供应商的 API Key 或订阅登录
- 外部搜索/视觉/TTS 服务额度
- 数据库连接串、Webhook、机器人凭据、隧道
- 沙箱、审批策略、权限档位（属宿主策略）
- 定时任务调度器、终端形态（TUI/桌面）本身的安装

### 关键结论

1. **工具必须实际安装、启用并可见**，纯 UI 插件不会自动变成模型可调用的工具。
2. **不绕过权限、登录、审批、用户停止或计划模式**；审批不可用时如实报告。
3. **不保证与所有模型、平台或第三方插件兼容**，替换核心服务（压缩、路由、请求生命周期）的插件需单独适配。
4. 字符不等于 token，自适应保留不保证任何输入都不溢出。
5. 安装第三方插件会在 Host 执行代码，工具审批不是插件代码沙箱。

更细的共存与冲突说明见[插件共存](coexistence.md#中文)，兼容范围见[兼容性](compatibility.md#中文)。

## English

Omni mode changes **behavior and tool subsets**: when to ask, how to plan, how to combine existing capabilities, when to verify. It **does not create capabilities**. This page sorts common capabilities by origin so "installed the preset" is not mistaken for "can do anything".

### A. What the preset itself can influence

| Capability | Meaning |
|---|---|
| Workflow | Understand → plan → execute → verify → deliver; default grilling decides when to ask first |
| Tool subset | Choose which official tools this preset mounts (files, shell, search, subagents, plan mode) |
| Reasoning level | New sessions take the highest recognizable effort label; provider and model unchanged |
| Retention | Choose official pruning policy from three isolated pools by declared model capacity |
| Skills | Ships `grilling`; you may add other skill directories |
| Persona rules | Evidence first, report missing evidence, ask on ambiguity, never fake completion |

### B. Requires a separate plugin

No preset wording can conjure these; each needs its plugin installed and enabled:

- Alternative context compaction/pruning, memory and cross-session recall
- Model routing and multi-provider access, vision/OCR, speech synthesis and recognition
- Real browser with login state, session management/rollback, notifications and IM
- Office/database document access, device and desktop control, MCP bridge panels
- Plugin-market indexes, UI themes and decorations

### C. Requires accounts, credentials or host configuration

- Any model provider API key or subscription sign-in
- Quotas for external search, vision or TTS services
- Database connection strings, webhooks, bot credentials, tunnels
- Sandbox, approval policy and permission tiers (host policy)
- The scheduler for timed tasks, and the terminal form (TUI/desktop) itself

### Key conclusions

1. **Tools must actually be installed, enabled and visible**; a UI-only plugin does not become a callable tool.
2. **Permissions, sign-in, approval, user stop and plan mode are not bypassed**; unavailable approval is reported honestly.
3. **Universal compatibility with every model, platform or third-party plugin is not claimed**; plugins replacing core services (compaction, routing, request lifecycle) need dedicated adaptation.
4. Characters are not tokens; adaptive retention is not a universal no-overflow guarantee.
5. Installing third-party plugins executes Host code; tool approval is not a sandbox for plugin code.

See [coexistence](coexistence.md#english) for conflict details and [compatibility](compatibility.md#english) for the verified scope.
