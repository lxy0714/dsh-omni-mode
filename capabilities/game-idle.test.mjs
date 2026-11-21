import test from 'node:test';
import assert from 'node:assert/strict';
import { gameSchemas, gameImplementations } from './game-idle.mjs';
import { CapabilityError, validate } from './schema.mjs';

// Deliberately independent of operations.mjs and the Lead-owned registry.
const run = (id, input) => { validate(gameSchemas[id], input); return gameImplementations[id](input); };
const offline = patch => ({ elapsedSeconds: 12, maxOfflineSeconds: 10, efficiency: { numerator: '2', denominator: '5' }, rounding: 'half-up', resources: [{ id: 'gold', ratePerSecond: { numerator: '7', denominator: '3' }, rewardCap: '8' }], ...patch });
const growth = patch => ({ base: '3', multiplier: { numerator: '3', denominator: '2' }, levels: [0, 1, 2, 3], rounding: 'floor', ...patch });
const reject = (fn, code, path) => assert.throws(fn, error => error instanceof CapabilityError && error.code === code && (!path || error.path === path));
const ratio = (numerator, denominator = '1') => ({ numerator, denominator });
const modes = ['floor', 'ceil', 'half-up', 'half-even'];
const amounts = input => run('game.growth', input).values.map(value => value.amount);

test('exports exactly the two operations with recursively closed, bounded schemas', () => {
  assert.deepEqual(Object.keys(gameSchemas), ['game.offline', 'game.growth']);
  assert.deepEqual(Object.keys(gameImplementations), Object.keys(gameSchemas));
  const check = schema => {
    if (schema.type === 'object') { assert.equal(schema.additionalProperties, false); for (const value of Object.values(schema.properties)) check(value); }
    if (schema.type === 'array') { assert.ok(Number.isSafeInteger(schema.maxItems)); check(schema.items); }
    if (schema.type === 'string' && !schema.enum) assert.ok(schema.maxLength > 0);
    if (schema.type === 'integer') assert.ok(Number.isSafeInteger(schema.maximum));
  };
  Object.values(gameSchemas).forEach(check);
});

test('offline hand calculation: cap seconds, exact 28/3, round once, then cap reward', () => {
  const result = run('game.offline', offline());
  assert.equal(result.creditedSeconds, 10);
  assert.equal(result.discardedSeconds, 2);
  assert.deepEqual(result.resources, [{ id: 'gold', exactAmount: ratio('28', '3'), roundedAmount: '9', awardedAmount: '8', rewardCap: '8', capped: true }]);
  assert.match(result.model, /awardedAmount=min\(roundedAmount,rewardCap\)/);
});

test('offline time cap boundary includes 0, below, equal and above', () => {
  for (const [elapsedSeconds, maxOfflineSeconds, credited, discarded] of [[0, 0, 0, 0], [0, 3, 0, 0], [2, 3, 2, 0], [3, 3, 3, 0], [4, 3, 3, 1], [4, 0, 0, 4]]) {
    const result = run('game.offline', offline({ elapsedSeconds, maxOfflineSeconds }));
    assert.equal(result.creditedSeconds, credited); assert.equal(result.discardedSeconds, discarded);
    if (!credited) { assert.deepEqual(result.resources[0].exactAmount, ratio('0')); assert.equal(result.resources[0].awardedAmount, '0'); }
  }
});

test('offline resource cap is post-rounding, exact equality is not a clipped award', () => {
  const resource = { id: 'r', ratePerSecond: ratio('5', '2'), rewardCap: '2' };
  for (const [rounding, expected, capped] of [['floor', '2', false], ['ceil', '3', true], ['half-up', '3', true], ['half-even', '2', false]]) {
    const result = run('game.offline', offline({ elapsedSeconds: 1, maxOfflineSeconds: 1, efficiency: ratio('1'), rounding, resources: [resource] })).resources[0];
    assert.equal(result.roundedAmount, expected); assert.equal(result.awardedAmount, '2'); assert.equal(result.capped, capped);
  }
  const zeroCap = run('game.offline', offline({ resources: [{ ...resource, rewardCap: '0' }] })).resources[0];
  assert.equal(zeroCap.awardedAmount, '0'); assert.equal(zeroCap.capped, true);
});

