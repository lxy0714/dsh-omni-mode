# 全能模式 / Omni mode v1.3.1

[中文](#中文) · [English](#english)

## 中文

本次为文档补丁：补齐仓库说明、全部用户文档、贡献/安全/许可证解释、Issue 表单、工作流显示文字和发行说明的中英双语，并增加语言与链接检查。不改变运行时选档、保留策略、权限或兼容范围。

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.3.1
```

也可下载本 Release 的 TGZ 后在 DSH 插件管理器添加。安装后重启引擎、新建对话，选择「全能模式」；使用实际 profile。旧本地包与本包同为 `omni` ID，不能同时启用。

支持门禁仍为 DSH 0.2.2-rc.1。验证包含双语/链接检查、31 项测试和真实 Harness＋模拟推理的生命周期/发行包回归；具体云端状态以 Actions 实际结果为准。它不是付费模型效果或全插件兼容证明。

MIT 允许使用、修改、fork 和再分发，保留许可证与上游归属。标准英文法律文本不改，提供中文解释。TGZ 和 SHA256 校验文件随 Release 附带；源码档案由 GitHub 根据 tag 生成。没有发布 npm，也不覆盖历史标签。

## English

This documentation patch completes Chinese/English repository text, user docs, contribution/security/license explanations, Issue forms, workflow labels and release notes. It adds language/link checks without changing runtime reasoning, retention, authorization or compatibility.

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.3.1
```

Or add the release TGZ through the Harness plugin manager. Restart, create a new session and select `全能模式`; use the actual profile. The legacy local bundle declares the same `omni` ID and cannot be enabled simultaneously.

The compatibility gate remains DSH 0.2.2-rc.1. Verification includes bilingual/link checks, 31 tests and native Harness lifecycle/package regression with mock inference. Check actual Actions results for cloud status. This is not evidence of paid-model quality or universal plugin compatibility.

MIT permits use, modification, forks and redistribution with notices retained. The canonical English license is unchanged and has a Chinese explanation. The release includes TGZ and SHA256 checksums; GitHub generates source archives from the tag. No npm publication or historical tag rewriting.
