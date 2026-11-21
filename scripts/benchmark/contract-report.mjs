// Offline accounting for one preregistered public-contract experiment.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {summarizeReceipts} from './summarize.mjs';
import {replayReceipt, digest} from './replay-receipts.mjs';

const finished = arm => ['complete', 'needs-user'].includes(arm?.status);
const paired = r => r.status === 'complete' && r.results.length === 2 && r.results.every(finished);
const faults = r => r.status === 'infrastructure-error' && r.results.some(a => ['aborted', 'infrastructure-error'].includes(a.status));
const descriptorOverrideDriver = '66e03a0ab11104cde281e2e99272ff1cd00089e87231363a98141b3ddbaf15a0';

/** Explicit compatibility at the auditor boundary, never an edit to a receipt.
 * This exact frozen writer spreads descriptor.schemaVersion=1 after its intended
 * envelope version=2. The grade/state payload is unaffected. Retain raw hashes
 * and disclose the one-field validator projection rather than rewriting history.
 */
export function auditContractReceipts(suite, frozen, entries) {
  if (!Array.isArray(entries) || !entries.length) throw Error('No original contract receipts');
  const d = frozen.descriptor;
  const pins = {caseSetHash: d.caseSetHash, suiteCanonicalHash: digest(JSON.stringify(suite)), graderHash: d.graderHash, driverHash: d.driverHash};
  const names = new Set();
  const receipts = entries.map(entry => {
    if (typeof entry.name !== 'string' || path.basename(entry.name) !== entry.name || names.has(entry.name)) throw Error('Invalid or repeated original receipt filename');
    names.add(entry.name);
    const raw = JSON.parse(entry.text), rawHash = digest(entry.text);
    if (rawHash !== entry.sha256 || !isDeepStrictEqual(raw, entry.receipt)) throw Error('Receipt object is not bound to its original bytes');
    let input = raw, metadataProjection = null;
    if (raw.schemaVersion === 1) {
      if (d.schemaVersion !== 1 || d.driverHash !== descriptorOverrideDriver || raw.driverHash !== d.driverHash ||
        d.protocolId !== 'original40-explicit-contract-v2' || raw.protocolId !== d.protocolId || raw.experimentId !== d.experimentId) throw Error('Unrecognized version-1 contract receipt');
      input = {...raw, schemaVersion: 2};
      metadataProjection = {field: '/schemaVersion', observed: 1, validatorInput: 2,
        scope: 'in-memory-validator-input-only', reason: 'known frozen descriptor-spread override', projectedInputHash: digest(JSON.stringify(input))};
    }
    return {file: entry.name, sha256: rawHash, observedSchemaVersion: raw.schemaVersion, metadataProjection, ...replayReceipt(suite, input, pins)};
  });
  const arms = receipts.flatMap(r => r.arms);
  return {kind: 'offline-contract-receipt-replay-audit', receiptCount: receipts.length, armCount: arms.length,
    replayMismatchCount: arms.filter(a => !a.replayMatchesStoredGrade).length,
    diagnosticSignalCount: arms.reduce((n, a) => n + a.diagnosticSignals.length, 0),
    metadataProjectionCount: receipts.filter(r => r.metadataProjection !== null).length,
    originalBytesChanged: false, historicalGradesChanged: false, receipts};
}

