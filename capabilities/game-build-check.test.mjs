import test from 'node:test';
import assert from 'node:assert/strict';
import { gameBuildImplementations, gameBuildSchemas } from './game-build-check.mjs';
import { CapabilityError, validate } from './schema.mjs';

const id = 'game.build-check';
const schema = gameBuildSchemas[id];
const check = gameBuildImplementations[id];
// Exercise the shared schema and the implementation independently of registration.
const run = input => { validate(schema, input); return check(input); };

const A = 'a1'.repeat(32), B = 'b2'.repeat(32), C = 'c3'.repeat(32);
const current = 'rev-2', previous = 'rev-1';
const build = (targetId, artifactSha256, buildId = current) => ({ targetId, buildId, artifactSha256 });
const row = (targetId, testId, artifactSha256, outcome = 'pass', buildId = current) => ({ ...build(targetId, artifactSha256, buildId), testId, outcome });
const fixture = () => ({
  buildId: current,
  targets: [{ id: 'z-device', requiredTests: ['z:boot', 'a.save'] }, { id: 'a-device', requiredTests: ['z:boot'] }],
  builds: [build('a-device', B), build('z-device', A)],
  testRuns: [row('z-device', 'a.save', A), row('a-device', 'z:boot', B.toUpperCase()), row('z-device', 'z:boot', A)]
});

function reject(input, code, path, invoke = run) {
  assert.throws(() => invoke(input), error => {
    assert.ok(error instanceof CapabilityError);
    assert.equal(error.code, code);
    if (path) assert.equal(error.path, path);
    assert.match(error.message, /\p{Script=Han}.* \/ [A-Za-z]/u);
    assert.ok(error.message.length <= 100);
    for (const digest of [A, B, C]) assert.ok(!`${error.message} ${error.path}`.toLowerCase().includes(digest));
    return true;
  });
}

test('exports only the intended operation and a closed, bounded schema', () => {
  assert.deepEqual(Object.keys(gameBuildSchemas), [id]);
  assert.deepEqual(Object.keys(gameBuildImplementations), [id]);
  assert.equal(typeof check, 'function');
  assert.deepEqual(schema.required, ['buildId', 'targets', 'builds', 'testRuns']);
  const inspect = part => {
    if (part.type === 'object') {
      assert.equal(part.additionalProperties, false);
      assert.deepEqual(part.required, Object.keys(part.properties));
      for (const property of Object.values(part.properties)) inspect(property);
    } else if (part.type === 'array') {
      assert.ok(Number.isSafeInteger(part.maxItems) && part.maxItems > 0);
      inspect(part.items);
    } else {
      assert.equal(part.type, 'string');
      assert.ok(part.enum || Number.isSafeInteger(part.maxLength));
    }
  };
  inspect(schema);
  assert.deepEqual(schema.properties.testRuns.items.properties.outcome.enum, ['pass', 'fail', 'not-run']);
});

test('matching declarations pass in target and test declaration order only', () => {
  const input = fixture(), result = run(input);
  assert.equal(result.valid, true);
  assert.equal(result.buildId, current);
  assert.deepEqual(result.targets, [
    { id: 'z-device', buildStatus: 'declared', valid: true, tests: [
      { testId: 'z:boot', status: 'pass', recordedOutcome: 'pass' },
      { testId: 'a.save', status: 'pass', recordedOutcome: 'pass' }
    ] },
    { id: 'a-device', buildStatus: 'declared', valid: true, tests: [{ testId: 'z:boot', status: 'pass', recordedOutcome: 'pass' }] }
  ]);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.issueCounts, {});
  assert.equal(result.totalIssues, 0);
  assert.equal(result.truncated, false);
  assert.equal(result.scope, 'declared-build-checklist-only');
  for (const key of ['artifactsVerified', 'buildsExecuted', 'testsExecuted']) assert.equal(result[key], false);
  assert.match(result.limitation, /no project or artifact reads.*not release approval/);
  assert.doesNotMatch(JSON.stringify(result), /artifactSha256|(?:a1|b2){32}/i);
  assert.deepEqual(run({ ...input, builds: input.builds.toReversed(), testRuns: input.testRuns.toReversed() }), result);
});

