import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { engineeringDeliverySchemas, engineeringDeliveryImplementations } from './engineering-delivery.mjs';

const id = 'engineering.delivery-check';
const schema = engineeringDeliverySchemas[id];
const execute = engineeringDeliveryImplementations[id];
// Test the shared input contract and the module without central registration.
const run = input => execute(validate(schema, input));
const subject = 'a'.repeat(64);
const otherSubject = 'b'.repeat(64);
const receiptDigest = 'c'.repeat(64);
const receipt = (checkId, outcome = 'pass', subjectSha256 = subject, receiptSha256 = receiptDigest) =>
  ({ checkId, subjectSha256, receiptSha256, outcome });
const manifest = (requiredCheckIds = ['build'], receipts = [receipt('build')]) => ({ subjectSha256: subject, requiredCheckIds, receipts });

function expectError(action, code, path, hidden = []) {
  assert.throws(action, error => {
    assert.equal(error.name, 'CapabilityError');
    assert.equal(error.code, code);
    if (path !== undefined) assert.equal(error.path, path);
    assert.match(error.message, /\p{Script=Han}.* \/ [A-Z]/u);
    assert.ok(error.message.length < 100);
    for (const value of hidden) assert.ok(!`${error.message} ${error.path}`.includes(value));
    return true;
  });
}

function invalidSchema(input, code, path) {
  expectError(() => validate(schema, input), code, path);
  expectError(() => execute(input), code, path);
}

test('exports one operation with a closed bounded schema at every level', () => {
  assert.deepEqual(Object.keys(engineeringDeliverySchemas), [id]);
  assert.deepEqual(Object.keys(engineeringDeliveryImplementations), [id]);
  assert.equal(typeof execute, 'function');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ['subjectSha256', 'requiredCheckIds', 'receipts']);
  const { subjectSha256, requiredCheckIds, receipts } = schema.properties;
  assert.equal(subjectSha256.minLength, 64);
  assert.equal(subjectSha256.maxLength, 64);
  assert.equal(requiredCheckIds.minItems, 1);
  assert.equal(requiredCheckIds.maxItems, 500);
  assert.equal(requiredCheckIds.items.maxLength, 100);
  assert.equal(receipts.minItems, 0);
  assert.equal(receipts.maxItems, 500);
  assert.equal(receipts.items.additionalProperties, false);
  assert.deepEqual(receipts.items.required, ['checkId', 'subjectSha256', 'receiptSha256', 'outcome']);
  assert.deepEqual(receipts.items.properties.outcome.enum, ['pass', 'fail', 'not-run']);
});

test('matching declared passes are supplied-only, not runs or proof of artifacts', () => {
  const zero = '0'.repeat(64);
  // Syntactically valid hashes are accepted as labels, including the same
  // receipt hash on different checks. This does not establish file existence.
  const input = Object.freeze({
    subjectSha256: zero,
    requiredCheckIds: Object.freeze(['Build.A_0:v-1', 'build.A_0:v-1']),
    receipts: Object.freeze(['build.A_0:v-1', 'Build.A_0:v-1'].map(check => Object.freeze(receipt(check, 'pass', zero, zero))))
  });
  const { limitation, ...result } = run(input);
  assert.deepEqual(result, {
    scope: 'supplied-only', allRequiredDeclaredPass: true,
    requiredCount: 2, receiptCount: 2, declaredPassCount: 2, totalBlockers: 0,
    blockerCounts: { MISSING_RECEIPT: 0, SUBJECT_MISMATCH: 0, DECLARED_FAIL: 0, DECLARED_NOT_RUN: 0 },
    results: [
      { requiredIndex: 0, status: 'declared-pass', blockerCode: null },
      { requiredIndex: 1, status: 'declared-pass', blockerCode: null }
    ],
    filesRead: false, signaturesVerified: false, checksExecuted: false, deploymentPerformed: false
  });
  assert.match(limitation, /receipt digest format only, no proof of checklist completeness, file existence or receipt authenticity/);
  assert.match(limitation, /No disk reads, signature verification, check execution or deployment/);
});

