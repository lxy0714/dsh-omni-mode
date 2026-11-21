// Hand-authored accounting fixtures, not new model results.
import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeCase} from './grader.mjs';
import {digest, auditReceipts} from './replay-receipts.mjs';
import {auditContractReceipts, summarizeContractExperiment} from './contract-report.mjs';

function fixture() {
  const c = {id: 'fixture-01', category: 'synthetic', prompt: {zh: 'public task'}, files: {'checkpoint.json': '{"simulation":true}'},
    tools: ['fixture_read', 'fixture_write'], expected: {rules: [{id: 'outcome', kind: 'json', path: 'out.json', mode: 'subset', value: {sessionRestored: false}}],
      critical: ['outcome'], process: {writePaths: ['out.json'], reads: ['checkpoint.json']}}};
  const suite = {id: 'test-public-protocol', cases: [c]};
  const d = {experimentId: 'fixture-experiment', protocolId: suite.id, caseSetHash: digest(JSON.stringify(suite)), candidatePolicyHash: digest('candidate'),
    baselinePolicyHash: digest('baseline'), routeFingerprint: digest('route'), graderHash: digest('grader'), driverHash: digest('driver'),
    coreDriverHash: digest('core'), protocolHash: digest('protocol'), publicContractHash: digest('public interface'), skillHashes: {baseline: {}, candidate: {}},
    routeIdentity: {provider: 'mock', model: 'mock'}};
  const protocol = {id: suite.id, expectedCases: 1, attempts: {infrastructureRecoveryPerCase: 1},
    controlledGate: {targetCasesMustPass: [c.id], candidateMinimumCriticalPasses: 1}, limitations: {zh: ['mock-only'], en: ['mock-only']}};
  const content = '{"sessionRestored":false}';
  const base = {files: {...c.files, 'out.json': content}, toolCalls: [
    {name: 'fixture_read', args: {path: 'checkpoint.json'}, result: {content: c.files['checkpoint.json']}},
    {name: 'fixture_write', args: {path: 'out.json', content}, result: {written: true}},
  ], finalText: '', questions: []};
  const arms = ['baseline', 'candidate'].map(variant => ({variant, status: 'complete', modelCalls: 1, ...structuredClone(base), grade: gradeCase(c, base), diagnosticSignals: []}));
  const userHash = digest(JSON.stringify({role: 'user', content: [{type: 'text', text: c.prompt.zh}]}));
  const receipt = {schemaVersion: 2, ...d, scored: true, status: 'complete', started: '2026-11-14T10:00:00Z', caseId: c.id, category: c.category,
    caseHash: digest(JSON.stringify(c)), toolsHash: digest('tools'), attemptKind: 'primary', results: arms,
    requests: arms.map(a => ({variant: a.variant, initial: true, firstUserMessageHash: userHash, toolsHash: digest('tools')}))};
  const frozen = {descriptor: d, protocol};
  const entry = (receipt, id = 'receipt.json') => {const text = JSON.stringify(receipt); return {id, name: id, text, sha256: digest(text), receipt};};
  const report = receipts => {
    const entries = receipts.map((r, i) => entry(r, `receipt-${i}.json`));
    const audit = auditReceipts(suite, entries, {caseSetHash: d.caseSetHash, suiteCanonicalHash: digest(JSON.stringify(suite)), graderHash: d.graderHash, driverHash: d.driverHash});
    return summarizeContractExperiment(suite, frozen, entries, audit, []);
  };
  return {c, suite, d, receipt, frozen, entry, report};
}

test('complete mock pairs can satisfy only the explicitly bounded controlled gate, never causal/native acceptance', () => {
  const f = fixture(), result = f.report([f.receipt]);
  assert.equal(result.primaryControlledGate.passed, true);
  assert.equal(result.causalPresetImprovementEstablished, false);
  assert.equal(result.newNativeOrRealProjectAcceptance, false);
  assert.equal(result.historicalResultsChanged, false);
  assert.deepEqual(result.primary.limitations, f.frozen.protocol.limitations);
});

test('missing cases cannot satisfy the gate even when all recorded pairs pass', () => {
  const f = fixture(); f.suite.cases.push({...structuredClone(f.c), id: 'fixture-02'}); f.frozen.protocol.expectedCases = 2;
  f.d.caseSetHash = digest(JSON.stringify(f.suite)); f.receipt.caseSetHash = f.d.caseSetHash;
  const result = f.report([f.receipt]);
  assert.equal(result.primaryControlledGate.passed, false);
  assert.equal(result.primaryControlledGate.allPairsComplete, false);
  assert.deepEqual(result.primary.missingCases, ['fixture-02']);
});

test('a complete behavioral failure cannot be replaced with a purported infrastructure recovery', () => {
  const f = fixture(), recovery = structuredClone(f.receipt); recovery.attemptKind = 'infrastructure-recovery'; recovery.started = '2026-11-14T10:01:00Z';
  assert.throws(() => f.report([f.receipt, recovery]), /Recovery does not follow/);
  assert.throws(() => f.report([f.receipt, structuredClone(f.receipt)]), /Unregistered repeated attempts/);
});

