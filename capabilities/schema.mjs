// Native, bounded JSON-schema subset. No coercion, evaluation or remote references.
export class CapabilityError extends Error {
  constructor(code, message, path = '$') { super(message); this.name = 'CapabilityError'; this.code = code; this.path = path; }
}
export function fail(code, message, path) { throw new CapabilityError(code, message, path); }
export function validate(schema, value, path = '$', depth = 0) {
  if (depth > 20) fail('E_LIMIT', '嵌套过深 / Nesting exceeds 20', path);
  if (schema.enum && !schema.enum.includes(value)) fail('E_SCHEMA', '值不在允许集合 / Value outside enum', path);
  const t = schema.type;
  if (t === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('E_SCHEMA', '需要对象 / Expected object', path);
    for (const k of Object.keys(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(k)) fail('E_SCHEMA', '保留字段 / Reserved key', `${path}.${k}`);
      if (!Object.hasOwn(schema.properties || {}, k)) fail('E_SCHEMA', '未知字段 / Unknown field', `${path}.${k}`);
    }
    for (const k of schema.required || []) if (!Object.hasOwn(value, k)) fail('E_SCHEMA', '缺少必填字段 / Required field missing', `${path}.${k}`);
    for (const [k, v] of Object.entries(value)) validate(schema.properties[k], v, `${path}.${k}`, depth + 1);
  } else if (t === 'array') {
    if (!Array.isArray(value)) fail('E_SCHEMA', '需要数组 / Expected array', path);
    if (value.length < (schema.minItems || 0) || value.length > (schema.maxItems ?? 10000)) fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
    value.forEach((x, i) => validate(schema.items, x, `${path}[${i}]`, depth + 1));
  } else if (t === 'string') {
    if (typeof value !== 'string') fail('E_SCHEMA', '需要字符串 / Expected string', path);
    if (value.length < (schema.minLength || 0) || value.length > (schema.maxLength ?? 1000000)) fail('E_LIMIT', '字符串长度越界 / String length outside bounds', path);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) fail('E_SCHEMA', '字符串格式错误 / String pattern mismatch', path);
  } else if (t === 'number' || t === 'integer') {
    if (typeof value !== 'number' || !Number.isFinite(value) || (t === 'integer' && !Number.isSafeInteger(value))) fail('E_SCHEMA', '需要有限数字 / Expected finite number', path);
    if (value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) fail('E_SCHEMA', '数字越界 / Number outside bounds', path);
  } else if (t === 'boolean') {
    if (typeof value !== 'boolean') fail('E_SCHEMA', '需要布尔值 / Expected boolean', path);
  } else if (t === 'scalar') {
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) fail('E_SCHEMA', '需要JSON标量 / Expected JSON scalar', path);
    if (typeof value === 'number' && !Number.isFinite(value)) fail('E_SCHEMA', '需要有限数字 / Expected finite number', path);
  } else fail('E_SCHEMA_DEFINITION', '不支持的schema / Unsupported schema type', path);
  return value;
}
export const S = (maxLength = 2000, minLength = 1) => ({ type: 'string', minLength, maxLength });
export const N = (minimum = 0, maximum = 1e12) => ({ type: 'number', minimum, maximum });
export const B = { type: 'boolean' };
export const A = (items, maxItems = 1000, minItems = 0) => ({ type: 'array', items, maxItems, minItems });
export const O = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
export const E = (...values) => ({ type: 'string', enum: values });
export function unique(values, label) { const s = new Set(); for (const v of values) { if (s.has(v)) fail('E_DUPLICATE', `重复${label} / Duplicate ${label}: ${v}`); s.add(v); } }
export function utc(value, path = '$') {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value.replace('Z', '.000Z')) fail('E_DATE', '需要有效UTC秒时间 / Expected valid UTC timestamp YYYY-MM-DDTHH:mm:ssZ', path);
  return Date.parse(value);
}