test('offline combines time/rate/efficiency before one per-resource rounding, not per second or pooled', () => {
  const resource = { id: 'r', ratePerSecond: ratio('1', '3'), rewardCap: '100' };
  assert.equal(run('game.offline', offline({ elapsedSeconds: 3, maxOfflineSeconds: 3, efficiency: ratio('1'), rounding: 'floor', resources: [resource] })).resources[0].awardedAmount, '1');
  const resources = [0, 1, 2].map(index => ({ ...resource, id: `r${index}` }));
  assert.deepEqual(run('game.offline', offline({ elapsedSeconds: 1, maxOfflineSeconds: 1, efficiency: ratio('1'), rounding: 'floor', resources })).resources.map(value => value.awardedAmount), ['0', '0', '0']);
  const result = run('game.offline', offline({ elapsedSeconds: 2, maxOfflineSeconds: 2, efficiency: ratio('3', '4'), rounding: 'half-even', resources: [{ ...resource, ratePerSecond: ratio('5', '3') }] })).resources[0];
  assert.deepEqual(result.exactAmount, ratio('5', '2')); assert.equal(result.roundedAmount, '2');
});

test('zero rates/efficiency and explicit efficiency greater than one are exact, never clamped', () => {
  const resources = [{ id: 'z', ratePerSecond: ratio('0', '7'), rewardCap: '10' }, { id: 'p', ratePerSecond: ratio('1'), rewardCap: '100' }];
  const result = run('game.offline', offline({ elapsedSeconds: 3, maxOfflineSeconds: 3, efficiency: ratio('3', '2'), rounding: 'floor', resources }));
  assert.deepEqual(result.resources.map(value => value.exactAmount), [ratio('0'), ratio('9', '2')]);
  assert.deepEqual(run('game.offline', offline({ efficiency: ratio('0'), resources })).resources.map(value => value.awardedAmount), ['0', '0']);
});

test('offline integers above 2^53 retain every digit without Number conversion', () => {
  const result = run('game.offline', offline({ elapsedSeconds: 3600, maxOfflineSeconds: 60, efficiency: ratio('3', '2'), resources: [{ id: 'gold', ratePerSecond: ratio('9007199254740993', '10'), rewardCap: '1000000000000000000' }] }));
  assert.deepEqual(result.resources[0].exactAmount, ratio('81064793292668937'));
  assert.equal(result.resources[0].roundedAmount, '81064793292668937');
  assert.equal(result.resources[0].awardedAmount, '81064793292668937');
  assert.equal(run('game.offline', offline({ elapsedSeconds: Number.MAX_SAFE_INTEGER, maxOfflineSeconds: Number.MAX_SAFE_INTEGER, efficiency: ratio('1'), resources: [{ id: 'r', ratePerSecond: ratio('9007199254740993'), rewardCap: '999999999999999999999999999999999999' }] })).resources[0].roundedAmount, '81129638414606681695789005144063');
});

test('growth is base*(p/q)^level with independent rounding, not a rounded recurrence', () => {
  const result = run('game.growth', growth());
  assert.deepEqual(result.values, [
    { level: 0, exactAmount: ratio('3'), amount: '3' },
    { level: 1, exactAmount: ratio('9', '2'), amount: '4' },
    { level: 2, exactAmount: ratio('27', '4'), amount: '6' },
    { level: 3, exactAmount: ratio('81', '8'), amount: '10' }
  ]);
  // Repeated floor would give 3 -> 4 -> 6 -> 9, not 10.
  assert.match(result.model, /independently/);
});

test('growth preserves unsorted and repeated requested levels without sorting input', () => {
  const levels = [3, 0, 2, 1, 3];
  const result = run('game.growth', growth({ levels }));
  assert.deepEqual(result.values.map(value => value.level), levels);
  assert.deepEqual(result.values.map(value => value.amount), ['10', '3', '6', '4', '10']);
});