test('a missing build remains missing even when current tests claim pass', () => {
  const input = fixture();
  input.builds = input.builds.filter(value => value.targetId !== 'z-device');
  const result = run(input);
  assert.equal(result.valid, false);
  assert.equal(result.targets[0].valid, false);
  assert.equal(result.targets[0].buildStatus, 'missing-build');
  assert.deepEqual(result.targets[0].tests.map(value => [value.status, value.recordedOutcome]), [['unbound-build', 'pass'], ['unbound-build', 'pass']]);
  assert.equal(result.targets[1].valid, true);
  assert.deepEqual(result.issueCounts, { BUILD_MISSING: 1, TEST_BUILD_UNAVAILABLE: 2 });
});

test('missing target-scoped runs differ from a declared not-run and are not borrowed across targets', () => {
  const input = fixture();
  input.testRuns = [row('z-device', 'z:boot', A), row('z-device', 'a.save', A, 'not-run')];
  const result = run(input);
  assert.equal(result.valid, false);
  assert.deepEqual(result.targets.map(value => value.tests.map(value => [value.status, value.recordedOutcome])), [
    [['pass', 'pass'], ['not-run', 'not-run']], [['untested', null]]
  ]);
  assert.deepEqual(result.issues.map(({ code, path }) => [code, path]), [
    ['TEST_NOT_RUN', '$.targets[0].requiredTests[1]'], ['TEST_MISSING', '$.targets[1].requiredTests[0]']
  ]);
  assert.equal(result.targets[1].buildStatus, 'declared');
});

test('old-version-only builds and runs are distinct from missing records and cannot pass', () => {
  const input = fixture();
  input.builds[1].buildId = previous;
  input.testRuns[0].buildId = previous;
  const result = run(input);
  assert.equal(result.valid, false);
  assert.equal(result.targets[0].buildStatus, 'wrong-build');
  // A current test cannot borrow an old build; an old test is not a current run.
  assert.deepEqual(result.targets[0].tests.map(value => [value.status, value.recordedOutcome]), [['unbound-build', 'pass'], ['wrong-build', null]]);
  assert.deepEqual(result.issues.map(({ code }) => code), ['BUILD_ID_MISMATCH', 'TEST_BUILD_UNAVAILABLE', 'TEST_BUILD_ID_MISMATCH']);

  input.builds[1].buildId = current;
  const onlyTestStale = run(input);
  assert.equal(onlyTestStale.valid, false);
  assert.equal(onlyTestStale.targets[0].buildStatus, 'declared');
  assert.deepEqual(onlyTestStale.issueCounts, { TEST_BUILD_ID_MISMATCH: 1 });
});

test('history is not credited or allowed to override current records', () => {
  const input = fixture();
  input.builds.unshift(build('z-device', C, previous));
  input.testRuns.unshift(row('z-device', 'z:boot', C, 'fail', previous));
  input.testRuns.push(row('a-device', 'z:boot', B, 'not-run', previous));
  assert.deepEqual(run(input), run(fixture()));

  input.testRuns.find(value => value.targetId === 'z-device' && value.testId === 'z:boot' && value.buildId === current).outcome = 'fail';
  input.testRuns[0].outcome = 'pass';
  assert.deepEqual(run(input).issueCounts, { TEST_FAILED: 1 });
});

