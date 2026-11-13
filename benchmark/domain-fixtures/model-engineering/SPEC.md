# SPEC

`sum(values)` 必须满足 / must satisfy:

1. `values` 为数组；空数组返回 `0`。
2. 所有成员必须为有限数字（`typeof === 'number'` 且 `Number.isFinite`）。
3. 存在非法成员时抛出 `TypeError`，消息包含 `invalid`。
4. 不得使用字符串拼接或隐式类型转换。

An empty array returns `0`. Every member must be a finite number. Any invalid member
throws a `TypeError` whose message contains `invalid`. No string concatenation or
implicit coercion.
