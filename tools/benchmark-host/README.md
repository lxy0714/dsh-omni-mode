# 临时模型对照助手 / Temporary paired-model evaluator

[中文](#中文) · [English](#english)

## 中文

这是开发评测工具，不随预设安装包分发。通过插件管理器临时安装后，它提供 `omni_benchmark`：`status` 不调用模型，`pair` 只运行一个冻结任务的 v1.5.0/候选对照。评测完成后移除该临时 bundle；不会切换用户选中的预设，也不读、复制或外发账号凭据。

每个对照在调用开始时固定发起 Agent 当前的同一模型配置。它调用真实已配置 LLM 服务，但通过受控虚拟工具循环而非原生 Agent 执行器：读写只发生在合成任务的内存文件，搜索只返回冻结来源，问题只消费有限的预置回复。不会给模型真实 shell、用户文件、网络或第三方服务，也不执行生成代码。真实模型推理与受控工具不可误写成“全部生产工具端到端已验证”。

两个分支采用同一问题、虚拟文件、来源、回复队列和工具 schema，顺序由任务ID哈希交替；不把标准答案、评分器、另一分支轨迹给模型。没有答案时停止；取消信号/协作超时传给模型流。独立评分检查产物与工具轨迹，不相信模型自述完成。基础设施错误和输出截断应单列，不能当作模型输赢。

回执仅写入被忽略的 `.verification/benchmark/`；保留真实工具轨迹与可见答复，不保存或公开隐藏推理、账号令牌或端点。冻结基线取自 Git tag v1.5.0；当前候选策略及case集各有hash。只应发布脱敏后的汇总，并对照[评测范围](../../benchmark/README.md)解释局限。

## English

This development-only bundle is excluded from the preset installation artifact. Temporarily install it through the plugin manager to expose `omni_benchmark`: `status` makes no model request, while `pair` runs one frozen baseline-v1.5.0/candidate comparison. Remove the temporary bundle afterward. It does not switch the user's preset or read/copy/export account credentials.

A pair pins the initiating Agent's selected model configuration. It calls the real configured LLM service, but uses a controlled virtual-tool driver rather than the native Agent executor: synthetic in-memory files, frozen retrieval and finite prewritten user replies. No real shell, user files, network or third-party fixture actions are exposed; generated code is not executed. Real model inference under these fixtures is not comprehensive production end-to-end verification.

Both arms receive the same question, files, evidence, replies and tool schemas. Task-ID hashing alternates order; expected answers, grader code and the other arm's transcript stay hidden. An unavailable answer stops the case. Cancellation and cooperative deadlines propagate to the model stream. Independent scoring checks artifacts and tool traces rather than trusting completion claims. Infrastructure errors and output truncation must be separated from model outcomes.

Receipts stay in ignored `.verification/benchmark/` and record actual fixture traces and visible answers, not hidden reasoning, credential tokens or service endpoints. Baseline comes from Git tag v1.5.0; case data and candidate policy carry hashes. Publish only sanitized aggregates, with the [benchmark limitations](../../benchmark/README.md).
