# 贡献指南 / Contributing

[中文](#中文) · [English](#english)

## 中文

欢迎 fork 仓库，建立聚焦单一问题的分支并提交 Pull Request。请说明目标、改动前后行为、测试结果和兼容性影响，避免无关的运行时代码改动。

```sh
npm ci --ignore-scripts
npm run verify
```

固定版本的 Harness 仅用于开发测试，不会打进插件。也可设置 `DSH_TEST_BASE` 指向已有安装的 package.json。新增宿主版本必须先验证，不能直接放宽 `engines.dsh`。

请使用公开 API，保持服务提供者与消费者隔离，处理取消和卸载清理。不要重写活动 profile、拦截凭据、伪造授权、添加任意 Session 事件类型，或为一个会话修改整个预设共享配置。

测试应区分真实服务与模拟推理，不能从静态检查推导真实模型提升或跨平台兼容。修改 exports、files、名称或相对路径后，要检查解包后的发行包能否被实际加载和使用。

不要提交 `.verification/`、`node_modules/`、本机配置、凭据、真实对话或生成的压缩包。保留 MIT 和上游声明；CI 不应放入付费 API key。只有工作流实际运行后，其结果才构成证据。

## English

Fork the repository, create a focused branch, and submit a pull request. Keep runtime changes small and describe the goal, behavior before/after, tests and compatibility impact.

```sh
npm ci --ignore-scripts
npm run verify
```

The pinned development Harness is a test dependency, not shipped inside the plugin. You may set `DSH_TEST_BASE` to an existing installation package.json. Do not broaden `engines.dsh` without testing the additional version.

Keep public APIs, isolated providers/consumers, cancellation and cleanup. Do not rewrite active profiles, intercept credentials, fabricate approval, create arbitrary session event types or mutate shared per-preset configuration for one session.

Tests must distinguish real services from mock inference. Never claim real-model improvement or cross-platform support from static checks. Include extracted-package installation/consumption checks when changing exports, files, names or relative paths.

Do not commit `.verification/`, `node_modules/`, local profiles, credentials, real conversations or generated archives. Preserve MIT and upstream notices. Do not add a paid API key to CI. CI status is evidence only after the workflow has run.