test('artifact mismatch, explicitly failed and explicitly not run have different statuses', () => {
  const input = fixture();
  input.testRuns = [row('a-device', 'z:boot', B, 'not-run'), row('z-device', 'a.save', A, 'fail'), row('z-device', 'z:boot', B)];
  const result = run(input);
  assert.equal(result.valid, false);
  assert.deepEqual(result.targets.map(value => value.tests.map(value => [value.status, value.recordedOutcome])), [
    [['artifact-mismatch', 'pass'], ['fail', 'fail']], [['not-run', 'not-run']]
  ]);
  assert.deepEqual(result.issues.map(({ code, path }) => [code, path]), [
    ['TEST_ARTIFACT_MISMATCH', '$.targets[0].requiredTests[0]'],
    ['TEST_FAILED', '$.targets[0].requiredTests[1]'],
    ['TEST_NOT_RUN', '$.targets[1].requiredTests[0]']
  ]);
  const reversed = run({ ...input, builds: input.builds.toReversed(), testRuns: input.testRuns.toReversed() });
  assert.equal(JSON.stringify(reversed), JSON.stringify(result));
  for (const digest of [A, B]) assert.ok(!JSON.stringify(result).toLowerCase().includes(digest));

  input.testRuns[2].outcome = 'fail';
  const badRun = run(input);
  assert.deepEqual(badRun.targets[0].tests[0], { testId: 'z:boot', status: 'artifact-mismatch', recordedOutcome: 'fail' });
  assert.equal(badRun.issueCounts.TEST_FAILED, 1); // Only the failure bound to the current artifact.
});

test('empty evidence is reported; an empty target set or empty per-target checklist is rejected', () => {
  const input = { ...fixture(), builds: [], testRuns: [] };
  const result = run(input);
  assert.equal(result.valid, false);
  assert.equal(result.totalIssues, 5);
  assert.deepEqual(result.issueCounts, { BUILD_MISSING: 2, TEST_MISSING: 3 });
  assert.ok(result.targets.every(value => value.buildStatus === 'missing-build' && value.tests.every(item => item.status === 'untested')));
  reject({ ...input, targets: [] }, 'E_LIMIT', '$.targets');
  reject({ ...input, targets: [{ id: 'z-device', requiredTests: [] }] }, 'E_LIMIT', '$.targets[0].requiredTests');
});

test('duplicate target, required test, build and run keys are rejected, not resolved by evidence order', () => {
  let input = fixture();
  input.targets.push({ id: 'z-device', requiredTests: ['different'] });
  reject(input, 'E_DUPLICATE', '$.targets[2].id');
  input = fixture();
  input.targets[0].requiredTests.push('z:boot');
  reject(input, 'E_DUPLICATE', '$.targets[0].requiredTests[2]');
  input = fixture();
  input.builds.push(build('z-device', C));
  reject(input, 'E_DUPLICATE', '$.builds[2]');
  input = fixture();
  input.testRuns.push(row('z-device', 'a.save', C, 'fail'));
  reject(input, 'E_DUPLICATE', '$.testRuns[3]');
  input = fixture();
  input.testRuns.push(row('z-device', 'a.save', A, 'not-run', previous), row('z-device', 'a.save', A, 'pass', previous));
  reject(input, 'E_DUPLICATE', '$.testRuns[4]');
});

test('legal punctuation, case-sensitive IDs and reused test names do not collide as composite keys', () => {
  const input = {
    buildId: 'b:c',
    targets: [{ id: 'a', requiredTests: ['d:x', 'd', 'D', 'x'] }, { id: 'a:b', requiredTests: ['d:x'] }],
    builds: [build('a', A, 'b:c'), build('a:b', B, 'b:c'), build('a:b', C, 'c')],
    testRuns: [row('a', 'd:x', A, 'pass', 'b:c'), row('a:b', 'd:x', B, 'pass', 'b:c'), row('a:b', 'd:x', C, 'fail', 'c'),
      row('a', 'd', A, 'pass', 'b:c'), row('a', 'D', A, 'pass', 'b:c'), row('a', 'd', C, 'fail', 'x:b:c'), row('a', 'x', C, 'fail', 'b:c:d')]
  };
  // a+b:c and a:b+c collide if string-concatenated; run tuples do too,
  // e.g. a+b:c+d:x vs a+b:c:d+x (target+build+test).
  const result = run(input);
  assert.deepEqual(result.targets.map(value => value.tests.map(value => value.status)), [['pass', 'pass', 'pass', 'wrong-build'], ['pass']]);
  assert.deepEqual(result.issueCounts, { TEST_BUILD_ID_MISMATCH: 1 });
});

