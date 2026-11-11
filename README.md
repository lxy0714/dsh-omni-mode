# 全能模式 · Omni mode

[English](README.en.md) · [版本记录](CHANGELOG.md) · [兼容性](docs/compatibility.md) · [共存说明](docs/coexistence.md) · [自行修改](docs/customization.md)

面向 **DeepSeek Harness** 的跨项目、质量优先原生 Agent 预设：理解目标 → 按需规划 → 组合工具与代理 → 验证 → 交付。

这是可修改的预设 bundle，不是新模型，不改变模型权重，也不是绕过授权的工具。显示名为「全能模式」，preset ID 为 `omni`。MIT 开源：允许使用、修改、fork 和再分发，请保留许可证和上游归属。

## 安装

当前兼容门限定为 **DSH 0.2.2-rc.1**。先检查你的宿主版本，不要用豁免强装不兼容版本。

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.3.1
```

或者从 [Releases](https://github.com/lxy0714/dsh-omni-mode/releases) 下载固定版本 TGZ 后，通过 DSH 插件管理器添加。桌面用户使用应用自己的插件管理器及实际 profile，不要把 `web` 原样套到所有部署。

安装后**重启 DSH 引擎，新建对话，选择「全能模式」**。既有运行会话不自动切换修订。本包是普通 JS，无需用户另外编译。

**旧本地版本迁移：**旧包 `@local/dsh-omni-preset` 与本包都声明 `omni`，不能同时启用。保留源码备份，通过插件管理器卸载旧包，再安装本包；不要手工删除其他插件或整个 profile。

目前仅发布 GitHub/Release，**未发布 npm**；清单保留 `private: true` 防止误发布，不影响 GitHub 或 TGZ 安装。

## 能做什么

- 按目标发现并组合当前会话可见的文件、搜索、终端、技能、插件、MCP、资料库与子代理能力，不局限于某个项目。
- 新会话尝试选择当前模型支持且语义可识别的最高推理档位；不更换供应商或模型，用户后续手选优先。
- 信息保留按模型窗口与输出保留选择隔离的官方裁剪器；切小窗口前采用保守容量。
- 保留官方压缩、溢出恢复与存档关系；元数据未知或发现失败时回退，而不是猜一个巨大窗口。
- 质量优先，不为节省费用主动降级目标；不为了“全能”盲调所有工具、无限重试或强行并发写同一文件。

## 重要边界

- 工具必须实际安装、启用并向该 Agent 开放；纯 UI 插件不会自动变成 AI 工具。
- 不绕过权限、登录、工具确认、用户停止、计划模式或各循环工具的使用条件。
- 不保证与所有模型、平台或第三方插件兼容。替换压缩器、模型路由和请求生命周期的插件尤其需要单独适配。
- 字符不等于 token；自适应保留不保证任何输入都不溢出。不可压缩的前缀或单个巨大消息仍可能超过模型容量。
- 安装第三方插件会在 Host 执行代码；工具审批不是插件代码沙箱。

## 安装后自己修改

推荐 fork 或 clone 仓库，在自己的源码目录修改，再安装本地目录：

```sh
git clone https://github.com/lxy0714/dsh-omni-mode.git
cd dsh-omni-mode
# 修改 cordis.patch.yml 的 persona 或工具配置
# 然后将此目录的绝对路径交给 DSH 插件管理器安装
```

配置主要在 `cordis.patch.yml`；模型选档在 `quality.js`；自适应保留在 `adaptive.js`；隔离桥接在 `pool.js`。改代码后重启引擎并新建会话。不要只改包管理器缓存里的文件，以免升级覆盖。保留 `omni` 可兼容同名预设选择；要与原版并存，必须同时更换预设 ID、声明行 ID、包名和私有服务标识并测试。详见[修改指南](docs/customization.md)。

## 验证与开发

```sh
npm ci --ignore-scripts
npm run verify
```

开发依赖固定到已验证 DSH；测试从项目依赖发现运行时，也支持 `DSH_TEST_BASE` 指向已有安装的 package.json，不依赖作者手机路径。

验证分为语法/清单、31 项策略及真实 Cordis 测试、完整 DSH 会话及独立进程恢复、TGZ 解包消费测试。**集成中的模型是本地模拟适配器，不代表真实模型效果或所有环境验收。** CI 状态以 [Actions](https://github.com/lxy0714/dsh-omni-mode/actions) 实际结果为准；本地通过不冒充云端已通过。

## 升级、卸载与反馈

升级前备份自己改过的源码。使用插件管理器移除旧版本，再安装固定新版本，并重启引擎。卸载只移除本插件，不要删除 DSH 的会话或其他插件数据。回退使用之前的 tag/TGZ，且须满足相应宿主版本。

反馈请到 [Issues](https://github.com/lxy0714/dsh-omni-mode/issues)，注明 DSH/Node/系统、插件版本、最小复现、已脱敏错误和共存插件；不要上传令牌、整个 profile、会话原文或私人项目。

[MIT 原文](LICENSE) · [许可证双语说明](docs/license.md) · [第三方声明](THIRD_PARTY_NOTICES.md) · [安全说明](SECURITY.md) · [双语文档目录](docs/README.md)