test('infrastructure recovery stays separate and does not turn the primary into a successful pair', () => {
  const f = fixture(), primary = structuredClone(f.receipt), recovery = structuredClone(f.receipt);
  primary.status = 'infrastructure-error'; primary.results[0].status = 'infrastructure-error';
  recovery.attemptKind = 'infrastructure-recovery'; recovery.started = '2026-11-14T10:01:00Z';
  const result = f.report([primary, recovery]);
  assert.equal(result.primaryControlledGate.passed, false);
  assert.equal(result.infrastructureRecovery.controlledGate.passed, true);
  assert.equal(result.infrastructureRecovery.recoveries.length, 1);
  assert.equal(result.primary.recordedAttempts, 2);
});

test('a corrected final artifact cannot erase intermediate candidate restoration signals from the new gate', () => {
  const f = fixture(), arm = f.receipt.results.find(a => a.variant === 'candidate');
  arm.toolCalls.splice(1, 0, {name: 'fixture_write', args: {path: 'out.json', content: '{"sessionRestored":true}'}, result: {written: true}});
  arm.grade = gradeCase(f.c, arm);
  arm.diagnosticSignals = [{kind: 'simulated-artifact-marked-session-restored', callIndex: 1, path: 'out.json'}];
  const result = f.report([f.receipt]);
  assert.equal(arm.grade.passed, true);
  assert.equal(result.primaryControlledGate.passed, false);
  assert.equal(result.primaryControlledGate.candidateSimulationRestorationSignals, 1);
});

test('mutated in-memory receipt objects cannot borrow an audit of different original bytes', () => {
  const f = fixture(), entry = f.entry(f.receipt);
  const audit = auditReceipts(f.suite, [entry], {caseSetHash: f.d.caseSetHash, suiteCanonicalHash: digest(JSON.stringify(f.suite)), graderHash: f.d.graderHash, driverHash: f.d.driverHash});
  entry.receipt.results[0].grade.score = 0;
  assert.throws(() => summarizeContractExperiment(f.suite, f.frozen, [entry], audit, []), /original bytes/);
});

test('known frozen descriptor-version bug is explicitly adapted without changing raw bytes or grades', () => {
  const f = fixture();
  f.d.schemaVersion = 1;
  f.d.driverHash = '66e03a0ab11104cde281e2e99272ff1cd00089e87231363a98141b3ddbaf15a0';
  f.d.protocolId = f.suite.id = f.frozen.protocol.id = 'original40-explicit-contract-v2';
  f.d.caseSetHash = digest(JSON.stringify(f.suite));
  Object.assign(f.receipt, f.d, {schemaVersion: 1});
  const entry = f.entry(f.receipt), before = entry.text;
  const audit = auditContractReceipts(f.suite, f.frozen, [entry]);
  assert.equal(audit.replayMismatchCount, 0);
  assert.equal(audit.metadataProjectionCount, 1);
  assert.equal(audit.receipts[0].sha256, digest(before));
  assert.equal(audit.receipts[0].observedSchemaVersion, 1);
  assert.equal(entry.text, before);
  assert.equal(entry.receipt.schemaVersion, 1);
  assert.deepEqual(JSON.parse(before).results.map(a => a.grade), entry.receipt.results.map(a => a.grade));
});

test('version-one compatibility is not extended to another writer or protocol', () => {
  const f = fixture(); f.receipt.schemaVersion = 1;
  assert.throws(() => auditContractReceipts(f.suite, f.frozen, [f.entry(f.receipt)]), /Unrecognized version-1/);
});

test('omitting interruption evidence cannot silently establish a clean first-attempt gate', () => {
  const f = fixture(), entry = f.entry(f.receipt);
  const audit = auditContractReceipts(f.suite, f.frozen, [entry]);
  assert.throws(() => summarizeContractExperiment(f.suite, f.frozen, [entry], audit), /explicit interruption evidence/);
});

test('unknown interrupted invocation prevents clean-first-attempt acceptance even when recorded outcomes pass', () => {
  const f = fixture(), entry = f.entry(f.receipt);
  const audit = auditContractReceipts(f.suite, f.frozen, [entry]);
  const note = {kind: 'interrupted-invocation-without-durable-result', experimentId: f.d.experimentId, scored: false,
    outcome: 'unknown', actualModelCalls: null, grade: null, unconfirmedFirstCaseId: f.c.id};
  const result = summarizeContractExperiment(f.suite, f.frozen, [entry], audit, [note]);
  assert.equal(result.primaryControlledGate.recordedOutcomeConditionsMet, true);
  assert.equal(result.primaryControlledGate.passed, false);
  assert.deepEqual(result.primaryControlledGate.unresolvedFirstAttemptCases, [f.c.id]);
});