test('undeclared targets and per-target tests are rejected, including on old records', () => {
  for (const targetId of ['unknown', 'A-device', 'toString']) {
    let input = fixture();
    input.builds.push(build(targetId, C, previous));
    reject(input, 'E_REFERENCE', '$.builds[2].targetId');
    input = fixture();
    input.testRuns.push(row(targetId, 'a.save', C));
    reject(input, 'E_REFERENCE', '$.testRuns[3].targetId');
  }
  for (const testId of ['a.save', 'Z:boot', 'toString']) {
    const input = fixture();
    input.testRuns.push(row('a-device', testId, C, 'pass', previous));
    reject(input, 'E_REFERENCE', '$.testRuns[3].testId');
  }
});

test('unknown and missing fields, invalid field types and unknown outcomes fail the closed schema', () => {
  for (const key of schema.required) {
    const input = fixture(); delete input[key];
    reject(input, 'E_SCHEMA', `$.${key}`);
  }
  reject({ ...fixture(), platformPolicy: 'anything' }, 'E_SCHEMA', '$');
  let input = fixture(); input.targets[0].label = 'extra';
  reject(input, 'E_SCHEMA', '$.targets[0]');
  input = fixture(); delete input.builds[0].artifactSha256;
  reject(input, 'E_SCHEMA', '$.builds[0].artifactSha256');
  input = fixture(); input.testRuns[0].note = 'extra';
  reject(input, 'E_SCHEMA', '$.testRuns[0]');
  input = fixture(); input.builds[0] = JSON.parse(`{"targetId":"a-device","buildId":"${current}","artifactSha256":"${B}","__proto__":{}}`);
  reject(input, 'E_SCHEMA', '$.builds[0]');
  input = fixture(); input.builds[0][B] = true;
  reject(input, 'E_SCHEMA', '$.builds[0]');
  reject({ ...fixture(), builds: {} }, 'E_SCHEMA', '$.builds');
  reject({ ...fixture(), testRuns: [null] }, 'E_SCHEMA', '$.testRuns[0]');
  for (const outcome of ['PASS', 'skipped', '', false, null]) {
    input = fixture(); input.testRuns[0].outcome = outcome;
    reject(input, 'E_SCHEMA', '$.testRuns[0].outcome');
  }
});

test('ID and SHA-256 syntax is exact, with no whitespace trimming or string coercion', () => {
  for (const value of [' leading', 'bad/id', '中文', '_leading', 'trailing\n', 'trailing\r', 'trailing\u2028', '__proto__', 'constructor', 'prototype', 42]) {
    let input = fixture(); input.targets[0].requiredTests[0] = value;
    reject(input, 'E_SCHEMA', '$.targets[0].requiredTests[0]');
    input = fixture(); input.buildId = value;
    reject(input, 'E_SCHEMA', '$.buildId');
  }
  for (const value of ['', 'z'.repeat(65)]) {
    const input = fixture(); input.targets[0].id = value;
    reject(input, 'E_LIMIT', '$.targets[0].id');
  }
  for (const value of ['f'.repeat(63), 'f'.repeat(65), `sha256:${A}`, `${A}\n`]) {
    const input = fixture(); input.builds[0].artifactSha256 = value;
    reject(input, 'E_LIMIT', '$.builds[0].artifactSha256');
  }
  for (const value of ['g'.repeat(64), ` ${A.slice(1)}`, `${A.slice(1)}\n`, 0]) {
    const input = fixture(); input.testRuns[0].artifactSha256 = value;
    reject(input, 'E_SCHEMA', '$.testRuns[0].artifactSha256');
  }
});

