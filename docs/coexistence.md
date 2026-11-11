# 插件共存 / Coexistence

[中文](#中文) · [English](#english)

## 中文

全能模式不是封闭工具白名单。插件或 MCP 工具只要已安装、启用、连接正常并向当前 Agent 可见，就可以使用。纯 UI 插件需要另外提供工具/操作接口，才能被 Agent 调用。

信息保留提供者、官方裁剪器池、桥接别名和压缩消费者位于预设私有隔离组，不替换 Host 全局模型或压缩服务。因此，全局替换插件可能不作用于本预设；隔离防止意外覆盖，不等于自动集成。

潜在冲突包括重复预设 ID、同作用域工具/服务重名、竞争的模型/请求改写、同 realm 多提供者、错误的事件/生命周期写入，以及未正确管理的监听器。替换核心服务的插件要专项测试。

旧本地包 `@local/dsh-omni-preset` 也声明 `omni`，不能和 `dsh-omni-mode` 同时启用。要让 fork 成为独立可选预设，必须一致地更改包名、声明/预设 ID 和私有别名。

共存测试应共同启用两插件、新建会话、实际调用工具、按需切模型、持久化/恢复、卸载其中一个并确认另一个正常。现有测试验证原生组合和无服务泄漏，不认证所有第三方组合。

## English

Omni mode is not a closed allowlist. A plugin or MCP tool can be used when installed, enabled, connected and visible to the current Agent. Plugins that only render UI need a tool/action interface before the agent can invoke them.

The retention provider, its official pools, bridge aliases and compaction consumers are in preset-private isolation groups. They do not replace the Host's global model or compaction service. A global replacement may therefore not affect this preset; isolation prevents unwanted overlap, not automatic integration.

Potential conflicts include duplicate preset IDs, same-scope tool/service names, competing model/request changes, multiple providers in one realm, incorrect event/lifecycle writes and unowned listeners. Core-service replacement plugins require focused testing.

The legacy local bundle `@local/dsh-omni-preset` declares the same `omni` ID. Do not enable both that bundle and `dsh-omni-mode`. For an independently selectable fork, rename package, declaration/preset IDs and private aliases consistently.

A useful compatibility test enables both plugins, creates a session, invokes their actual tools, switches models if relevant, persists/resumes, unloads one plugin and verifies the other. Existing tests verify native Harness composition and no service leakage; they do not certify every third-party combination.
