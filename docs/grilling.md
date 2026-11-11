# grilling 使用说明 / Using grilling

[中文](#中文) · [English](#english)

## 中文

「全能模式」内置 Matt Pocock 的 `grilling` 技能，随本包安装，无需复制到你的 `~/.dsh/skills`，也不需要额外插件。它是一套**把方案问扎实**的访谈方法，不是新的模型能力，不改变权限，也不会替你决定方案。

### 什么时候用

**默认启用**：全能模式的人设要求，在任务含有需要你拍板的设计取舍时先走 grilling，不必你再说「grill 一下」。触发范围是：

- 方案或架构选型、技术栈与依赖替换、数据模型设计；
- 权限、审批、安全或数据外发边界；
- 破坏性或不可逆操作；
- 交付范围、验收标准、成本与时间权衡；
- 需求仍有关键歧义，会改变实现方向。

你也可以随时主动点名，例如「拷问我这个想法」「压力测试这个决策」。

以下情况**不**进入访谈，按普通任务直接推进：需求已明确、步骤既定、机械改动、查证事实、修复已定位缺陷、纯执行或纯读取；以及你只是要求把技能集成或安装进预设这类元任务。

### 它怎么工作

1. 把待定问题组织成一棵**设计树**：每个决策挂着它的下游决策。
2. 每轮只问**前沿**：所有前置条件已定的决策；能现在问的全问完。
3. 每个问题编号、给出推荐答案，措辞让你回答「是」即接受推荐。
4. 等你回答后再重算前沿，问下一轮；依赖未决问题的属于后续轮次。
5. 事实由模型自己查（文件、工具、环境），不向你索要可自行核实的资料；决策归你。
6. 前沿清空、没有隐含假设时才结束，并等你确认达成共识后再动手实施。

### 边界

- 它不会强制你接受推荐答案，也不会在你不回答时继续实施；你随时可以要求跳过或提前结束访谈，之后按你的指示直接推进。
- 「默认启用」不等于每个任务都被追问：纯执行类任务不会进入访谈，以免增加无谓轮次。
- 它不扩大工具、权限、账号或外发范围；访谈期间仍然遵守当前授权与计划模式。
- 较长流程可能多花几轮和若干次工具调用，属于访谈成本，不是模型质量提升。
- 有命令界面的宿主可用 `/grilling` 显式调用；否则用自然语言要求即可。
- 技能正文是英文原文（见 [`skills/grilling/SKILL.md`](../skills/grilling/SKILL.md)），本页是中文说明，不替代原文。

### 来源与许可

上游为 Matt Pocock 的 MIT 技能，固定在提交 `4ae2317d`；原文未做修改，详见 [`skills/grilling/SOURCE.md`](../skills/grilling/SOURCE.md) 与[第三方声明](../THIRD_PARTY_NOTICES.md#中文)。

## English

Omni mode bundles Matt Pocock's `grilling` skill. It ships with this package — no copy into `~/.dsh/skills` and no extra plugin. It is an **interview method for stress-testing a plan**, not new model capability: it changes no permissions and never decides the plan for you.

### When it applies

**Enabled by default**: the persona asks the model to grill whenever a task contains a design trade-off you own, without waiting for you to say "grill this". That covers:

- architecture or stack selection, dependency replacement, data-model design;
- permission, approval, security or data-sending boundaries;
- destructive or irreversible actions;
- delivery scope, acceptance criteria, cost or schedule trade-offs;
- requirements whose remaining ambiguity would change the implementation direction.

You can still invoke it explicitly, e.g. "poke holes in this idea" or "stress-test this decision".

It does **not** enter an interview for: already-specified requirements and steps, mechanical edits, fact lookups, fixes of an identified defect, plain execution or reads — nor when you only ask to integrate or install the skill itself.

### How it works

1. Map open questions as a **design tree**: each decision branches into the decisions that hang off it.
2. Each round asks only the **frontier** — every decision whose prerequisites are settled — and asks the whole frontier at once.
3. Each question is numbered with a recommended answer, worded so "yes" accepts it.
4. It waits for your answers, recomputes the frontier, then asks the next round; anything depending on an open question waits.
5. Facts are the model's job: it checks files, tools and the environment instead of asking you for what it can look up. Decisions are yours.
6. It ends only when the frontier is empty with nothing silently assumed, and waits for your confirmation of shared understanding before implementing.

### Boundaries

- A recommended answer is never forced on you, and it does not implement while your answers are pending; you can ask to skip or end the interview at any point and it will proceed directly.
- "Enabled by default" does not mean every task is interrogated: plain execution stays direct, to avoid needless rounds.
- It does not widen tools, permissions, accounts or external sending; current authorization and plan mode still apply during the interview.
- A long interview costs more rounds and tool calls. That is interview cost, not a model-quality improvement.
- Hosts with a command surface can invoke `/grilling`; otherwise ask in natural language.
- The authoritative instruction body is the English original in [`skills/grilling/SKILL.md`](../skills/grilling/SKILL.md); this page is guidance, not a replacement.

### Provenance and license

Upstream is Matt Pocock's MIT-licensed skill pinned at commit `4ae2317d`, redistributed unmodified. See [`skills/grilling/SOURCE.md`](../skills/grilling/SOURCE.md) and the [third-party notices](../THIRD_PARTY_NOTICES.md#english).
