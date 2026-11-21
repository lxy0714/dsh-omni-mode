# 公开契约开发评测 / Public-contract development evaluation

## 中文

临时开发工具，不是另一个预设，也不是生产功能依赖。复用旁边未改动的历史驱动，使用项目根目录的新公开契约套题；不修改旧题、旧成绩、当前模型或 profile 文件。仅在获准评测时安装；完成后可用插件管理器移除此临时包。

先运行 `omni_contract_benchmark` 的 `status` 检查新套题，再 `freeze` 保存精确来源、双方策略/技能与当前路由。后续 `pilot`、`pair`、`sweep` 必须使用返回 UUID。最多每次8题、每分支24轮是预注册实验边界，不是预设费用上限。`recover` 仅对真实基础设施失败做一次单列恢复，禁止挑选行为最好的一次。未完成和传输错误不会变成成功。

原始新收据保存在项目 `.verification/contract-benchmark/<UUID>/receipts`；不含私有推理正文，只记公开工具轨迹和请求摘要。公开任务与工具摘要必须在双方相同；旧最终结果评分与中间模拟恢复声明诊断分列。真实提供商推理不等于真实项目/原生会话恢复验收。此包依赖其工作区旁的原项目文件，不作为独立可分发库。

图标复用同项目 MIT 授权的原评测图标。安装/资源检查不代表用户界面视觉验收。

## English

A temporary development tool, not another preset or a production dependency. It reuses the untouched neighboring historical driver against the new public-contract suite without editing old tasks/scores, the selected model or profile files. Install only for authorized evaluation and remove the temporary bundle with the plugin manager afterward.

Use `status`, then `freeze` to capture exact sources, both policies/skills and the current route. `pilot`, `pair` and `sweep` require the returned UUID. Eight cases per sweep and 24 calls per arm are preregistered experiment boundaries, not preset spending caps. `recover` allows one separately reported infrastructure recovery, never behavioral best-of selection. Incomplete calls and transport faults are not successes.

New receipts live in the project's `.verification/contract-benchmark/<UUID>/receipts`. They retain public tool traces and request digests, not private reasoning text. Both arms must share public task/tool digests; final-outcome grading and intermediate simulated-restoration signals are separate. Real-provider inference is not real-project/native Session acceptance. This package depends on its neighboring workspace sources and is not a standalone distribution library.

The icon reuses the original evaluator's MIT-licensed project artwork. Installation/resource inspection does not establish visual UI acceptance.