test('reports one exact blocker per check in required order, independent of receipt order', () => {
  const input = manifest(
    ['z-fail', 'a-missing', 'm-wrong-fail', 'a-wait', 'm-pass', 'b-wrong-pass', 'n-wrong-not-run'],
    [receipt('a-wait', 'not-run'), receipt('n-wrong-not-run', 'not-run', otherSubject), receipt('m-pass'),
      receipt('z-fail', 'fail'), receipt('b-wrong-pass', 'pass', otherSubject), receipt('m-wrong-fail', 'fail', otherSubject)]
  );
  const result = run(input);
  assert.equal(result.allRequiredDeclaredPass, false);
  assert.equal(result.requiredCount, 7);
  assert.equal(result.receiptCount, 6);
  assert.equal(result.declaredPassCount, 1);
  assert.equal(result.totalBlockers, 6);
  assert.deepEqual(result.blockerCounts, { MISSING_RECEIPT: 1, SUBJECT_MISMATCH: 3, DECLARED_FAIL: 1, DECLARED_NOT_RUN: 1 });
  assert.deepEqual(result.results, [
    { requiredIndex: 0, status: 'blocked', blockerCode: 'DECLARED_FAIL' },
    { requiredIndex: 1, status: 'blocked', blockerCode: 'MISSING_RECEIPT' },
    { requiredIndex: 2, status: 'blocked', blockerCode: 'SUBJECT_MISMATCH' },
    { requiredIndex: 3, status: 'blocked', blockerCode: 'DECLARED_NOT_RUN' },
    { requiredIndex: 4, status: 'declared-pass', blockerCode: null },
    { requiredIndex: 5, status: 'blocked', blockerCode: 'SUBJECT_MISMATCH' },
    { requiredIndex: 6, status: 'blocked', blockerCode: 'SUBJECT_MISMATCH' }
  ]);
  assert.deepEqual(run({ ...input, receipts: [...input.receipts].reverse() }), result);
});

test('accepts zero receipts and reports the entire required list up to the cap', () => {
  const ids = Array.from({ length: 500 }, (_, i) => `check-${i}`);
  ids[0] = '9'.repeat(100);
  const one = run(manifest(['x'], []));
  assert.deepEqual(one.results, [{ requiredIndex: 0, status: 'blocked', blockerCode: 'MISSING_RECEIPT' }]);
  assert.equal(one.receiptCount, 0);
  const missing = run(manifest(ids, []));
  assert.equal(missing.totalBlockers, 500);
  assert.equal(missing.blockerCounts.MISSING_RECEIPT, 500);
  assert.equal(missing.declaredPassCount, 0);
  assert.deepEqual(missing.results.map(row => row.requiredIndex), ids.map((_, i) => i));
  assert.ok(missing.results.every(row => row.blockerCode === 'MISSING_RECEIPT'));
  const complete = run(manifest(ids, ids.map(check => receipt(check))));
  assert.equal(complete.receiptCount, 500);
  assert.equal(complete.declaredPassCount, 500);
  assert.equal(complete.totalBlockers, 0);
  assert.equal(complete.results.length, 500);
});

test('rejects empty and oversized required lists, oversized receipts and oversized IDs', () => {
  invalidSchema(manifest([], []), 'E_LIMIT', '$.requiredCheckIds');
  invalidSchema(manifest(Array(501).fill('a'), []), 'E_LIMIT', '$.requiredCheckIds');
  invalidSchema(manifest(['a'], Array(501).fill(receipt('a'))), 'E_LIMIT', '$.receipts');
  invalidSchema(manifest(['x'.repeat(101)], []), 'E_LIMIT', '$.requiredCheckIds[0]');
  invalidSchema(manifest(['x'], [receipt('x'.repeat(101))]), 'E_LIMIT', '$.receipts[0].checkId');
});

test('rejects duplicate declarations, duplicate checks in receipts and undeclared references without leaking values', () => {
  const secret = 'private-check-marker';
  expectError(() => run(manifest([secret, secret], [])), 'E_DUPLICATE', '$.requiredCheckIds[1]', [secret]);
  // Different outcomes, subjects or receipt digests cannot make two receipts
  // for one check acceptable (no last-write winner or retry inference).
  expectError(() => run(manifest([secret], [receipt(secret), receipt(secret, 'fail', otherSubject, subject)])),
    'E_DUPLICATE', '$.receipts[1].checkId', [secret, subject, otherSubject, receiptDigest]);
  for (const check of [secret, 'Build', 'toString', 'hasOwnProperty']) {
    expectError(() => run(manifest(['build'], [receipt(check)])), 'E_REFERENCE', '$.receipts[0].checkId', [check]);
  }
});

test('rejects noncanonical IDs and reserved prototype names in both lists', () => {
  for (const value of ['bad/id', 'bad\\id', 'a b', ' x', 'x ', 'x\n', 'x\r', 'x\u2028', 'x\0', 'é', '.root', '__proto__', 'constructor', 'prototype']) {
    invalidSchema(manifest([value], []), 'E_SCHEMA', '$.requiredCheckIds[0]');
    invalidSchema(manifest(['build'], [receipt(value)]), 'E_SCHEMA', '$.receipts[0].checkId');
  }
  invalidSchema(manifest([''], []), 'E_LIMIT', '$.requiredCheckIds[0]');
  invalidSchema(manifest(['build'], [receipt('')]), 'E_LIMIT', '$.receipts[0].checkId');
});

