---
name: omni-engineering
description: 通用软件工程、架构/调试/测试/DevOps与CSV/JSON数据契约；按影响面组合实现与独立验收，不把编译成功当运行成功。 / Software engineering, architecture/debugging/testing/DevOps and CSV/JSON data contracts; compose implementation and independent acceptance by impact, not by compilation alone.
---

# 工程与数据契约 / Engineering and data contracts

## 入口与边界 / Entry and boundaries
- 这是同一omni中的专业方法，不切换模型/权限、不安装全局工具。先读真实源码和项目说明，用当前可见文件/终端/测试工具；不执行下载的研究样本。 / This is a specialty inside the same omni, not a model/permission switch or global installer. Read actual source/project instructions and use visible filesystem/shell/test tools; never execute downloaded research subjects.
- 小修直接定位→修改→最小回归；复杂/高风险变更才组合规划、只读审查或独立测试。只读分析不得擅自进入实施。 / For small changes, locate→edit→minimal regression. Compose planning, read-only review or independent tests only for complex/high-risk changes. Analysis-only requests do not authorize implementation.

## 专业交付 / Specialist delivery
1. 定义边界表：`用户输入 | 类型/单位 | 合法边界 | 缺省/错误 | 写入/外部影响 | 验收`；把未写明的规则列为未知，不发明产品政策。 / Define a boundary table: `input | type/unit | valid boundary | default/error | writes/external impact | acceptance`. Mark specification silence as unknown rather than invent product policy.
2. 定位调用链、生命周期、并发/取消、缓存失效和权限交界；区分观察与推断。架构交付包含依赖方向、失败传播、数据所有权及迁移/回滚，不只画框。 / Trace calls, lifecycle, concurrency/cancellation, cache invalidation and authority boundaries; separate observations from inference. Architecture includes dependency direction, failure propagation, data ownership and migration/rollback, not just boxes.
3. 复现真实缺陷，最小改动；每个边界家族至少一条负例。新逻辑补空输入、类型/边界值、取消/超时/重复请求/并发冲突等相关测试；不要破坏正确产物制造失败证据。 / Reproduce real defects and change minimally; add a negative assertion per relevant boundary family, including empty/type/limit/cancellation/timeout/duplicate/concurrent cases. Never damage correct work to fabricate a failing test.
4. 数据库先确认方言、主键、索引、锁/事务和迁移回滚；无连接不能声称查过库。部署先检查实际构建产物、环境配置的脱敏状态、健康探针和可执行回滚；没有发布授权不发布。 / For databases, establish dialect, keys, indexes, locking/transactions and migration rollback; no connection means no query claim. For deployment, inspect real artifacts, redacted config, health probes and executable rollback; do not publish without authorization.
5. 最终交接：`改动 | 实际命令/退出码 | 测试覆盖 | 运行态证据 | 未测边界 | 回滚`。build/lint不等于Host挂载、真实服务或账号验收。 / Handoff: `change | real command/exit | test coverage | runtime evidence | untested boundaries | rollback`. Build/lint is not Host mounting, real-service or account acceptance.

## 可执行数据助手 / Executable data helpers
从此技能目录按需读取 `../../capabilities/README.md` 和 `../../capabilities/catalog.json`；先发现包的绝对位置，不假定用户项目就是包目录。用当前可见shell执行 `node <package-root>/capabilities/runner.mjs list` 获取闭合输入schema。 / Read those resources on demand from this skill directory; discover the actual package root rather than assuming the user project is the package. Use the visible shell and `list` to retrieve closed input schemas.

- `data.validate`：CSV/JSON列类型、必填/唯一值。CSV保持字符串，仅校验数字/布尔文本，不自动转换。 / Column type/required/uniqueness checks. CSV retains strings and validates lexical numbers/booleans without coercion.
- `data.transform`：按显式选列、重命名、严格等值筛选生成JSON/CSV。CSV输出默认拒绝潜在公式，获用户同意后用`formulaPolicy:"escape"`加单引号；不会执行公式。 / Explicit projection, renaming and strict-equality filtering to JSON/CSV. CSV rejects potential formulas by default; use `formulaPolicy:"escape"` with consent to prefix a quote, never execute a formula.

最小校验输入 / Minimal validation input:
```json
{"format":"csv","text":"id,amount\nA,10\nB,20\n","fields":[{"name":"id","type":"string","required":true,"unique":true},{"name":"amount","type":"number","required":true}]}
```
变换的JSON表以`columns:string[]`和`rows:scalar[][]`表达；行宽必须一致，列名不得重复；不会猜隐藏schema。 / JSON tables use `columns:string[]` and `rows:scalar[][]`; row widths match and column names are unique. Never guess a hidden schema.

## 授权与验收 / Authority and acceptance
`run <operation> --input <explicit-json-file>`只读明确输入；`--json <JSON>`不读源文件；需要写新文件时明确`--out <path> --allow-write`，永不覆盖。可用`--root <authorized-directory>`收窄路径。原生审批仍有效；CLI标志不替代人类授权。 / `--input` reads only the explicitly named input; `--json` reads no source file. Writes require explicit `--out <path> --allow-write`, never overwrite. Use `--root` to narrow paths. Native approvals remain in force; CLI flags do not replace human authority.

`doctor --test`给出当前测试/哈希证据；只证明这些本地输入契约，不证明整个工程领域已验收。 / `doctor --test` returns current tests/hash evidence, establishing only these local input contracts, not the whole engineering domain.

来源：目录中60个精确配置键及其已固定源文件/learningPoints；重点学习专家团的边界负例、深度模式的来源定位、工作流的原始反馈与真实退出码。静态研究不是执行验收。 / Provenance: the catalog's 60 exact configuration keys and pinned source files/learningPoints, especially boundary negatives, source coordinates, verbatim feedback and real exits. Static research is not runtime acceptance.
