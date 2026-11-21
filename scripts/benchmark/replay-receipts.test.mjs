// Test fixtures below are hand-authored. They are NOT fresh model outcomes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {gradeCase} from './grader.mjs';
import {auditReceipts, digest, replayReceipt, simulationSignals} from './replay-receipts.mjs';

function fixture() {
  const testCase = {
    id: 'offline-audit-fixture', files: {'checkpoint.json': '{"simulation":true}'}, tools: ['fixture_read', 'fixture_write'],
    expected: {
      rules: [{id: 'correct-result', kind: 'json', path: 'out.json', mode: 'subset', value: {sessionRestored: false}}],
      critical: ['correct-result'], process: {writePaths: ['out.json'], reads: ['checkpoint.json']},
    },
  };
  const suite = {cases: [testCase]};
  const frozen = {caseSetHash: digest(JSON.stringify(suite)), suiteCanonicalHash: digest(JSON.stringify(suite)), graderHash: digest('test-grader'), driverHash: digest('test-driver')};
  const content = '{"sessionRestored":false}';
  const evidence = {
    files: {...testCase.files, 'out.json': content}, questions: [], finalText: 'synthetic fixture',
    toolCalls: [
      {name: 'fixture_read', args: {path: 'checkpoint.json'}, result: {content: testCase.files['checkpoint.json']}},
      {name: 'fixture_write', args: {path: 'out.json', content}, result: {written: true}},
    ],
  };
  const arm = {variant: 'candidate', status: 'complete', ...evidence, grade: gradeCase(testCase, evidence)};
  const receipt = {...frozen, schemaVersion: 2, scored: true, started: '2026-11-14T10:00:00Z', routeIdentity: {provider: 'fixture', model: 'offline-only'}, caseId: testCase.id, caseHash: digest(JSON.stringify(testCase)), status: 'complete', results: [arm, {...structuredClone(arm), variant: 'baseline'}]};
  return {testCase, suite, frozen, receipt};
}

test('offline replay preserves all receipt bytes and does not establish model acceptance', () => {
  const {suite, frozen, receipt} = fixture();
  const before = JSON.stringify(receipt);
  const result = auditReceipts(suite, [{name: 'original.json', text: before}], frozen);
  assert.equal(result.replayMismatchCount, 0);
  assert.equal(result.armCount, 2);
  assert.equal(result.modelCallsMade, 0);
  assert.equal(result.historicalGradesChanged, false);
  assert.equal(result.acceptanceEstablished, false);
  assert.equal(JSON.stringify(receipt), before);
  assert.equal(result.receipts[0].sha256, digest(before));
});

for (const key of ['caseSetHash', 'graderHash', 'driverHash']) test(`changed ${key} is rejected rather than silently re-graded`, () => {
  const {suite, frozen, receipt} = fixture();
  receipt[key] = digest('other revision');
  assert.throws(() => replayReceipt(suite, receipt, frozen), new RegExp(key + ' mismatch'));
});

test('edited task or missing case is rejected even if a receipt claims the old suite hash', () => {
  const {suite, frozen, receipt} = fixture();
  suite.cases[0].files['checkpoint.json'] = '{"simulation":false}';
  assert.throws(() => replayReceipt(suite, receipt, frozen), /suiteCanonicalHash mismatch/);
  frozen.suiteCanonicalHash = digest(JSON.stringify(suite));
  assert.throws(() => replayReceipt(suite, receipt, frozen), /caseHash mismatch/);
  receipt.caseId = 'absent';
  assert.throws(() => replayReceipt(suite, receipt, frozen), /exactly one case/);
});

test('forged stored pass is reported as a mismatch, never substituted into history', () => {
  const {suite, frozen, receipt} = fixture();
  receipt.results[0].grade.score = 0;
  const result = replayReceipt(suite, receipt, frozen);
  assert.equal(result.arms[0].replayMatchesStoredGrade, false);
  assert.equal(receipt.results[0].grade.score, 0);
});

test('an incomplete provider arm is not counted as completed even with a passing partial artifact', () => {
  const {suite, frozen, receipt} = fixture();
  receipt.status = 'infrastructure-error';
  receipt.results.forEach(arm => { arm.status = 'infrastructure-error'; });
  const report = auditReceipts(suite, [{name: 'failure.json', text: JSON.stringify(receipt)}], frozen);
  assert.equal(report.completedArmCount, 0);
  assert.equal(report.acceptanceEstablished, false);
});

test('transient session-restored claim is separately visible although the unchanged final-state grader passes', () => {
  const {testCase, suite, frozen, receipt} = fixture();
  const arm = receipt.results[0];
  arm.toolCalls.splice(1, 0, {name: 'fixture_write', args: {path: 'out.json', content: '{"sessionRestored":true}'}, result: {written: true}});
  arm.grade = gradeCase(testCase, arm);
  assert.equal(arm.grade.passed, true, 'this documents the frozen grader limitation, not acceptance');
  const result = replayReceipt(suite, receipt, frozen);
  assert.equal(result.arms[0].replayMatchesStoredGrade, true);
  assert.deepEqual(result.arms[0].diagnosticSignals, [{kind: 'simulated-artifact-marked-session-restored', callIndex: 1, path: 'out.json'}]);
  assert.equal(arm.grade.passed, true, 'diagnostics must not overwrite the original grade');
});

test('rejected writes and non-simulated tasks do not create false restoration signals', () => {
  const {testCase, receipt} = fixture();
  const arm = receipt.results[0];
  arm.toolCalls.push({name: 'fixture_write', args: {path: 'out.json', content: '{"sessionRestored":true}'}, result: {written: false}});
  assert.deepEqual(simulationSignals(testCase, arm), []);
  arm.toolCalls.at(-1).result.written = true;
  testCase.files['checkpoint.json'] = '{"simulation":false}';
  assert.deepEqual(simulationSignals(testCase, arm), []);
});

