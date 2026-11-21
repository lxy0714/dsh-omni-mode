// Offline evidence audit, NOT a new model experiment or a historical re-score.
// Read original receipts, verify their frozen inputs/code, and compare a replay
// with the grades they already recorded. Never edit those receipts or the gate.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {gradeCase} from './grader.mjs';

export const digest = value => createHash('sha256').update(value).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
const finished = status => ['complete', 'needs-user'].includes(status);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const receiptStatuses = new Set(['complete', 'incomplete', 'infrastructure-error']);
const armStatuses = new Set(['complete', 'needs-user', 'step-limit', 'output-limit', 'aborted', 'infrastructure-error']);

/** Separate diagnostic, never a change to the original grader's result. */
export function simulationSignals(testCase, arm) {
  const simulated = Object.values(testCase.files ?? {}).some(text => {
    try { return JSON.parse(text)?.simulation === true; } catch { return false; }
  });
  if (!simulated) return [];
  const signals = [];
  for (const [index, call] of (arm.toolCalls ?? []).entries()) {
    if (call?.name !== 'fixture_write' || call.result?.written !== true) continue;
    let artifact;
    try { artifact = JSON.parse(call.args?.content); } catch { continue; }
    if (object(artifact) && artifact.sessionRestored === true) signals.push({
      kind: 'simulated-artifact-marked-session-restored',
      callIndex: index,
      path: call.args.path,
    });
  }
  return signals;
}

export function replayReceipt(suite, receipt, frozen) {
  if (!object(suite) || !Array.isArray(suite.cases) || !object(receipt)) throw Error('Malformed suite or receipt');
  // Callers freeze this canonical hash alongside the exact original byte hash.
  // Neither hash is a signature/authentication claim about the model provider.
  if (!hashPattern.test(frozen?.suiteCanonicalHash ?? '') || digest(JSON.stringify(suite)) !== frozen.suiteCanonicalHash) throw Error('Frozen suiteCanonicalHash mismatch');
  for (const key of ['caseSetHash', 'graderHash', 'driverHash']) {
    if (!hashPattern.test(frozen?.[key] ?? '') || receipt[key] !== frozen[key]) throw Error(`Frozen ${key} mismatch`);
  }
  if (receipt.schemaVersion !== 2 || receipt.scored !== true || typeof receipt.started !== 'string' || !Number.isFinite(Date.parse(receipt.started))) throw Error('Missing or malformed receipt provenance');
  if (!object(receipt.routeIdentity) || ['provider', 'model'].some(key => typeof receipt.routeIdentity[key] !== 'string' || !receipt.routeIdentity[key].trim())) throw Error('Missing or malformed route identity');
  if (!receiptStatuses.has(receipt.status)) throw Error('Unknown or missing receipt status');
  const cases = suite.cases.filter(testCase => testCase.id === receipt.caseId);
  if (cases.length !== 1) throw Error('Receipt must name exactly one case in the frozen suite');
  const testCase = cases[0];
  if (receipt.caseHash !== digest(JSON.stringify(testCase))) throw Error('Frozen caseHash mismatch');
  if (!Array.isArray(receipt.results) || !receipt.results.length) throw Error('Receipt has no recorded arms');
  const variants = receipt.results.map(arm => arm?.variant);
  if (new Set(variants).size !== variants.length || variants.some(name => !['baseline', 'candidate'].includes(name))) throw Error('Invalid or duplicate arm identity');
  if (receipt.results.some(arm => !armStatuses.has(arm.status))) throw Error('Unknown or missing arm status');
  if (receipt.status === 'complete' && (variants.length !== 2 || receipt.results.some(arm => !finished(arm.status)))) throw Error('A complete receipt requires both finished arms');
  return {
    caseId: receipt.caseId,
    started: receipt.started,
    routeIdentity: receipt.routeIdentity ?? null,
    status: receipt.status,
    arms: receipt.results.map(arm => {
      if (!object(arm.grade) || !Array.isArray(arm.toolCalls) || !object(arm.files)) throw Error('Incomplete arm evidence');
      const replay = gradeCase(testCase, arm);
      return {
        variant: arm.variant,
        status: arm.status,
        completed: finished(arm.status),
        recordedPassed: arm.grade.passed,
        recordedCriticalPassed: arm.grade.criticalPassed,
        recordedFailedChecks: (arm.grade.checks ?? []).filter(check => !check.passed).map(check => check.id),
        replayMatchesStoredGrade: isDeepStrictEqual(replay, arm.grade),
        diagnosticSignals: simulationSignals(testCase, arm),
      };
    }),
  };
}

export function auditReceipts(suite, entries, frozen) {
  if (!Array.isArray(entries) || entries.length === 0) throw Error('No original receipts supplied');
  const names = entries.map(entry => entry.name);
  if (names.some(name => typeof name !== 'string' || path.basename(name) !== name) || new Set(names).size !== names.length) throw Error('Invalid or duplicate receipt filename');
  const receipts = entries.map(({name, text}) => ({
    file: name,
    sha256: digest(text),
    ...replayReceipt(suite, JSON.parse(text), frozen),
  }));
  const arms = receipts.flatMap(receipt => receipt.arms);
  return {
    schemaVersion: 1,
    kind: 'offline-original-receipt-replay-audit',
    modelCallsMade: 0,
    historicalGradesChanged: false,
    acceptanceEstablished: false,
    frozen,
    receiptCount: receipts.length,
    armCount: arms.length,
    completedArmCount: arms.filter(arm => arm.completed).length,
    replayMismatchCount: arms.filter(arm => !arm.replayMatchesStoredGrade).length,
    diagnosticSignalCount: arms.reduce((sum, arm) => sum + arm.diagnosticSignals.length, 0),
    receipts,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const allowed = new Set(['--cases', '--receipts', '--out']);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!allowed.has(key) || !args[i + 1] || args[i + 1].startsWith('--') || Object.hasOwn(options, key)) throw Error('Use --cases <file> --receipts <directory> [--out <new-file>]');
    options[key] = args[i + 1];
  }
  if (!options['--cases'] || !options['--receipts']) throw Error('Both --cases and --receipts are required');
  const suiteText = fs.readFileSync(path.resolve(options['--cases']), 'utf8');
  const suite = JSON.parse(suiteText);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const frozen = {
    caseSetHash: digest(suiteText),
    suiteCanonicalHash: digest(JSON.stringify(suite)),
    graderHash: digest(fs.readFileSync(path.join(root, 'scripts/benchmark/grader.mjs'))),
    driverHash: digest(fs.readFileSync(path.join(root, 'tools/benchmark-host/index.js'))),
  };
  const directory = fs.realpathSync(path.resolve(options['--receipts']));
  let output;
  if (options['--out']) {
    const requested = path.resolve(options['--out']);
    output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
    if (output === directory || output.startsWith(directory + path.sep)) throw Error('Audit output must be outside the original receipt directory');
  }
  const entries = fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort().map(name => ({
    name, text: fs.readFileSync(path.join(directory, name), 'utf8'),
  }));
  const report = auditReceipts(suite, entries, frozen);
  if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({...report, receipts: undefined}, null, 2));
  if (report.replayMismatchCount !== 0) process.exitCode = 1;
}