test('all four rounding policies cover exact, below/above half and ties to even', () => {
  for (const [base, denominator, expected] of [['5', '2', ['2', '3', '3', '2']], ['7', '2', ['3', '4', '4', '4']], ['1', '2', ['0', '1', '1', '0']], ['1', '3', ['0', '1', '0', '0']], ['2', '3', ['0', '1', '1', '1']], ['8', '2', ['4', '4', '4', '4']]]) {
    modes.forEach((rounding, index) => assert.deepEqual(amounts(growth({ base, multiplier: ratio('1', denominator), levels: [1], rounding })), [expected[index]]));
  }
});

test('growth multiplier one/zero/shrinking and base zero have explicit level-zero behavior', () => {
  assert.deepEqual(amounts(growth({ base: '17', multiplier: ratio('123', '123'), levels: [10000, 0, 1] })), ['17', '17', '17']);
  assert.deepEqual(amounts(growth({ base: '17', multiplier: ratio('0', '7') })), ['17', '0', '0', '0']);
  assert.deepEqual(amounts(growth({ base: '0', multiplier: ratio('9'), levels: [0, 10000] })), ['0', '0']);
  assert.deepEqual(amounts(growth({ base: '100', multiplier: ratio('1', '2'), levels: [0, 1, 2, 3, 10] })), ['100', '50', '25', '12', '0']);
  assert.deepEqual(run('game.growth', growth({ base: '6', multiplier: ratio('2', '4'), levels: [2] })).values[0].exactAmount, ratio('3', '2'));
});

test('growth has exact large base, rational denominator and tie parity beyond safe integer', () => {
  const result = run('game.growth', growth({ base: '9007199254740993', multiplier: ratio('3', '2'), levels: [2] }));
  assert.deepEqual(result.values[0], { level: 2, exactAmount: ratio('81064793292668937', '4'), amount: '20266198323167234' });
  assert.deepEqual(amounts(growth({ base: '18014398509481989', multiplier: ratio('1', '2'), levels: [1], rounding: 'half-even' })), ['9007199254740994']);
  assert.deepEqual(amounts(growth({ base: '18014398509481991', multiplier: ratio('1', '2'), levels: [1], rounding: 'half-even' })), ['9007199254740996']);
});

test('small exhaustive-style oracle uses direct integer powers, not the production power routine', () => {
  for (let base = 0; base <= 7; base++) for (let numerator = 0; numerator <= 5; numerator++) for (let denominator = 1; denominator <= 5; denominator++) {
    const levels = [4, 0, 3, 1, 2];
    for (const rounding of modes) {
      const result = run('game.growth', growth({ base: String(base), multiplier: ratio(String(numerator), String(denominator)), levels, rounding }));
      result.values.forEach((value, index) => {
        const n = BigInt(base) * BigInt(numerator) ** BigInt(levels[index]), d = BigInt(denominator) ** BigInt(levels[index]);
        let expected = n / d;
        const rem = n % d;
        if (rounding === 'ceil' && rem) expected++;
        if (rounding === 'half-up' && rem * 2n >= d) expected++;
        if (rounding === 'half-even' && (rem * 2n > d || (rem * 2n === d && expected % 2n === 1n))) expected++;
        assert.equal(value.amount, expected.toString());
        assert.equal(BigInt(value.exactAmount.numerator) * d, n * BigInt(value.exactAmount.denominator));
      });
    }
  }
});

test('negative/noninteger/unsafe/nonfinite times and levels are schema errors', () => {
  for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity, -Infinity, NaN, '1', null]) {
    for (const field of ['elapsedSeconds', 'maxOfflineSeconds']) reject(() => run('game.offline', offline({ [field]: value })), 'E_SCHEMA', `$.${field}`);
    reject(() => run('game.growth', growth({ levels: [value] })), 'E_SCHEMA', '$.levels[0]');
  }
  reject(() => run('game.growth', growth({ levels: [10001] })), 'E_SCHEMA');
});