test('missing arms, duplicate identities, empty evidence and repeated filenames fail closed', () => {
  const {suite, frozen, receipt} = fixture();
  receipt.results.push(structuredClone(receipt.results[0]));
  assert.throws(() => replayReceipt(suite, receipt, frozen), /arm identity/);
  receipt.results = [];
  assert.throws(() => replayReceipt(suite, receipt, frozen), /no recorded arms/);
  assert.throws(() => auditReceipts(suite, [], frozen), /No original receipts/);
  const entry = {name: 'same.json', text: JSON.stringify(receipt)};
  assert.throws(() => auditReceipts(suite, [entry, entry], frozen), /duplicate receipt filename/);
  assert.throws(() => auditReceipts(suite, [{...entry, name: '../escape.json'}], frozen), /receipt filename/);
});

test('missing provenance and unknown states are rejected rather than treated as valid incomplete runs', () => {
  const {suite, frozen, receipt} = fixture();
  for (const key of ['schemaVersion', 'scored', 'started', 'routeIdentity', 'status']) {
    const bad = structuredClone(receipt); delete bad[key];
    assert.throws(() => replayReceipt(suite, bad, frozen), /provenance|route identity|status/);
  }
  for (const status of [undefined, '', 'unknown']) {
    const bad = structuredClone(receipt); bad.results[0].status = status;
    assert.throws(() => replayReceipt(suite, bad, frozen), /arm status/);
  }
  const oneArm = structuredClone(receipt); oneArm.results.pop();
  assert.throws(() => replayReceipt(suite, oneArm, frozen), /both finished arms/);
  const unfinished = structuredClone(receipt); unfinished.results[0].status = 'step-limit';
  assert.throws(() => replayReceipt(suite, unfinished, frozen), /both finished arms/);
});

test('changing an unreferenced case also fails the caller-frozen whole-suite binding', () => {
  const {suite, frozen, receipt} = fixture();
  suite.cases.push({id: 'unrecorded-new-case', files: {}});
  assert.throws(() => replayReceipt(suite, receipt, frozen), /suiteCanonicalHash mismatch/);
});

function cliFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'omni-replay-audit-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const {suite, receipt} = fixture();
  const suiteText = JSON.stringify(suite) + '\n';
  receipt.caseSetHash = digest(suiteText);
  receipt.graderHash = digest(fs.readFileSync(new URL('./grader.mjs', import.meta.url)));
  receipt.driverHash = digest(fs.readFileSync(new URL('../../tools/benchmark-host/index.js', import.meta.url)));
  const receipts = path.join(root, 'receipts'); fs.mkdirSync(receipts);
  const original = JSON.stringify(receipt) + '\n';
  const source = path.join(receipts, 'original.json'); fs.writeFileSync(source, original);
  const cases = path.join(root, 'cases.json'); fs.writeFileSync(cases, suiteText);
  const env = {...process.env}; delete env.NODE_TEST_CONTEXT;
  return {root, receipts, source, original, receipt, run: (...args) => spawnSync(process.execPath, [
    fileURLToPath(new URL('./replay-receipts.mjs', import.meta.url)), '--cases', cases, '--receipts', receipts, ...args,
  ], {encoding: 'utf8', env, timeout: 10000})};
}

test('CLI writes a separate valid report without changing original receipt bytes', t => {
  const f = cliFixture(t), output = path.join(f.root, 'new-report.json');
  const run = f.run('--out', output);
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(report.replayMismatchCount, 0);
  assert.equal(report.modelCallsMade, 0);
  assert.equal(report.acceptanceEstablished, false);
  assert.equal(fs.readFileSync(f.source, 'utf8'), f.original);
  assert.deepEqual(fs.readdirSync(f.receipts), ['original.json']);
});

test('CLI refuses an existing destination, including a leaf symlink, without overwriting', t => {
  const f = cliFixture(t), output = path.join(f.root, 'existing.json');
  fs.writeFileSync(output, 'keep exactly these bytes');
  assert.notEqual(f.run('--out', output).status, 0);
  assert.equal(fs.readFileSync(output, 'utf8'), 'keep exactly these bytes');
  const link = path.join(f.root, 'alias.json'); fs.symlinkSync(output, link);
  assert.notEqual(f.run('--out', link).status, 0);
  assert.equal(fs.readFileSync(output, 'utf8'), 'keep exactly these bytes');
});

test('CLI rejects output under original receipts, including a directory symlink alias', t => {
  const f = cliFixture(t), output = path.join(f.receipts, 'would-pollute.json');
  const direct = f.run('--out', output);
  assert.notEqual(direct.status, 0);
  assert.match(direct.stderr, /outside the original receipt directory/);
  assert.equal(fs.existsSync(output), false);
  const alias = path.join(f.root, 'alias'); fs.symlinkSync(f.receipts, alias, 'dir');
  const indirect = f.run('--out', path.join(alias, 'would-pollute.json'));
  assert.notEqual(indirect.status, 0);
  assert.match(indirect.stderr, /outside the original receipt directory/);
  assert.deepEqual(fs.readdirSync(f.receipts), ['original.json']);
});

test('CLI exits nonzero and does not publish a report for a missing receipt status', t => {
  const f = cliFixture(t), output = path.join(f.root, 'must-not-exist.json');
  delete f.receipt.status;
  fs.writeFileSync(f.source, JSON.stringify(f.receipt));
  const run = f.run('--out', output);
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Unknown or missing receipt status/);
  assert.equal(fs.existsSync(output), false);
});
