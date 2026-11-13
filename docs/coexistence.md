# 插件共存 / Coexistence

[中文](#中文) · [English](#english)

## 中文

全能模式不是封闭工具白名单。插件或 MCP 工具只要已安装、启用、连接正常并向当前 Agent 可见，就可以使用。纯 UI 插件需要另外提供工具/操作接口，才能被 Agent 调用。

信息保留提供者、官方裁剪器池、桥接别名和压缩消费者位于预设私有隔离组，不替换 Host 全局模型或压缩服务。因此，全局替换插件可能不作用于本预设；隔离防止意外覆盖，不等于自动集成。

潜在冲突包括重复预设 ID、同作用域工具/服务重名、竞争的模型/请求改写、同 realm 多提供者、错误的事件/生命周期写入，以及未正确管理的监听器。替换核心服务的插件要专项测试。

本轮新增能力带来的共存点：

- **本地领域操作**只用 Node 内置模块、通过普通终端运行，不注册全局工具，因此不与其他插件抢工具名；但写入仍需你显式授权并遵守原路径范围。
- **代码视觉**依赖外部 FFmpeg/ffprobe 与独立的可选 resvg 工具环境，不是预设自带。若你同时装了其他媒体插件，两者的 FFmpeg 版本、字体目录与临时目录互不影响，但同一输出目录并发写入会因不覆盖策略而失败——这是有意的保护，不是冲突 bug。
- **字体**由你显式提供：项目内字体走包含性校验，项目外字体必须声明 `externalAuthorization`。预设不复制、不分发任何第三方字体。

旧本地包 `@local/dsh-omni-preset` 也声明 `omni`，不能和 `dsh-omni-mode` 同时启用。要让 fork 成为独立可选预设，必须一致地更改包名、声明/预设 ID 和私有别名。

共存测试应共同启用两插件、新建会话、实际调用工具、按需切模型、持久化/恢复、卸载其中一个并确认另一个正常。现有测试验证原生组合和无服务泄漏，不认证所有第三方组合。

## English

Omni mode is not a closed allowlist. A plugin or MCP tool can be used when installed, enabled, connected and visible to the current Agent. Plugins that only render UI need a tool/action interface before the agent can invoke them.

The retention provider, its official pools, bridge aliases and compaction consumers are in preset-private isolation groups. They do not replace the Host's global model or compaction service. A global replacement may therefore not affect this preset; isolation prevents unwanted overlap, not automatic integration.

Potential conflicts include duplicate preset IDs, same-scope tool/service names, competing model/request changes, multiple providers in one realm, incorrect event/lifecycle writes and unowned listeners. Core-service replacement plugins require focused testing.

Coexistence points introduced by this round's additions:

- **Local domain operations** use Node built-ins and run through the ordinary terminal; they register no global tool, so they cannot collide on tool names. Writes still need your explicit authorization and stay within the original path scope.
- **Code media** depends on an external FFmpeg/ffprobe and a separate optional resvg tool environment; neither ships with the preset. If you also run another media plugin, the FFmpeg build, font directories and temp directories are independent, but concurrent writes into one output directory fail under the no-overwrite policy — that is deliberate protection, not a conflict bug.
- **Fonts** are supplied explicitly by you: in-project fonts get a containment check, and outside fonts must declare `externalAuthorization`. The preset copies and distributes no third-party font.

The legacy local bundle `@local/dsh-omni-preset` declares the same `omni` ID. Do not enable both that bundle and `dsh-omni-mode`. For an independently selectable fork, rename package, declaration/preset IDs and private aliases consistently.

A useful compatibility test enables both plugins, creates a session, invokes their actual tools, switches models if relevant, persists/resumes, unloads one plugin and verifies the other. Existing tests verify native Harness composition and no service leakage; they do not certify every third-party combination.