test('integer strings reject coercion, signs, whitespace/newlines, exponent/decimal/hex and noncanonical forms', () => {
  for (const value of ['', '00', '01', '-1', '+1', '1.0', '1e3', '0x10', ' 1', '1 ', '1\n', '\n1', '１', '1_000', 'Infinity', 'NaN', '__proto__', 'constructor', 1, 1n, null]) {
    const code = value === '' ? 'E_LIMIT' : 'E_SCHEMA';
    reject(() => run('game.growth', growth({ base: value })), code);
    reject(() => run('game.growth', growth({ multiplier: ratio(value) })), code);
    reject(() => run('game.offline', offline({ efficiency: ratio(value) })), code);
    reject(() => run('game.offline', offline({ resources: [{ id: 'r', ratePerSecond: ratio(value), rewardCap: '1' }] })), code);
    reject(() => run('game.offline', offline({ resources: [{ id: 'r', ratePerSecond: ratio('1'), rewardCap: value }] })), code);
  }
});

test('zero denominator is a structured rejection in every rational position', () => {
  for (const denominator of ['0', '00', '-1', '1\n', 0]) {
    reject(() => run('game.growth', growth({ multiplier: ratio('1', denominator) })), 'E_SCHEMA');
    reject(() => run('game.offline', offline({ efficiency: ratio('1', denominator) })), 'E_SCHEMA');
    reject(() => run('game.offline', offline({ resources: [{ id: 'r', ratePerSecond: ratio('1', denominator), rewardCap: '1' }] })), 'E_SCHEMA');
  }
});

test('missing policy, unknown fields and reserved object keys fail closed at all object depths', () => {
  for (const [id, input] of [['game.offline', offline()], ['game.growth', growth()]]) {
    for (const key of Object.keys(input)) { const missing = structuredClone(input); delete missing[key]; reject(() => run(id, missing), 'E_SCHEMA'); }
    reject(() => run(id, { ...input, execute: 'return process.env' }), 'E_SCHEMA');
    reject(() => run(id, { ...input, rounding: 'nearest' }), 'E_SCHEMA');
    for (const key of ['__proto__', 'prototype', 'constructor']) {
      const malicious = JSON.parse(`{"${key}":{}}`);
      reject(() => run(id, { ...input, ...malicious }), 'E_SCHEMA');
      const nested = structuredClone(input);
      // JSON.parse + object spread retain __proto__ as own JSON data.
      if (id === 'game.offline') nested.efficiency = { ...input.efficiency, ...malicious };
      else nested.multiplier = { ...input.multiplier, ...malicious };
      reject(() => run(id, nested), 'E_SCHEMA');
    }
  }
  reject(() => run('game.offline', offline({ efficiency: { ...ratio('1'), extra: true } })), 'E_SCHEMA');
  reject(() => run('game.offline', offline({ resources: [{ id: 'r', ratePerSecond: { ...ratio('1'), extra: true }, rewardCap: '1' }] })), 'E_SCHEMA');
  reject(() => run('game.offline', offline({ resources: [{ id: 'r', ratePerSecond: ratio('1'), rewardCap: '1', extra: true }] })), 'E_SCHEMA');
});

test('resource IDs are unique; objects use no ID-keyed prototype-sensitive storage', () => {
  const resource = { id: 'r', ratePerSecond: ratio('1'), rewardCap: '1' };
  reject(() => run('game.offline', offline({ resources: [resource, resource] })), 'E_DUPLICATE');
  assert.equal(run('game.offline', offline({ resources: [{ ...resource, id: '__proto__' }] })).resources[0].id, '__proto__');
  reject(() => run('game.offline', offline({ resources: [{ ...resource, id: '' }] })), 'E_LIMIT');
  reject(() => run('game.offline', offline({ resources: [{ ...resource, id: 'r'.repeat(65) }] })), 'E_LIMIT');
});

