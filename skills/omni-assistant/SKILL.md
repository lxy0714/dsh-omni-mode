---
name: omni-assistant
description: 个人/工作待办、会议可用性、旅行规划与清理风险清单，生成有依赖的本地Markdown待办及UTC ICS草稿；发送/预订/提醒仍须真实工具与确认。 / Personal/work todos, meeting availability, travel planning and cleanup risk manifests, with dependency-aware Markdown todos and UTC ICS drafts; sending/bookings/reminders still need real tools and confirmation.
---

# 个人与工作事务 / Personal and work logistics

## 分清草稿、承诺与真实动作 / Distinguish drafts, commitments and actions
确认目标、相关人员、日期/时区、地点、预算、约束与用户想要“建议/草稿/实际执行”哪一种。未注明时区的关键日程先问；不替用户接受会议或承诺进度。 / Establish goal, participants, dates/timezone, place, budget, constraints and whether the user wants advice/draft/action. Ask about material timezone ambiguity; do not accept meetings or commit progress for the user.

- **会议**：可用/不可用/待确认三态足够，私人原因留在本地；候选时段、冲突和待用户决定事项分开，不把有空当同意。 / Meetings: available/unavailable/unknown, keeping private reasons local. Separate candidate slots, conflicts and user decisions; availability is not acceptance.
- **工作**：记录已承诺事项与建议待办，负责人/截止/依赖/阻塞分开。状态来自实际证据，不能把发送成功或队友空闲当任务完成。 / Work: distinguish commitments from suggestions; track owner/deadline/dependency/blocker separately. Status comes from evidence, not message delivery or idle workers.
- **旅行**：确认出发地、日期/时区、人数、签证/无障碍/预算与偏好；价格/班次/营业时间需实时核验和访问时间。路线/预算表与预订/支付分开，缺必要账号就明确依赖。 / Travel: establish origin/dates/timezones/party/visa/accessibility/budget/preferences; verify live prices/services/hours with retrieval time. Separate itinerary/budget from booking/payment; disclose missing required accounts.
- **清理**：先只读盘点，清单`绝对路径 | 类型/大小 | 保留理由 | 风险 | 拟操作 | 可恢复性`；按风险分层，删除必须明确批准，优先可恢复路径，绝不以诊断通过代替删除许可。 / Cleanup: read-only inventory first, with absolute path/type/size/retention/risk/proposed action/recoverability. Tier risk, obtain explicit deletion authority and prefer reversible paths; diagnosis is not permission.

## 原生本地输出 / Native local outputs
从本技能按需读`../../capabilities/README.md`和目录；当前可见shell执行`node <package-root>/capabilities/runner.mjs run <id> --input <authorized-json> --text`。 / Read guide/catalog on demand; run through the visible shell.

**assistant.todo**输入 / input:
```json
{"title":"Launch / 发布准备","items":[{"id":"review","text":"Review evidence / 复核证据","done":false,"dependsOn":[],"due":"2026-11-20"},{"id":"publish","text":"Ask for release approval / 请求发布批准","done":false,"dependsOn":["review"]}]}
```
ID唯一，依赖必须存在且无环，日期为有效`YYYY-MM-DD`；已完成任务仍有未完成依赖时列问题。输出真实Markdown，但**不创建提醒或调度任务**。 / Unique IDs, existing acyclic dependencies and valid dates; flag done tasks with unfinished dependencies. Outputs real Markdown, **not reminders or scheduled tasks**.

**assistant.ics**输入 / input:
```json
{"events":[{"uid":"review-1@example.org","summary":"Review / 复核","start":"2026-11-20T01:00:00Z","end":"2026-11-20T02:00:00Z","description":"Draft only / 仅草稿","location":"Online / 线上"}]}
```
只接受明确UTC秒时间`YYYY-MM-DDTHH:mm:ssZ`，结束晚于开始；UID唯一；转义反斜线/逗号/分号/换行，拒绝非法控制字符，按UTF8字节折行。**不解析自然语言/夏令时、不导入日历、不发邀请**。DTSTAMP使用给定开始时间以保持可复现，是草稿元数据而非发送时间证据。 / Explicit UTC second timestamps only, end after start, unique UIDs. Escapes slash/comma/semicolon/newlines, rejects invalid controls and folds UTF8 lines. **No natural-language/DST interpretation, calendar import or invitations**. Deterministic DTSTAMP uses supplied start, not proof of send time.

## 授权与验收 / Authority and acceptance
明确输入读取，写新文件须`--out <path> --allow-write`，可加`--root`；不覆盖。CLI标志不代替原生审批。真实提醒/短信/会议邀请/预订/支付需要当前可见工具、实际账号和必要确认；没有工具就只交付草稿，不能编方法名。 / Authorize reads; new files require explicit path/allow-write, optionally root; no overwrite. Flags do not replace native approval. Real reminders/messages/invites/bookings/payments require visible tools/accounts/confirmation. Without them, deliver drafts, not invented methods.

先读回待办/ICS并检查时区/文本/依赖；若用户要实际导入，使用真实可用工具并核对真实结果，启动应用/草稿生成不能当完成。`doctor --test`只验收本地文档操作。 / Read back drafts and inspect timezone/text/dependencies. Real imports need an available tool and verified result; launching an app or generating a draft is not completion. Doctor tests accept local document operations only.

来源四配置meeting、xingyuan、cleanup、travel-planner；学习可用性隐私、承诺区别、清理清单与必要/可选依赖分离。固定证据见目录sourceRefs。 / Four configurations inform availability privacy, commitments, cleanup manifests and required/optional dependency separation. See pinned catalog sourceRefs.
