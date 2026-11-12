# 全能模式执行方法 / Omni execution method

[中文](#中文) · [English](#english)

## 中文

### 这是原预设的更新，不是第二套预设

开发版本 `1.6.0-dev.1` 在原 `dsh-omni-mode` 包内增加 `omni-method`。显示名仍为「全能模式」，预设 ID 仍为 `omni`，不新增另一套模式、第三方插件依赖或宿主服务。已发布的 `v1.5.0` 不含这个新技能；固定旧标签安装不会自动得到开发分支改动。

### 触发与使用

复杂任务需要组合多种能力、并行协作、多个交付物或断点恢复时，预设提示模型按需加载该技能。简单查询、机械修改和用户已指定完整步骤的任务不必加载；也可明确要求“用全能模式执行方法处理这项任务”。这是模型遵循的说明，不是强制自动加载器，也不保证每次都会加载。

方法把现有原则细化为五个可操作环节：

1. **成果契约**：确定输入来源、交付位置、字段/单位/边界、约束和实际检查方法；不猜隐藏 schema 或约定答案。
2. **能力选择**：只发现当前步骤需要的工具与技能，区分可见、已授权、已登录与真实验收，不盲装全部插件。
3. **执行与交接**：独立工作并行、依赖工作串行；委派限定可写范围并返回证据，主代理复核；版本冲突先重读。
4. **纠错**：区分输出问题、契约缺失、传输故障、权限拒绝和取消；可能有副作用的操作先查状态，再决定是否重试。
5. **恢复与交付**：按需保留证据位置、未完成项和后台作业标识；恢复时重新核对原始证据；最后一次修改后检查真实成果，不把自报完成当验收。

`grilling` 原文不变，仍用于需要用户拍板的真实设计取舍；新方法不扩大访谈范围。没有用户回答、权限被拒或用户暂停时，不能模拟批准或继续执行受影响操作。检查点仅是交接信息，不自动创建调度器、恢复用户会话或安装持久化服务。

### 研究来源如何落实

这些来源的固定版本与文件哈希已经进入[研究证据库](https://github.com/lxy0714/dsh-omni-mode/blob/main/research/sources.json)。它们提供机制参考，不表示第三方功能已通过运行、安全或效果验收；没有复制这些项目的实现代码。

| 固定来源与证据 | 采用或拒绝 | 在本更新中的位置 |
|---|---|---|
| [dsh-swarm 0.5.1](https://unpkg.com/@joekytc/dsh-swarm@0.5.1/README.md) 与其 [Host 入口](https://unpkg.com/@joekytc/dsh-swarm@0.5.1/lib/index.js) | 借鉴阶段交接与证据契约，不移植专用编排执行器 | 成果契约、依赖顺序、交接复核 |
| [ai-novel-writer 0.1.0](https://unpkg.com/@ethanyoq/dsh-ai-novel-writer@0.1.0/lib/agent.js) | 借鉴窄写入范围和哈希版本保护，不把指南声称为代码级隔离 | 可写范围、版本冲突重读 |
| [subagent-registry 0.19.1](https://unpkg.com/@aiwayds/dsh-subagent-registry@0.19.1/cordis.patch.yml) | 借鉴作用域内的能力指导与结构化交接；不额外加载其工具 | 按任务发现能力、明确交接格式 |
| [task-reliability 0.4.11](https://unpkg.com/dsh-task-reliability@0.4.11/lib/index.js) | 拒绝无人回答时模拟继续的 autopilot 语义；保留原生取消与审批规则 | 未回答/拒绝不能视作批准 |
| [preset-doctor 0.9.3](https://unpkg.com/dsh-preset-doctor@0.9.3/src/index.js) | 区分只读诊断与显式修复，不照抄 README 的自动修复概括 | 纠错与授权边界 |
| [agent-twin 0.4.0-preview.6](https://unpkg.com/@oxmumu3/dsh-agent-twin@0.4.0-preview.6/README.md) | 借鉴已验证与待验收分层，不把文案当真实服务证明 | 交付状态、未测范围说明 |

### 验证与限制

新增原生测试检查两个技能的发现路径与完整正文，覆盖新建与独立进程恢复；模拟适配器还检查方法触发说明确实进入模型请求。发行包测试对两个技能分别移除正文，并放入外部同名诱饵，确保缺少包内技能不能被误判为成功。

这证明的是技能接线、发行包内容和原有运行机制的回归，**不是模型行为改善或三类任务提升证明**。原推理选档、自适应保留和 grilling 原文保持不变；没有切换用户本机预设或发布稳定版。对照实验中的旧候选不包含这个方法，不能把其成绩归给本更新。后续行为评测必须重新固定人设与技能正文哈希，不改旧成绩，也不更换模型来冒充预设提升。

## English

### An update to the existing preset, not a second preset

Development version `1.6.0-dev.1` adds `omni-method` inside the original `dsh-omni-mode` package. The display name remains `全能模式` and the preset ID remains `omni`. There is no extra mode, third-party plugin dependency or Host service. Published `v1.5.0` does not contain this skill; installing that fixed tag does not automatically install development-branch changes.

### Trigger and usage

For complex work involving multiple capabilities, collaborators, deliverables or recovery, the persona asks the model to load this method on demand. Simple queries, mechanical edits and fully prescribed steps do not require it. Users may explicitly request the Omni execution method. This is model guidance, not an enforced auto-loader or a guarantee that the model will load it every time.

The method makes existing principles actionable through five phases:

1. **Outcome contract:** establish provenance, locations, field meanings, units, boundaries, constraints and real checks; never invent hidden schemas or convention answers.
2. **Capability selection:** discover only step-relevant tools and skills; separate visibility, permission, sign-in and real-service acceptance rather than installing every plugin.
3. **Execution and handoff:** parallelize independent work, order dependencies, constrain delegated writes, request evidence and inspect handoffs; reread on revision conflicts.
4. **Correction:** distinguish output errors, missing contracts, transport failures, denial and cancellation; inspect state before retrying possible side effects.
5. **Recovery and delivery:** retain evidence locations, unfinished items and job identifiers when useful; recheck primary evidence on resumption and validate real final artifacts, not completion claims.

The upstream grilling text is unchanged and still handles genuinely user-owned design decisions; this method does not broaden interviewing. An unanswered question, denial or user pause is never simulated approval. Checkpoints are handoff information, not a new scheduler, native session restorer or persistence service.

### From reviewed sources to actual decisions

Fixed versions and file hashes are recorded in the [research evidence](https://github.com/lxy0714/dsh-omni-mode/blob/main/research/sources.json). These are mechanism references, not runtime, security or quality acceptance of third-party features. No implementation code was copied from these projects.

| Pinned source and evidence | Adopted or rejected | Location in this update |
|---|---|---|
| [dsh-swarm 0.5.1](https://unpkg.com/@joekytc/dsh-swarm@0.5.1/README.md) and its [Host entry](https://unpkg.com/@joekytc/dsh-swarm@0.5.1/lib/index.js) | Adapt phase handoffs and evidence contracts, not the dedicated orchestrator | Outcome contract, dependency ordering, handoff verification |
| [ai-novel-writer 0.1.0](https://unpkg.com/@ethanyoq/dsh-ai-novel-writer@0.1.0/lib/agent.js) | Adapt narrow write scope and hash revisions without claiming code-enforced isolation from a guide | Write scope and rereading after conflicts |
| [subagent-registry 0.19.1](https://unpkg.com/@aiwayds/dsh-subagent-registry@0.19.1/cordis.patch.yml) | Adapt scoped capability guidance and structured handoffs without installing its tools | Task-specific discovery and handoff format |
| [task-reliability 0.4.11](https://unpkg.com/dsh-task-reliability@0.4.11/lib/index.js) | Reject autopilot continuation without a user answer; retain native cancellation/approval | No answer or denial is not approval |
| [preset-doctor 0.9.3](https://unpkg.com/dsh-preset-doctor@0.9.3/src/index.js) | Separate read-only diagnosis from explicit repair instead of repeating broad auto-repair claims | Correction and authorization boundaries |
| [agent-twin 0.4.0-preview.6](https://unpkg.com/@oxmumu3/dsh-agent-twin@0.4.0-preview.6/README.md) | Separate verified and unaccepted states without treating prose as real-service proof | Delivery status and untested scope |

### Verification and limits

New native checks compare both skill paths and full bodies during creation and independent-process resumption. The mock adapter checks that the deferred method trigger reaches the actual model request. Package tests remove each skill body in turn and supply external same-name decoys, ensuring a missing bundled skill cannot produce a false success.

This verifies wiring, package contents and runtime regression, **not behavioral gains or improvements in three task categories**. Reasoning selection, adaptive retention and the upstream grilling text remain unchanged. No local preset switch or stable release was made. Earlier candidate experiments did not contain this method; their scores cannot be attributed to it. Later behavioral experiments must freeze new persona and skill-body hashes, retaining original results and never changing models to manufacture a preset gain.