test('all three digest fields enforce exact lowercase 64-hex, without normalization', () => {
  for (const [value, code] of [[subject.slice(1), 'E_LIMIT'], [subject + '\n', 'E_LIMIT'], [subject.toUpperCase(), 'E_SCHEMA'],
    [subject.slice(1) + 'g', 'E_SCHEMA'], [subject.slice(1) + '\n', 'E_SCHEMA'], [42, 'E_SCHEMA']]) {
    invalidSchema({ ...manifest(), subjectSha256: value }, code, '$.subjectSha256');
    invalidSchema(manifest(['build'], [receipt('build', 'pass', value)]), code, '$.receipts[0].subjectSha256');
    invalidSchema(manifest(['build'], [receipt('build', 'pass', subject, value)]), code, '$.receipts[0].receiptSha256');
  }
});

test('rejects missing fields, wrong types and unsupported outcomes', () => {
  for (const key of schema.required) {
    const input = manifest(); delete input[key];
    invalidSchema(input, 'E_SCHEMA', `$.${key}`);
  }
  for (const key of schema.properties.receipts.items.required) {
    const input = manifest(); delete input.receipts[0][key];
    invalidSchema(input, 'E_SCHEMA', `$.receipts[0].${key}`);
  }
  for (const value of [null, [], 12, 'not an object']) invalidSchema(value, 'E_SCHEMA', '$');
  invalidSchema({ ...manifest(), requiredCheckIds: 'build' }, 'E_SCHEMA', '$.requiredCheckIds');
  invalidSchema({ ...manifest(), receipts: {} }, 'E_SCHEMA', '$.receipts');
  invalidSchema(manifest(['build'], [null]), 'E_SCHEMA', '$.receipts[0]');
  invalidSchema(manifest([false], []), 'E_SCHEMA', '$.requiredCheckIds[0]');
  for (const outcome of ['PASS', 'skipped', 'not-run\n', false, null]) {
    invalidSchema(manifest(['build'], [receipt('build', outcome)]), 'E_SCHEMA', '$.receipts[0].outcome');
  }
});

test('shared schema rejects unknown fields; direct errors never echo unknown keys or values', () => {
  for (const key of ['https://example.invalid/private', 'note', 'path', 'timestamp', '__proto__', 'constructor', 'prototype']) {
    const secret = 'private-field-value';
    const root = { ...manifest(), [key]: secret };
    const detail = manifest(['build'], [{ ...receipt('build'), [key]: secret }]);
    for (const [input, path] of [[root, '$'], [detail, '$.receipts[0]']]) {
      expectError(() => validate(schema, input), 'E_SCHEMA');
      expectError(() => execute(input), 'E_SCHEMA', path, [key, secret]);
    }
  }
});

test('does not echo input values even when check IDs equal digests', () => {
  const secret = 'private-check-marker';
  const result = run(manifest([subject, receiptDigest, secret], [receipt(subject), receipt(receiptDigest), receipt(secret, 'fail', otherSubject)]));
  assert.deepEqual(result.results.map(row => row.blockerCode), [null, null, 'SUBJECT_MISMATCH']);
  for (const value of [subject, receiptDigest, secret, otherSubject]) assert.ok(!JSON.stringify(result).includes(value));
});

test('direct implementation rejects accessors, proxies and non-JSON shapes without calling attacker code', () => {
  let effects = 0;
  const trap = () => { effects++; throw new Error('input callback must not run'); };
  const withGetter = manifest();
  Object.defineProperty(withGetter.receipts[0], 'subjectSha256', { enumerable: true, get: trap });
  expectError(() => execute(withGetter), 'E_SCHEMA', '$.receipts[0].subjectSha256');

  const traps = { get: trap, ownKeys: trap, getPrototypeOf: trap, getOwnPropertyDescriptor: trap };
  const revoked = Proxy.revocable([], traps); revoked.revoke();
  expectError(() => execute(new Proxy(manifest(), traps)), 'E_SCHEMA', '$');
  expectError(() => execute(manifest(['build'], [new Proxy(receipt('build'), traps)])), 'E_SCHEMA', '$.receipts[0]');
  expectError(() => execute(manifest(['build'], revoked.proxy)), 'E_SCHEMA', '$.receipts');
  assert.equal(effects, 0);

  expectError(() => execute(manifest(Array(1), [])), 'E_SCHEMA', '$.requiredCheckIds');
  const extra = [receipt('build')]; extra.extra = true;
  expectError(() => execute(manifest(['build'], extra)), 'E_SCHEMA', '$.receipts');
  expectError(() => execute({ ...manifest(), [Symbol('private')]: true }), 'E_SCHEMA', '$');
  expectError(() => execute(Object.defineProperty(manifest(), 'hidden', { value: true })), 'E_SCHEMA', '$');
  expectError(() => execute(Object.assign(Object.create({ inherited: true }), manifest())), 'E_SCHEMA', '$');
  const nullPrototype = Object.assign(Object.create(null), manifest(['build'], [Object.assign(Object.create(null), receipt('build'))]));
  assert.deepEqual(run(nullPrototype), run(manifest()));
});
