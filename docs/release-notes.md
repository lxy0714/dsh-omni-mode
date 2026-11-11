# 全能模式 / Omni mode v1.5.0

[中文](#中文) · [English](#english)

## 中文

本次改变**何时**使用内置的 grilling 技能：从「你点名才用」变为「默认启用」。技能原文、许可证和归属不变。

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.5.0
```

也可下载本 Release 的 TGZ 后在 DSH 插件管理器添加。安装后重启引擎、新建对话，选择「全能模式」；使用实际 profile。旧本地包与本包同为 `omni` ID，不能同时启用。

**默认启用范围**：任务含有需要你拍板的设计取舍时，先走 grilling——方案/架构选型、技术栈或依赖替换、数据模型、权限与安全边界、破坏性或不可逆操作、交付范围与验收标准、成本与时间权衡，或需求仍有会改变实现方向的关键歧义。它会按设计树分轮提问，只问当前能决定的问题，每题附推荐答案，达成共识后再实施。

**不会触发**：需求已明确、步骤既定、机械改动、查证事实、修复已定位缺陷、纯执行或纯读取；也不会因为你只是要求集成或安装技能而启动访谈。你随时可以说跳过访谈。

**验证**：真实隔离 Harness 中从本包发现并逐字加载 grilling（创建与恢复两进程均通过）；31 项策略测试；TGZ 解包后重复同一断言；技能正文 Git blob 仍为上游 `d2f09a18`。推理为本地确定性模拟，不代表真实模型行为；云端 CI 以 Actions 实际结果为准。

兼容门禁仍为 DSH 0.2.2-rc.1；未改选档、保留策略、权限或外发边界。本次是人设策略变更，属于行为变化，故按次版本发布。附件提供 TGZ 与 SHA256；未发布 npm，不覆盖历史标签。

> 说明：人设只描述触发条件，模型是否严格遵循取决于模型自身。若发现该问的没问、或不该问的追问了，请带最小复现到 Issues 反馈。

## English

This release changes **when** the bundled grilling skill is used: from "only when you ask" to "enabled by default". The skill text, its license and provenance are unchanged.

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.5.0
```

Or add the release TGZ through the Harness plugin manager. Restart, create a new conversation and select `全能模式`; use your actual profile. The legacy local bundle declares the same `omni` ID and cannot be enabled simultaneously.

**When it applies by default**: whenever a task contains a design trade-off you own — architecture or stack selection, dependency replacement, data model, permission/security boundaries, destructive or irreversible actions, delivery scope and acceptance criteria, cost or schedule trade-offs — or remaining ambiguity that would change the implementation direction. It interviews in rounds over a design tree, asks only what you can decide now with a recommended answer, and implements after shared agreement.

**What does not trigger it**: fully specified requirements, established steps, mechanical edits, fact lookups, fixes of an identified defect, plain execution or reads — and merely asking to integrate or install the skill. You can say to skip the interview at any time.

**Verification**: in a real isolated Harness, grilling is discovered from this package and loads verbatim in both create and resume processes; 31 policy tests; the same assertions repeat against the extracted TGZ; the body's Git blob still matches upstream `d2f09a18`. Inference is a deterministic local mock, not proof of real-model behavior. Check actual Actions results for cloud CI.

The compatibility gate remains DSH 0.2.2-rc.1 with no change to reasoning, retention, authorization or external-sending boundaries. This is a persona policy change, so it ships as a minor version. The release includes TGZ and SHA256 checksums; no npm publication and no historical tag rewriting.

> Note: the persona states the trigger conditions; strict adherence depends on the model. If it interrogates when it should not, or skips a decision it should raise, please file a minimal reproduction in Issues.
