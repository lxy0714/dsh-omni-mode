# grilling 使用说明 / Using grilling

[中文](#中文) · [English](#english)

## 中文

「全能模式」内置 Matt Pocock 的 `grilling` 技能，随本包安装，无需复制到你的 `~/.dsh/skills`，也不需要额外插件。它是一套**把方案问扎实**的访谈方法，不是新的模型能力，不改变权限，也不会替你决定方案。

### 什么时候用

在对话中明确要求即可，例如「grill 一下这个方案」「拷问我这个想法」「压力测试这个决策」「帮我挑毛病再实现」。在这些情况下模型应加载该技能，按设计树分轮提问。

以下情况**不应**自动进入访谈：

- 你只是要求把技能集成、安装或发布进预设（本版就是这种情况）。
- 你已明确交代需求并要求直接执行；此时普通任务照常推进，只有真正影响范围的用户决策才询问。

### 它怎么工作

1. 把待定问题组织成一棵**设计树**：每个决策挂着它的下游决策。
2. 每轮只问**前沿**：所有前置条件已定的决策；能现在问的全问完。
3. 每个问题编号、给出推荐答案，措辞让你回答「是」即接受推荐。
4. 等你回答后再重算前沿，问下一轮；依赖未决问题的属于后续轮次。
5. 事实由模型自己查（文件、工具、环境），不向你索要可自行核实的资料；决策归你。
6. 前沿清空、没有隐含假设时才结束，并等你确认达成共识后再动手实施。

### 边界

- 它不会强制你接受推荐答案，也不会在你不回答时继续实施。
- 它不扩大工具、权限、账号或外发范围；访谈期间仍然遵守当前授权与计划模式。
- 较长流程可能多花几轮和若干次工具调用，属于访谈成本，不是模型质量提升。
- 有命令界面的宿主可用 `/grilling` 显式调用；否则用自然语言要求即可。
- 技能正文是英文原文（见 [`skills/grilling/SKILL.md`](../skills/grilling/SKILL.md)），本页是中文说明，不替代原文。

### 来源与许可

上游为 Matt Pocock 的 MIT 技能，固定在提交 `4ae2317d`；原文未做修改，详见 [`skills/grilling/SOURCE.md`](../skills/grilling/SOURCE.md) 与[第三方声明](../THIRD_PARTY_NOTICES.md#中文)。

## English

Omni mode bundles Matt Pocock's `grilling` skill. It ships with this package — no copy into `~/.dsh/skills` and no extra plugin. It is an **interview method for stress-testing a plan**, not new model capability: it changes no permissions and never decides the plan for you.

### When it applies

Ask for it explicitly, e.g. "grill this plan", "stress-test this decision", or "poke holes in this before implementing". The model should then load the skill and interview in rounds.

It should **not** start an interview when:

- You only asked to integrate, install or publish the skill into the preset (as this release does).
- You already stated the requirement and asked for direct execution; ordinary work proceeds, and only genuine user-owned scope decisions are asked.

### How it works

1. Map open questions as a **design tree**: each decision branches into the decisions that hang off it.
2. Each round asks only the **frontier** — every decision whose prerequisites are settled — and asks the whole frontier at once.
3. Each question is numbered with a recommended answer, worded so "yes" accepts it.
4. It waits for your answers, recomputes the frontier, then asks the next round; anything depending on an open question waits.
5. Facts are the model's job: it checks files, tools and the environment instead of asking you for what it can look up. Decisions are yours.
6. It ends only when the frontier is empty with nothing silently assumed, and waits for your confirmation of shared understanding before implementing.

### Boundaries

- A recommended answer is never forced on you, and it does not implement while your answers are pending.
- It does not widen tools, permissions, accounts or external sending; current authorization and plan mode still apply during the interview.
- A long interview costs more rounds and tool calls. That is interview cost, not a model-quality improvement.
- Hosts with a command surface can invoke `/grilling`; otherwise ask in natural language.
- The authoritative instruction body is the English original in [`skills/grilling/SKILL.md`](../skills/grilling/SKILL.md); this page is guidance, not a replacement.

### Provenance and license

Upstream is Matt Pocock's MIT-licensed skill pinned at commit `4ae2317d`, redistributed unmodified. See [`skills/grilling/SOURCE.md`](../skills/grilling/SOURCE.md) and the [third-party notices](../THIRD_PARTY_NOTICES.md#english).
