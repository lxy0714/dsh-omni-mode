# 安全说明 / Security

[中文](#中文) · [English](#english)

## 中文

本插件在 DeepSeek Harness Host 中执行普通插件代码；工具审批不等于插件代码沙箱。请审查源码，并在隔离环境中试用不熟悉的改动。

插件本身不需要额外 API key，不采集遥测，也不读取作者的凭据；它使用宿主提供的元数据和服务。Agent 执行的任务仍可能调用用户配置的外部模型或工具。

保留平台权限、登录要求、用户停止与取消、计划模式及工具授权。“质量优先”不授权无关消费、数据外传或无差别文件访问。

不要在公开 Issues 中提交秘密、私人项目、原始对话日志或漏洞凭据。报告疑似漏洞时，先提交不含敏感细节的说明并请求私下报告渠道；在渠道建立前不要公开敏感复现材料。

支持范围限于文档中明确验证的 Harness 版本。升级前检查 Release 和源码；兼容豁免不是安全修复。

## English

This bundle runs ordinary plugin code inside the DeepSeek Harness Host. Tool approval controls do not sandbox plugin code. Review source and use an isolated environment for unfamiliar changes.

The runtime requires no separate API key, does not collect telemetry, and does not read the author's credentials. It uses metadata/services provided by the host. Tasks performed by the agent may still call external providers or tools configured by the user.

Retain platform permissions, login requirements, user stop/cancel, plan mode and tool-specific authorization. “Quality first” does not authorize unrelated purchases, exfiltration, or indiscriminate file access.

Do not post secrets, private project files, raw session logs or exploit credentials in public Issues. For a suspected vulnerability, first open an issue containing only a non-sensitive description and request a private reporting channel; do not publish sensitive reproduction material until such a channel exists.

Support is limited to the exact documented Harness version until additional baselines are verified. Review releases and source before upgrading. A compatibility override is not a security fix.