test('direct calls also reject accessors, proxies, sparse arrays and other non-JSON inputs', () => {
  let calls = 0;
  const input = fixture();
  Object.defineProperty(input.builds[0], 'artifactSha256', { enumerable: true, get() { calls++; return B; } });
  reject(input, 'E_SCHEMA', '$.builds[0]', check);
  const proxied = new Proxy(fixture(), { ownKeys() { calls++; return []; } });
  reject(proxied, 'E_SCHEMA', '$', check);
  assert.equal(calls, 0);
  let data = fixture(); data.targets[0].requiredTests = Array(1);
  reject(data, 'E_SCHEMA', '$.targets[0].requiredTests', check);
  data = fixture(); data.targets = Array(1);
  reject(data, 'E_SCHEMA', '$.targets', check);
  data = fixture(); data.testRuns.extra = 'ignored by ordinary JSON serialization';
  reject(data, 'E_SCHEMA', '$.testRuns', check);
  data = fixture(); data.targets[0][Symbol('extra')] = 'extra';
  reject(data, 'E_SCHEMA', '$.targets[0]', check);
  data = fixture(); Object.setPrototypeOf(data.builds[0], { inherited: true });
  reject(data, 'E_SCHEMA', '$.builds[0]', check);
  data = fixture(); data.builds[0][B] = true;
  reject(data, 'E_SCHEMA', '$.builds[0]', check);
});

test('immutable inputs work and no output refers back to mutable input data', () => {
  const deepFreeze = value => {
    if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
    return value;
  };
  const input = deepFreeze(fixture()), expected = JSON.stringify(run(input));
  const result = run(input);
  result.targets[0].tests[0].status = 'fail';
  result.targets.reverse();
  assert.equal(JSON.stringify(run(input)), expected);
  assert.deepEqual(input, fixture());
});

test('rejects just over each input list bound with E_LIMIT', () => {
  const input = fixture();
  reject({ ...input, targets: Array(33).fill(input.targets[0]) }, 'E_LIMIT', '$.targets');
  reject({ ...input, targets: [{ id: 'somewhere', requiredTests: Array(65).fill('boot') }] }, 'E_LIMIT', '$.targets[0].requiredTests');
  reject({ ...input, builds: Array(257).fill(input.builds[0]) }, 'E_LIMIT', '$.builds');
  reject({ ...input, testRuns: Array(4097).fill(input.testRuns[0]) }, 'E_LIMIT', '$.testRuns');
});

test('maximum declarations fit input/output bounds and issue truncation does not hide blockers', () => {
  const makeId = (prefix, n) => `${prefix}${n}`.padEnd(64, 'x');
  const versions = Array.from({ length: 8 }, (_, i) => makeId('rev-', i));
  const tests = Array.from({ length: 64 }, (_, i) => makeId('test-', i));
  const targets = Array.from({ length: 32 }, (_, i) => ({ id: makeId('target-', i), requiredTests: tests }));
  const builds = targets.flatMap(({ id }) => versions.map(version => build(id, A, version)));
  const testRuns = targets.flatMap(({ id }) => tests.flatMap(testId => [row(id, testId, A, 'pass', versions[0]), row(id, testId, C, 'fail', versions[1])]));
  const input = { buildId: versions[0], targets, builds, testRuns };
  assert.equal(builds.length, 256);
  assert.equal(testRuns.length, 4096);
  assert.ok(Buffer.byteLength(JSON.stringify(input)) < 2 * 1024 * 1024);
  const matching = run(input);
  assert.equal(matching.valid, true);
  assert.equal(matching.targets.at(-1).tests.at(-1).status, 'pass');

  const result = run({ ...input, builds: [], testRuns: [] });
  assert.equal(result.valid, false);
  assert.equal(result.totalIssues, 2080);
  assert.deepEqual(result.issueCounts, { BUILD_MISSING: 32, TEST_MISSING: 2048 });
  assert.equal(result.issues.length, 500);
  assert.equal(result.truncated, true);
  assert.equal(result.issues.at(-1).path, '$.targets[7].requiredTests[43]');
  assert.equal(result.targets.at(-1).tests.length, 64);
  assert.equal(result.targets.at(-1).tests.at(-1).status, 'untested');
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 512 * 1024);
});
