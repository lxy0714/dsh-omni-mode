import { types } from 'node:util';
import { A, E, O, S, fail, validate } from './schema.mjs';

// The candidate and receipts are declarations, not artifacts or attestations.
const MAX_CHECKS = 500;
// Unlike $, a strict end-of-input assertion also rejects a final line break.
const END = '(?![\\s\\S])';
const checkIdSchema = {
  ...S(100),
  pattern: `^(?!(?:__proto__|prototype|constructor)${END})[A-Za-z0-9][A-Za-z0-9._:-]*${END}`,
  description: 'Case-sensitive check ID; reserved prototype names are rejected.'
};
const sha256Schema = { ...S(64, 64), pattern: `^[0-9a-f]{64}${END}` };
const deliveryCheckSchema = {
  ...O({
    subjectSha256: sha256Schema,
    requiredCheckIds: A(checkIdSchema, MAX_CHECKS, 1),
    receipts: A(O({
      checkId: checkIdSchema,
      subjectSha256: sha256Schema,
      receiptSha256: sha256Schema,
      outcome: E('pass', 'fail', 'not-run')
    }), MAX_CHECKS)
  }),
  description: 'Supplied checklist and declared receipts only. Check IDs are unique in each list; every receipt must reference a required check. Receipt digests are format-only.'
};

export const engineeringDeliverySchemas = Object.freeze({ 'engineering.delivery-check': deliveryCheckSchema });

// Direct callers may pass JS values, not just parsed JSON. Avoid invoking
// callbacks and reporting caller-controlled property names before validation.
function dataProperty(schema, value, key, path) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
    fail('E_SCHEMA', '需要可枚举的数据项 / Expected enumerable data entry', path);
  }
  plainJSON(schema, descriptor.value, path);
}

function plainJSON(schema, value, path = '$') {
  if (types.isProxy(value)) fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  if (value === null || typeof value !== 'object') return;
  const array = Array.isArray(value);
  if (schema.type !== (array ? 'array' : 'object')) fail('E_SCHEMA', '容器类型不符 / Unexpected container type', path);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  }
  if (array) {
    const length = value.length;
    if (length < schema.minItems || length > schema.maxItems) fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
    if (Reflect.ownKeys(value).length !== length + 1) fail('E_SCHEMA', '需要无额外属性的稠密数组 / Expected dense array without extra properties', path);
    for (let i = 0; i < length; i++) dataProperty(schema.items, value, i, `${path}[${i}]`);
    return;
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !Object.hasOwn(schema.properties, key)) fail('E_SCHEMA', '未知或非法字段 / Unknown or invalid field', path);
    dataProperty(schema.properties[key], value, key, `${path}.${key}`);
  }
}

function deliveryCheck(input) {
  plainJSON(deliveryCheckSchema, input);
  validate(deliveryCheckSchema, input);

  const required = new Set();
  for (const [i, checkId] of input.requiredCheckIds.entries()) {
    if (required.has(checkId)) fail('E_DUPLICATE', '重复必需检查ID / Duplicate required check ID', `$.requiredCheckIds[${i}]`);
    required.add(checkId);
  }
  const receipts = new Map();
  for (const [i, receipt] of input.receipts.entries()) {
    if (!required.has(receipt.checkId)) fail('E_REFERENCE', '回执引用未声明检查 / Receipt references undeclared check', `$.receipts[${i}].checkId`);
    if (receipts.has(receipt.checkId)) fail('E_DUPLICATE', '重复检查回执 / Duplicate receipt for check', `$.receipts[${i}].checkId`);
    receipts.set(receipt.checkId, receipt);
  }

  const blockerCounts = { MISSING_RECEIPT: 0, SUBJECT_MISMATCH: 0, DECLARED_FAIL: 0, DECLARED_NOT_RUN: 0 };
  let totalBlockers = 0;
  const results = input.requiredCheckIds.map((checkId, requiredIndex) => {
    const receipt = receipts.get(checkId);
    let blockerCode = null;
    if (!receipt) blockerCode = 'MISSING_RECEIPT';
    // A receipt for a different candidate cannot declare this one's outcome.
    else if (receipt.subjectSha256 !== input.subjectSha256) blockerCode = 'SUBJECT_MISMATCH';
    else if (receipt.outcome === 'fail') blockerCode = 'DECLARED_FAIL';
    else if (receipt.outcome === 'not-run') blockerCode = 'DECLARED_NOT_RUN';

    if (blockerCode !== null) {
      totalBlockers++;
      blockerCounts[blockerCode]++;
    }
    // The caller can correlate by zero-based index without exposing input values.
    return { requiredIndex, status: blockerCode === null ? 'declared-pass' : 'blocked', blockerCode };
  });
  return {
    scope: 'supplied-only',
    allRequiredDeclaredPass: totalBlockers === 0,
    requiredCount: required.size,
    receiptCount: receipts.size,
    declaredPassCount: required.size - totalBlockers,
    totalBlockers,
    blockerCounts,
    results,
    filesRead: false,
    signaturesVerified: false,
    checksExecuted: false,
    deploymentPerformed: false,
    limitation: '仅核对供给声明；回执摘要仅校验格式，不证明清单完整、文件存在或回执真实。未读盘、验签、运行检查或部署 / Supplied declarations only; receipt digest format only, no proof of checklist completeness, file existence or receipt authenticity. No disk reads, signature verification, check execution or deployment.'
  };
}

export const engineeringDeliveryImplementations = Object.freeze({ 'engineering.delivery-check': deliveryCheck });