test('input strings and collection lengths accept their bounds and reject the next value', () => {
  const max = '9'.repeat(128);
  assert.deepEqual(amounts(growth({ base: max, multiplier: ratio(max, max), levels: [10000] })), [max]);
  reject(() => run('game.growth', growth({ base: '9'.repeat(129) })), 'E_LIMIT');
  reject(() => run('game.growth', growth({ multiplier: ratio('1', '9'.repeat(129)) })), 'E_LIMIT');
  assert.equal(run('game.growth', growth({ levels: Array(128).fill(0) })).values.length, 128);
  reject(() => run('game.growth', growth({ levels: Array(129).fill(0) })), 'E_LIMIT');
  reject(() => run('game.growth', growth({ levels: [] })), 'E_LIMIT');
  const resources = Array.from({ length: 100 }, (_, index) => ({ id: `r${index}`, ratePerSecond: ratio(max, max), rewardCap: max }));
  assert.equal(run('game.offline', offline({ resources })).resources.length, 100);
  reject(() => run('game.offline', offline({ resources: [...resources, { ...resources[0], id: 'extra' }] })), 'E_LIMIT');
  reject(() => run('game.offline', offline({ resources: [] })), 'E_LIMIT');
});

test('4096-digit intermediate boundary is exact; overbound numerator/denominator rejects, never approximates', () => {
  const positive = run('game.growth', growth({ base: '1', multiplier: ratio('10'), levels: [4095] })).values[0];
  assert.equal(positive.amount, '1' + '0'.repeat(4095));
  assert.equal(positive.exactAmount.denominator, '1');
  const shrinking = run('game.growth', growth({ base: '1', multiplier: ratio('1', '10'), levels: [4095] })).values[0];
  assert.equal(shrinking.exactAmount.denominator, '1' + '0'.repeat(4095));
  assert.equal(shrinking.amount, '0');
  reject(() => run('game.growth', growth({ base: '1', multiplier: ratio('10'), levels: [4096] })), 'E_LIMIT', '$.levels[0]');
  reject(() => run('game.growth', growth({ base: '1', multiplier: ratio('1', '10'), levels: [4096] })), 'E_LIMIT', '$.levels[0]');
  // Do not return a floor of zero if its exact rational exceeds the work limit.
  reject(() => run('game.growth', growth({ base: '1', multiplier: ratio('1', '9'.repeat(128)), levels: [10000] })), 'E_LIMIT');
});

test('aggregate output digits and multiplication work have separate structured hard limits', () => {
  assert.throws(() => run('game.growth', growth({ base: '1', multiplier: ratio('10'), levels: Array(80).fill(1000) })), error => error instanceof CapabilityError && error.code === 'E_LIMIT' && /Aggregate numeric output/.test(error.message));
  assert.throws(() => run('game.growth', growth({ base: '1', multiplier: ratio('1' + '0'.repeat(127), '9'.repeat(127)), levels: Array(20).fill(32) })), error => error instanceof CapabilityError && error.code === 'E_LIMIT' && /work budget/.test(error.message));
});

test('aggregate 131072-digit output boundary counts echoed base/multiplier, then rejects the next row', () => {
  // Header: 4 digits; 31*(2048+1+2048) + (2030+1+2030) = 131068.
  const input = growth({ base: '1', multiplier: ratio('10'), levels: [...Array(31).fill(2047), 2029] });
  const result = run('game.growth', input);
  const digitCount = value => typeof value === 'string' ? (/^[0-9]+$/.test(value) ? value.length : 0) : value && typeof value === 'object' ? Object.values(value).reduce((sum, child) => sum + digitCount(child), 0) : 0;
  assert.equal(digitCount(result), 131072);
  assert.ok(JSON.stringify(result).length < 200000);
  reject(() => run('game.growth', { ...input, levels: [...input.levels, 0] }), 'E_LIMIT');
});

test('input is unchanged/frozen-safe, outputs deterministic and JSON contains no BigInt or nonfinite value', () => {
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  for (const [id, input] of [['game.offline', offline()], ['game.growth', growth({ levels: [3, 0, 2] })]]) {
    const before = JSON.stringify(input); freeze(input);
    const first = run(id, input), second = run(id, input);
    assert.equal(JSON.stringify(input), before); assert.deepEqual(first, second);
    const encoded = JSON.stringify(first);
    assert.deepEqual(JSON.parse(encoded), first);
    const check = value => {
      assert.notEqual(typeof value, 'bigint');
      if (typeof value === 'number') assert.ok(Number.isSafeInteger(value));
      if (value && typeof value === 'object') Object.values(value).forEach(check);
    };
    check(first); assert.ok(encoded.length < 2 * 1024 * 1024);
  }
});