export function summarizeContractExperiment(suite, frozen, entries, audit, interruptions) {
  // The pure accounting API cannot inspect a caller's directory. Require an
  // explicit census rather than silently treating omitted evidence as no events.
  if (!Array.isArray(interruptions)) throw Error('An explicit interruption evidence array is required; the CLI scans all sidecars');
  const d = frozen.descriptor;
  if (suite.id !== d.protocolId || frozen.protocol.id !== d.protocolId || frozen.protocol.expectedCases !== suite.cases.length) throw Error('Frozen protocol mismatch');
  if (audit.replayMismatchCount || audit.receiptCount !== entries.length) throw Error('Original-grade replay audit failed');
  const ids = new Set(suite.cases.map(c => c.id));
  if (ids.size !== suite.cases.length) throw Error('Duplicate frozen case identities');
  for (const note of interruptions) {
    if (note.kind !== 'interrupted-invocation-without-durable-result' || note.experimentId !== d.experimentId || note.scored !== false ||
      note.outcome !== 'unknown' || note.actualModelCalls !== null || note.grade !== null || !ids.has(note.unconfirmedFirstCaseId)) throw Error('Invalid interruption evidence');
  }
  const unresolvedFirstAttemptCases = [...new Set(interruptions.map(n => n.unconfirmedFirstCaseId))].sort();
  for (const entry of entries) {
    const r = entry.receipt;
    if (digest(entry.text) !== entry.sha256 || !isDeepStrictEqual(JSON.parse(entry.text), r)) throw Error('Receipt object is not bound to its original bytes');
    for (const key of ['experimentId', 'caseSetHash', 'candidatePolicyHash', 'baselinePolicyHash', 'routeFingerprint', 'graderHash', 'driverHash', 'coreDriverHash', 'protocolHash', 'publicContractHash']) {
      if (r[key] !== d[key]) throw Error(`Receipt ${key} mismatch`);
    }
    if (!isDeepStrictEqual(r.skillHashes, d.skillHashes) || r.scored !== true || !ids.has(r.caseId) || !['primary', 'infrastructure-recovery'].includes(r.attemptKind)) throw Error('Receipt treatment/scope mismatch');
    if (!Array.isArray(r.requests)) throw Error('Missing controlled request digests');
    const c = suite.cases.find(c => c.id === r.caseId);
    const firstUser = digest(JSON.stringify({role: 'user', content: [{type: 'text', text: c.prompt.zh}]}));
    if (r.requests.some(q => q.firstUserMessageHash !== firstUser || q.toolsHash !== r.toolsHash)) throw Error('Public request/tool digest mismatch');
    for (const arm of r.results) {
      if (r.requests.filter(q => q.variant === arm.variant).length !== arm.modelCalls) throw Error('Request/model-call accounting mismatch');
    }
    const replay = audit.receipts.find(row => row.sha256 === digest(entries.find(e => e.receipt === r).text));
    if (!replay || replay.arms.some(a => !a.replayMatchesStoredGrade)) throw Error('Missing per-receipt replay proof');
    for (const arm of r.results) {
      const checked = replay.arms.find(a => a.variant === arm.variant);
      if (!checked || !isDeepStrictEqual(arm.diagnosticSignals, checked.diagnosticSignals)) throw Error('Trajectory diagnosis mismatch');
    }
  }
  const config = {caseSetHash: d.caseSetHash, candidatePolicyHash: d.candidatePolicyHash, routeFingerprint: d.routeFingerprint,
    graderHash: d.graderHash, driverHash: d.driverHash, cases: suite.cases};
  const account = rows => ({...summarizeReceipts(rows, config), kind: 'preregistered-public-interface-receipt-accounting',
    ...(interruptions.length ? {selection: 'first-recorded-attempts; an earlier interrupted invocation has unknown outcome'} : {}), limitations: frozen.protocol.limitations});
  const primary = account(entries);
  const selected = [], recoveries = [];
  for (const c of suite.cases) {
    const rows = entries.filter(e => e.receipt.caseId === c.id).sort((a, b) => a.receipt.started.localeCompare(b.receipt.started) || a.id.localeCompare(b.id));
    const originals = rows.filter(e => e.receipt.attemptKind === 'primary'), retries = rows.filter(e => e.receipt.attemptKind === 'infrastructure-recovery');
    if (originals.length > 1 || retries.length > frozen.protocol.attempts.infrastructureRecoveryPerCase) throw Error('Unregistered repeated attempts');
    if (retries.length && (originals.length !== 1 || !faults(originals[0].receipt) || retries[0].receipt.started < originals[0].receipt.started)) throw Error('Recovery does not follow an infrastructure failure');
    if (originals.length) {
      const chosen = paired(originals[0].receipt) ? originals[0] : retries.find(e => paired(e.receipt)) ?? originals[0];
      selected.push(chosen);
      if (chosen !== originals[0]) recoveries.push({caseId: c.id, primary: originals[0].id, recovery: chosen.id});
    }
  }
  const recovered = account(selected);
  function gate(summary, selectedEntries) {
    const candidateSignals = selectedEntries.flatMap(e => e.receipt.results.filter(a => a.variant === 'candidate').flatMap(a => a.diagnosticSignals));
    const targetCasesPassed = frozen.protocol.controlledGate.targetCasesMustPass.every(id => selectedEntries.some(e => e.receipt.caseId === id && paired(e.receipt) && e.receipt.results.some(a => a.variant === 'candidate' && a.grade.passed)));
    const allPairsComplete = summary.pairedCompletedCases === suite.cases.length;
    const candidateCriticalPassed = summary.counts.candidate.criticalPassed, baselineCriticalPassed = summary.counts.baseline.criticalPassed;
    const recordedOutcomeConditionsMet = allPairsComplete && candidateCriticalPassed >= frozen.protocol.controlledGate.candidateMinimumCriticalPasses
      && candidateCriticalPassed >= baselineCriticalPassed && summary.criticalRegressions.length === 0
      && candidateSignals.length === 0 && targetCasesPassed;
    return {passed: recordedOutcomeConditionsMet && unresolvedFirstAttemptCases.length === 0, recordedOutcomeConditionsMet,
      scope: 'controlled-public-contract-only', allPairsComplete, candidateCriticalPassed, baselineCriticalPassed,
      criticalRegressions: summary.criticalRegressions, candidateSimulationRestorationSignals: candidateSignals.length,
      targetCasesPassed, unresolvedFirstAttemptCases};
  }
  return {
    schemaVersion: 1, kind: 'separate-public-contract-experiment-report', experimentId: d.experimentId,
    protocolId: d.protocolId, cohort: primary.cohort, routeIdentity: d.routeIdentity,
    historicalResultsChanged: false, newNativeOrRealProjectAcceptance: false, causalPresetImprovementEstablished: false,
    primary, primaryControlledGate: gate(primary, entries.filter(e => e.receipt.attemptKind === 'primary')),
    infrastructureRecovery: {selection: 'one explicitly preregistered infrastructure recovery, never behavioral best-of', recoveries,
      summary: recovered, controlledGate: gate(recovered, selected)},
    replayAudit: {receipts: audit.receiptCount, arms: audit.armCount, mismatches: audit.replayMismatchCount, intermediateSignals: audit.diagnosticSignalCount,
      metadataProjectionCount: audit.metadataProjectionCount ?? 0, originalBytesChanged: false},
    interruptionEvidence: {count: interruptions.length, unresolvedFirstAttemptCases, notes: interruptions},
    limitations: frozen.protocol.limitations,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--experiment', '--out'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw Error('Use --experiment <UUID> [--out <new-report.json>]');
    options[args[i]] = args[i + 1];
  }
  const id = options['--experiment'];
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id ?? '')) throw Error('Exact experiment UUID required');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const directory = path.join(root, '.verification/contract-benchmark', id);
  const frozen = JSON.parse(fs.readFileSync(path.join(directory, 'frozen.json'), 'utf8'));
  const sources = JSON.parse(fs.readFileSync(path.join(directory, 'sources.json'), 'utf8'));
  const hashes = Object.fromEntries(Object.entries(sources).map(([p, text]) => [p, digest(text)]));
  if (!isDeepStrictEqual(hashes, frozen.descriptor.sourceHashes)) throw Error('Frozen source snapshot mismatch');
  if (digest(fs.readFileSync(path.join(root, 'scripts/benchmark/grader.mjs'))) !== frozen.descriptor.graderHash) throw Error('Cannot replay with a changed grader');
  const suiteRaw = sources['benchmark/cases-v2.json'], suite = JSON.parse(suiteRaw);
  if (digest(suiteRaw) !== frozen.descriptor.caseSetHash) throw Error('Frozen suite mismatch');
  const inputDirectory = fs.realpathSync(path.join(directory, 'receipts'));
  const entries = fs.readdirSync(inputDirectory).filter(name => name.endsWith('.json')).sort().map(id => {
    const text = fs.readFileSync(path.join(inputDirectory, id), 'utf8');
    return {id, name: id, text, sha256: digest(text), receipt: JSON.parse(text)};
  });
  const audit = auditContractReceipts(suite, frozen, entries);
  const interruptions = fs.readdirSync(directory).filter(name => /^interruption-.*\.json$/.test(name)).sort().map(name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')));
  const report = summarizeContractExperiment(suite, frozen, entries, audit, interruptions);
  report.analysisSourceHash = digest(fs.readFileSync(fileURLToPath(import.meta.url)));
  if (options['--out']) {
    const requested = path.resolve(options['--out']);
    const target = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
    if (target === inputDirectory || target.startsWith(inputDirectory + path.sep)) throw Error('Report cannot pollute original receipts');
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  }
  console.log(JSON.stringify({experimentId: report.experimentId, routeIdentity: report.routeIdentity, primary: {counts: report.primary.counts, pairedCases: report.primary.pairedCompletedCases},
    gate: report.primaryControlledGate, recovery: {counts: report.infrastructureRecovery.summary.counts, recoveries: report.infrastructureRecovery.recoveries, gate: report.infrastructureRecovery.controlledGate},
    replayAudit: report.replayAudit, historicalResultsChanged: false, causalPresetImprovementEstablished: false}, null, 2));
}
