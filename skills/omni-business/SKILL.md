---
name: omni-business
description: L1实体/关系、L2业务共识和L3问题SOP的语义建模与一致性检查，以及有来源、可证伪的业务行动假设；无数据库连接或投资/经营保证。 / L1 entity/relation, L2 business consensus and L3 question-SOP modeling with consistency checks, plus sourced falsifiable business action hypotheses; no database connection or investment/business guarantees.
---

# 业务语义、数据与行动验证 / Business semantics, data and action validation

## 三层工作，不直接猜SQL / Three layers before SQL
先确认决策问题、使用者、时间范围、数据权限、指标单位/粒度/币种和交付位置。不能把示例数据、类比或模型预测称为真实经营事实。 / Establish decision question, audience, date range, data authority, metric unit/grain/currency and destination. Example data, analogies and predictions are not real business facts.

1. **L1实体结构**：列实体、主键/复合主键、字段类型/可空、关系基数、事实/维表、来源与物理表/列映射；同名不等于同义，身份/时间粒度不能混。 / L1: entities, primary/composite keys, field types/nullability, cardinality, facts/dimensions, provenance and physical table/column mapping. Matching names do not establish meaning; distinguish identity/time grain.
2. **L2领域共识**：指标定义、口径/排除规则、分母/窗口、状态机、负责人和争议；明确哪些已获业务方确认、哪些是提案。 / L2: metric definitions, inclusion/exclusions, denominator/window, state machine, owners/disputes. Separate confirmed consensus from proposals.
3. **L3问题SOP**：`问题 | 输入范围 | 计算步骤 | 去重/空值/时区 | 结果校验 | 证据 | 解释限制`。若需查询先确认只读连接/方言/表结构/参数，再执行实际查询；没有工具或权限就停在计划，不能伪造结果。 / L3: `question | scope | computation | dedup/null/timezone | checks | evidence | interpretation limits`. Before querying, establish a real authorized read-only connector/dialect/schema/parameters. Without tooling/authority, deliver a plan, never fabricated results.

## 原生语义一致性检查 / Native semantic consistency check
从此技能读`../../capabilities/README.md`/目录，可见shell执行`node <package-root>/capabilities/runner.mjs run business.model --input <authorized-json>`。 / Read CLI guide/catalog and use the visible shell.
```json
{"entities":[{"id":"customer","fields":[{"name":"id","type":"string","primary":true}]},{"id":"order","fields":[{"name":"id","type":"string","primary":true},{"name":"customerId","type":"string"}]}],"relations":[{"from":{"entity":"order","field":"customerId"},"to":{"entity":"customer","field":"id"},"cardinality":"many-to-one"}]}
```
支持字段类型`string/number/boolean/date`，显式`primary/nullable/unique`；检查实体/字段重复、主键缺失/可空、端点存在、类型一致和关系唯一性。 / Supports those field types and explicit primary/nullable/unique flags; checks duplicates, absent/nullable PKs, endpoints, type consistency and relation uniqueness.

单字段关系不表达复合映射：多对一目标/一对多源/一对一双方必须独立`unique:true`或为该实体唯一的主键字段。复合主键中的单字段**不能默认视为唯一**，返回`COMPOSITE_KEY_MAPPING_REQUIRED`；多对多提示显式中间实体。 / Single-field relations cannot express composite mappings. Many-to-one targets, one-to-many sources and both one-to-one endpoints must be independently unique or the entity's sole PK field. A component of a composite PK is **not automatically unique**; report mapping required. Many-to-many requires an explicit junction entity.

这是**声明结构**检查，不验证真实数据唯一性/外键完整性、业务共识、索引/查询性能，也不连数据库/执行SQL。实际数据另用获准查询或`omni-engineering`数据校验。 / This checks **declared structure**, not actual uniqueness/FK integrity, consensus, indexes or query performance, and opens no database. Validate real data separately through authorized queries or engineering data checks.

## 决策与创业参谋 / Decision and venture hypotheses
建立`观察 | 来源 | 假设 | 替代解释 | 最小实验 | 成功/停止阈值 | 成本/时限 | 风险/责任人`。历史文本/经典引用逐字回源，区分原语境与现代类比；不编名言，不以权威修辞代替市场/用户证据。给近期可测试行动，不保证收益或替用户承担承诺。 / Maintain `observation | source | hypothesis | alternative | minimal experiment | success/stop threshold | cost/time | risk/owner`. Verify quotations against originals and separate historical context from modern analogy. No invented quotations or rhetoric replacing market/user evidence. Offer near-term testable action, not guaranteed returns or commitments on the user's behalf.

## 授权与验收 / Authority and acceptance
输入读取需获准；写新文件明确`--out <path> --allow-write`，可加`--root`，不覆盖。真实数据库、对外沟通、付款/发布需实际工具及原生批准。 / Authorize reads; explicit new output path/allow-write, optionally root; no overwrite. Real databases, external communication, payments/publication require real tools and native approvals.

验收包括样本映射、指标手算、结构负例和业务方确认；`doctor --test`仅证明本地结构契约，不证明查询结果或商业成功。来源为dlr/maoxuan-pet两个固定配置，学习三层语义与原文核验/可测试行动，不继承外部数据库。 / Acceptance includes sample mappings, hand-calculated metrics, structural negatives and stakeholder confirmation. Doctor tests establish local structure only, not query results or success. Two pinned configurations inform three-layer semantics and sourced actionable hypotheses, not inherited databases.
