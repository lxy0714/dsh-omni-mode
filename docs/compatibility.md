# 兼容性 / Compatibility

[中文](#中文) · [English](#english)

## 中文

| 组件 | 当前范围 |
|---|---|
| Harness | `engines.dsh: ">=0.2.2-rc.1 <=0.2.2-rc.3"`，rc.1、rc.2、rc.3 均隔离安装实测；范围外版本由宿主拒绝 |
| Node | 完整 DSH 组合的受支持下限 `24.9.0`；本机实测 `24.22.1` |
| 平台 | 本机 Android/Ubuntu 及 GitHub Ubuntu/Node24 CI；其他平台不作已验证承诺 |
| 模型 | 推理/容量决策依赖已声明的元数据；未知能力回退，不编造支持 |
| 第三方插件 | 可见的普通工具可按需调用；没有逐一验证全部组合 |

精确版本门禁是有意设计。新 Harness 可能改变生命周期、Session 或组合接口；应先增加隔离测试基线，通过后再放宽范围。

推理档位 ID 是适配器私有值。初始化只对可识别的人类可读标签排序，传回原 ID；不更换 provider/model。恢复、清空与压缩不会重新强制设置首次选档。

信息保留先扣除声明的输出保留及 8192-token 安全空间：未知/小容量使用 8192 字符阈值；可用空间至少 131072 tokens 时使用 32768 字符，至少 524288 时使用 131072 字符。字符不是 token，不保证任意输入都不溢出。

官方压缩使用 8192-token 安全空间、8192-token 的**摘要**输出上限和 0.12 近期原文比例；这些不是主对话推理或输出限额。过大的固定系统/工具前缀或缺失容量仍可能导致失败。

正在运行的 Agent 保留原修订；重启/恢复按记录的预设 ID 加载当前定义。本项目不覆盖其他预设或全局默认模型。

## English

| Component | Current scope |
|---|---|
| Harness | `engines.dsh: ">=0.2.2-rc.1 <=0.2.2-rc.3"`, rc.1, rc.2 and rc.3 installed in isolation and tested; the host refuses anything outside it |
| Node | Supported minimum for the full Harness composition `24.9.0`; local tests used `24.22.1` |
| Platform | Local Android/Ubuntu and GitHub Ubuntu/Node24 CI; other platforms not claimed |
| Model | Advertised metadata required for reasoning/capacity decisions; unknown data falls back, without inventing support |
| Third-party plugins | Generic visible tools can coexist; all combinations are not tested |

The exact gate is intentional. A future Harness upgrade may change lifecycle, session or composition contracts. Add an isolated test baseline and update the gate only after validation.

Reasoning effort IDs are opaque. Initialization ranks only recognizable advertised human labels and passes the original ID unchanged. It does not switch provider/model. Resume, clear and compact do not reapply the fresh-agent default.

Retention selects official immutable pools after reserving declared output plus 8192 tokens: unknown/small capacity uses an 8192-character threshold, at least 131072 available tokens uses 32768 characters, and at least 524288 uses 131072 characters. Characters are not tokens; this is not a universal no-overflow guarantee.

Official compaction uses 8192-token headroom, an 8192-token **summary** output cap and 0.12 recent retention. These are not caps on the main conversation's reasoning or output. Too-small fixed system/tool envelopes or missing model capacities can still fail.

Existing live agents retain prior revisions. Restart/resume resolves the current definition for the recorded preset ID. This project does not override unrelated presets or the global model default.
