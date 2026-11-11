# 全能模式 / Omni mode v1.4.0

[中文](#中文) · [English](#english)

## 中文

本次把 Matt Pocock 的 MIT `grilling` 技能内置进预设：随包安装、无需复制到 `~/.dsh/skills`，通过官方 `skill-filesystem` 与 `tool-skill` 提供。

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.4.0
```

也可下载本 Release 的 TGZ 后在 DSH 插件管理器添加。安装后重启引擎、新建对话，选择「全能模式」；使用实际 profile。旧本地包与本包同为 `omni` ID，不能同时启用。

**怎么用**：直接说「grill 一下这个方案」「拷问我这个想法」或「压力测试这个决策」。它会按设计树分轮提问，只问当前能决定的问题，每个问题附推荐答案，达成共识后再实施。以下不会自动进入访谈：只是要求集成/安装技能、或已明确交代需求要求直接执行。

**验证**：真实隔离 Harness 中，从本包内 `skills/grilling/SKILL.md` 发现 `grilling` 并逐字加载成功（创建与恢复两个独立进程均通过）；31 项策略测试；TGZ 解包后重复同一断言；技能正文的 Git blob `d2f09a18` 与上游一致。推理为本地确定性模拟，不代表真实模型行为；云端 CI 以 Actions 实际结果为准。

兼容门禁仍为 DSH 0.2.2-rc.1；未改选档、保留策略、权限或外发边界。上游为 MIT，版权与许可见 `skills/grilling/LICENSE` 和[第三方声明](https://github.com/lxy0714/dsh-omni-mode/blob/main/THIRD_PARTY_NOTICES.md#中文)；中文说明见[grilling 使用说明](https://github.com/lxy0714/dsh-omni-mode/blob/main/docs/grilling.md#中文)。附件提供 TGZ 与 SHA256；未发布 npm，不覆盖历史标签。

## English

This release bundles Matt Pocock's MIT-licensed `grilling` skill into the preset. It ships with the package — no copy into `~/.dsh/skills` — and is exposed through the official `skill-filesystem` and `tool-skill` plugins.

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.4.0
```

Or add the release TGZ through the Harness plugin manager. Restart, create a new conversation and select `全能模式`; use your actual profile. The legacy local bundle declares the same `omni` ID and cannot be enabled simultaneously.

**Usage**: ask to "grill this plan", "poke holes in this idea" or "stress-test this decision". It interviews in rounds over a design tree, asks only what you can decide now, recommends an answer per question, and implements after shared understanding. It does not auto-start when you merely ask to integrate/install the skill or when an already-specified task should simply run.

**Verification**: in a real isolated Harness, `grilling` is discovered from this package's `skills/grilling/SKILL.md` and loads verbatim in both the create and resume processes; 31 policy tests plus the new skill-discovery assertions; the same assertions repeat against the extracted TGZ; the body's Git blob matches upstream `d2f09a18`. Inference is a deterministic local mock, so this is not proof of real-model behavior. Check actual Actions results for cloud CI.

The compatibility gate remains DSH 0.2.2-rc.1 with no change to reasoning, retention, authorization or external-sending boundaries. Upstream is MIT: copyright and permission text are in `skills/grilling/LICENSE` and the [third-party notices](https://github.com/lxy0714/dsh-omni-mode/blob/main/THIRD_PARTY_NOTICES.md#english); see [using grilling](https://github.com/lxy0714/dsh-omni-mode/blob/main/docs/grilling.md#english). The release includes TGZ and SHA256 checksums; no npm publication and no historical tag rewriting.
