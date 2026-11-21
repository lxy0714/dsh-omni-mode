# 全能模式 / Omni mode v1.8.0

<!-- dsh-release: ready v1.8.0 -->

[中文](#中文) · [English](#english)

## 中文

`v1.8.0` 继续使用同一个 `dsh-omni-mode` 包和 `omni` 预设。能力索引现有 **20 个本地操作、32 个条目**，区分本地契约、领域方法和外部依赖。

- **游戏**：有理数离线收益与成长曲线；按目标、版本及制品核对必测清单。
- **工程**：按声明依赖与覆盖分析影响面；按候选摘要核对必需交付回执。
- **文档**：使用固定版本的标准解析器核验所供 Markdown 结构、引用与交叉链接。
- **小说与研究**：按披露顺序核对伏笔回收；逐字检查所供片段的引文位置。
- **个性化**：经明确同意生成可撤回的临时风格建议；不自动应用或写入记忆。

### 安装

需要 Node.js `>=24.9.0`，以及 DSH `0.2.2-rc.1` 至 `0.2.2-rc.5` 五个确切版本之一。下载发行附件中的 TGZ，通过 DSH 插件管理器添加；也可使用以下命令，并将 `web` 替换为你的实际 profile：

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.8.0
```

重启 DSH 引擎后新建对话，选择「全能模式」。旧包若也声明 `omni`，请先用插件管理器移除旧包。通过 GitHub 分发，不发布到 npm。

### 验证范围

- 默认环境 614 项仓库测试通过，其中 287 项能力契约测试。配置渲染依赖后，624 项全过；23 项媒体测试通过，在 Linux arm64 从解包制品生成并验证了中文 SVG、PNG、GIF 和 MP4。
- 五个 DSH 版本均通过兼容门禁、隔离宿主创建与跨进程续接、解包消费验证。宿主集成使用本地模拟推理；本地检查不等于外部服务、生产部署或真机验收。

[使用说明](https://github.com/lxy0714/dsh-omni-mode/blob/v1.8.0/docs/README.md#中文) · [能力清单](https://github.com/lxy0714/dsh-omni-mode/blob/v1.8.0/capabilities/README.md) · [校验和与发行包](https://github.com/lxy0714/dsh-omni-mode/releases/tag/v1.8.0)

## English

`v1.8.0` continues the same `dsh-omni-mode` package and `omni` preset. The catalog now has **20 local operations and 32 entries**, separating local contracts, specialist methods and external dependencies.

- **Games:** exact offline rewards and growth curves; required-test checklists bound to the declared target, build and artifact.
- **Engineering:** declared dependency and coverage impact analysis; required delivery receipts bound to one candidate digest.
- **Documents:** a pinned standard parser audits supplied Markdown structure, references and cross-links.
- **Fiction and research:** match setup and payoff in disclosure order; check literal quotations at a specified location in supplied excerpts.
- **Personalization:** draft reversible style suggestions with explicit consent, without applying rules or writing memory.

### Install

Requires Node.js `>=24.9.0` and one of the five exact DSH versions from `0.2.2-rc.1` through `0.2.2-rc.5`. Add the release TGZ in the DSH plugin manager, or run the following command with your actual profile in place of `web`:

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.8.0
```

Restart the DSH engine, create a conversation and select `全能模式`. If a legacy bundle also declares `omni`, remove it through the plugin manager first. Distributed through GitHub, not npm.

### Verification scope

- The default environment passes 614 repository tests, including 287 capability contract tests. With rendering dependencies configured, all 624 pass, including 23 media checks; the extracted package produced and verified Chinese SVG, PNG, GIF and MP4 on Linux arm64.
- All five DSH versions passed the compatibility gate, isolated Host creation and cross-process resumption, and unpacked-consumer checks. Host integration used local mock inference. Local checks do not establish external-service, production deployment or device acceptance.

[Documentation](https://github.com/lxy0714/dsh-omni-mode/blob/v1.8.0/docs/README.md#english) · [Capability guide](https://github.com/lxy0714/dsh-omni-mode/blob/v1.8.0/capabilities/README.md) · [Archive and checksum](https://github.com/lxy0714/dsh-omni-mode/releases/tag/v1.8.0)
