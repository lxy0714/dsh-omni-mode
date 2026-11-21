// Maintenance-mechanism tests use real Node processes with SMALL SYNTHETIC suites
// in owned temporary copies. They are not the 192 real domain-contract tests;
// production --write measures those separately. Never mutate the source tree.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CONTRACT_TEST_FILES} from './runtime-files.mjs';
import {expectedInputs, refreshEvidence, checkEvidence, parseCounts} from './build-test-evidence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OWNED = new Set();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const env = () => { const e = {...process.env, NODE_OPTIONS: ''}; delete e.NODE_TEST_CONTEXT; return e; };
const read = root => JSON.parse(fs.readFileSync(path.join(root, 'capabilities/test-evidence.json'), 'utf8'));
const write = (root, record) => fs.writeFileSync(path.join(root, 'capabilities/test-evidence.json'), JSON.stringify(record, null, 2) + '\n');
const invoke = (root, args = ['--check']) => spawnSync(process.execPath, [path.join(root, 'capabilities/build-test-evidence.mjs'), ...args], {cwd: root, env: env(), encoding: 'utf8', timeout: 30000});
function owned() { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'omni-evidence-unit-')); OWNED.add(p); return p; }
function remove(p) {
  assert.ok(OWNED.has(p)); assert.equal(path.dirname(p), os.tmpdir());
  assert.ok(path.basename(p).startsWith('omni-evidence-unit-'));
  fs.rmSync(p, {recursive: true, force: true}); OWNED.delete(p);
}
let warm, realInputs, sourceBefore;
const sourcePaths = () => [...realInputs.map(n => path.resolve(ROOT, 'capabilities', n)), path.join(ROOT, 'package.json'), path.join(ROOT, 'capabilities/test-evidence.json')];
before(() => {
  realInputs = expectedInputs(ROOT);
  sourceBefore = Object.fromEntries(sourcePaths().map(p => [p, sha(fs.readFileSync(p))]));
  warm = owned(); fs.mkdirSync(path.join(warm, 'capabilities'));
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(warm, 'package.json'));
  for (const n of realInputs) {
    const to = path.resolve(warm, 'capabilities', n);
    assert.ok(to.startsWith(warm + path.sep)); fs.mkdirSync(path.dirname(to), {recursive: true});
    fs.copyFileSync(path.resolve(ROOT, 'capabilities', n), to);
  }
  for (const n of CONTRACT_TEST_FILES) fs.writeFileSync(path.join(warm, 'capabilities', n),
    "import {test} from 'node:test'; import assert from 'node:assert/strict'; test('synthetic maintenance fixture',()=>assert.equal(2+2,4));\n");
  // This actually runs the six synthetic fixture files, not a mocked exit code.
  refreshEvidence(warm);
});
after(() => {
  for (const [p, hash] of Object.entries(sourceBefore ?? {})) assert.equal(sha(fs.readFileSync(p)), hash, 'source tree must remain byte-identical: ' + p);
  for (const p of [...OWNED]) remove(p);
});
function fixture(fn) { const root = owned(); fs.cpSync(warm, root, {recursive: true}); try { return fn(root); } finally { remove(root); } }
function expectFailure(root) {
  const run = invoke(root); assert.equal(run.status, 1, run.stdout + run.stderr);
  const report = JSON.parse(run.stdout || run.stderr);
  assert.ok(report.check === 'FAIL' || report.error?.code === 'E_EVIDENCE'); return report;
}

// The four originally observed false acceptances are actual CLI regressions.
test('baseline copied fixture passes with all runtime, test, excerpt, skill and generator hashes', () => fixture(root => {
  const run = invoke(root); assert.equal(run.status, 0, run.stderr); const report = JSON.parse(run.stdout);
  assert.equal(report.check, 'PASS'); assert.equal(report.hashedFiles, realInputs.length);
  assert.ok(read(root).evidence.hashes['game-idle.mjs']);
  assert.ok(read(root).evidence.hashes['vendor/commonmark-0.31.2.cjs']);
  assert.ok(read(root).evidence.hashes['../skills/omni-game/SKILL.md']);
  assert.equal(read(root).evidence.counts.tests, CONTRACT_TEST_FILES.length);
}));
test('original failure 1: changed game implementation fails the real CLI', () => fixture(root => {
  fs.appendFileSync(path.join(root, 'capabilities/game-idle.mjs'), '\n// change in owned copy only\n');
  assert.match(expectFailure(root).problems.join('\n'), /game-idle\.mjs/);
}));
test('original failure 2: clearing the entire hash table fails the real CLI', () => fixture(root => {
  const r = read(root); r.evidence.hashes = {}; write(root, r); expectFailure(root);
}));
test('original failure 3: repeating one suite six times fails the real CLI', () => fixture(root => {
  const r = read(root); r.evidence.command = 'node --test --test-reporter=tap ' + Array(CONTRACT_TEST_FILES.length).fill('capabilities/operations.test.mjs').join(' '); write(root, r); expectFailure(root);
}));
test('original failure 4: unexecuted and failed evidence fails the real CLI', () => fixture(root => {
  const r = read(root); r.evidence.executed = false; r.evidence.exitCode = 1;
  r.evidence.counts.pass--; r.evidence.counts.fail++; write(root, r); expectFailure(root);
}));

const mutations = [
  ['missing individual hash', r => { delete r.evidence.hashes['schema.mjs']; }],
  ['arbitrary extra path key', r => { r.evidence.hashes['../../outside-secret'] = '0'.repeat(64); }],
  ['malformed hash', r => { r.evidence.hashes['schema.mjs'] = 'not-a-sha256'; }],
  ['wrong hash base', r => { r.evidence.hashedRelativeTo = '../'; }],
  ['counts claiming zero tests', r => { for (const k of Object.keys(r.evidence.counts)) r.evidence.counts[k] = 0; }],
  ['counts claiming a skipped contract', r => { r.evidence.counts.pass--; r.evidence.counts.skipped++; }],
  ['negative counts', r => { r.evidence.counts.pass = -1; }],
  ['string counts', r => { r.evidence.counts.pass = String(r.evidence.counts.pass); }],
  ['summary/count disagreement', r => { r.evidence.counts.pass++; r.evidence.counts.tests++; }],
  ['missing summary', r => { r.evidence.outputTail = ''; }],
  ['duplicate summary', r => { r.evidence.outputTail += '\n# tests 6\n'; }],
  ['false support claim', r => { r.evidence.supported = false; }],
  ['nonempty missing tests', r => { r.evidence.missingTests = ['operations.test.mjs']; }],
  ['signal exit', r => { r.evidence.signal = 'SIGTERM'; }],
  ['timeout', r => { r.evidence.timedOut = true; }],
  ['nonzero exit', r => { r.evidence.exitCode = 1; }],
  ['accepted false', r => { r.accepted = false; }],
  ['wrong package', r => { r.package = 'other'; }],
  ['wrong package version', r => { r.generation.packageVersion = '999.0.0'; }],
  ['bad generation date', r => { r.generation.generatedAt = 'yesterday'; }],
  ['inconsistent Node provenance', r => { r.evidence.node = 'v0.0.0'; }],
  ['unknown extra metadata', r => { r.evidence.successAnyway = true; }],
  ['operations replaced with a count', r => { r.operations = 27; }],
  ['duplicate/missing operations', r => { r.operations[1] = structuredClone(r.operations[0]); }],
  ['wrong per-operation suite identity', r => { r.operations[0].evidence.tests = ['capabilities/catalog.test.mjs']; }],
  ['unsupported real-service assertion', r => { r.operations[0].realServiceAccepted = true; }],
];
for (const [label, change] of mutations) test('rejects ' + label, () => fixture(root => {
  const r = read(root); change(r); write(root, r); expectFailure(root);
}));
for (const name of ['engineering-impact.mjs', 'documents-audit-core.mjs', 'documents-audit-worker.mjs',
  'vendor/commonmark-0.31.2.cjs', 'source-excerpts.json', '../skills/omni-documents/SKILL.md']) {
  test('detects input drift without touching the source tree: ' + name, () => fixture(root => {
    fs.appendFileSync(path.resolve(root, 'capabilities', name), '\n'); expectFailure(root);
  }));
}
test('missing required runtime file fails instead of shrinking the hash set', () => fixture(root => {
  const p = path.join(root, 'capabilities/game-idle.mjs'); assert.ok(p.startsWith(root + path.sep)); fs.unlinkSync(p); expectFailure(root);
}));
test('package module-type drift fails even when name/version do not change', () => fixture(root => {
  const p = path.join(root, 'package.json'), pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.type = 'commonjs'; fs.writeFileSync(p, JSON.stringify(pkg)); expectFailure(root);
}));
for (const directory of ['.', 'vendor', 'vendor/github-slugger-2.0.0']) {
  test('adding a nested package scope fails: ' + directory, () => fixture(root => {
    const p = path.join(root, 'capabilities', directory, 'package.json');
    assert.ok(p.startsWith(root + path.sep)); fs.writeFileSync(p, '{"type":"commonjs"}\n', {flag: 'wx'});
    expectFailure(root);
  }));
}
test('source symlink outside the fixture is rejected', () => fixture(root => {
  const p = path.join(root, 'capabilities/game-idle.mjs'); assert.ok(p.startsWith(root + path.sep)); fs.unlinkSync(p);
  fs.symlinkSync(path.join(ROOT, 'capabilities/game-idle.mjs'), p); expectFailure(root);
}));
test('malformed JSON fails without printing the raw data', () => fixture(root => {
  const secret = 'fixture-private-sentinel'; fs.writeFileSync(path.join(root, 'capabilities/test-evidence.json'), '{' + secret);
  const run = invoke(root); assert.equal(run.status, 1); assert.doesNotMatch(run.stdout + run.stderr, new RegExp(secret));
}));
test('unknown/extra CLI arguments fail rather than being ignored', () => fixture(root => {
  for (const args of [[], ['--check', '--extra'], ['--unknown']]) assert.equal(invoke(root, args).status, 1);
}));
test('semantic object-key reordering does not manufacture a failure', () => fixture(root => {
  const r = read(root); r.evidence.counts = Object.fromEntries(Object.entries(r.evidence.counts).reverse()); write(root, r);
  assert.equal(invoke(root).status, 0);
}));

test('real assertion failure refuses write and preserves previous record bytes', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json'), before = fs.readFileSync(target);
  fs.writeFileSync(path.join(root, 'capabilities/operations.test.mjs'), "import {test} from 'node:test';test('deliberately failing synthetic fixture',()=>{throw Error('fixture assertion');});\n");
  const run = invoke(root, ['--write']); assert.equal(run.status, 1); assert.match(run.stderr, /process failed/);
  assert.deepEqual(fs.readFileSync(target), before);
  assert.equal(fs.readdirSync(path.dirname(target)).filter(x => x.startsWith('.omni-evidence-')).length, 0);
}));
test('real skipped contract refuses write and preserves previous record bytes', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json'), before = fs.readFileSync(target);
  fs.writeFileSync(path.join(root, 'capabilities/operations.test.mjs'), "import {test} from 'node:test';test.skip('synthetic skipped fixture',()=>{});\n");
  const run = invoke(root, ['--write']); assert.equal(run.status, 1); assert.match(run.stderr, /skipped/);
  assert.deepEqual(fs.readFileSync(target), before);
}));
test('Node TAP file-wrapper success for a blank suite refuses write', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json'), before = fs.readFileSync(target);
  fs.writeFileSync(path.join(root, 'capabilities/game-idle.test.mjs'), '');
  const run = invoke(root, ['--write']); assert.equal(run.status, 1);
  assert.match(run.stderr, /file-level result: capabilities\/game-idle\.test\.mjs/);
  assert.deepEqual(fs.readFileSync(target), before);
}));
test('changed inputs DURING a real test run refuse write', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json'), before = fs.readFileSync(target);
  fs.writeFileSync(path.join(root, 'capabilities/operations.test.mjs'), "import {test} from 'node:test';import fs from 'node:fs';test('synthetic concurrent mutation in owned copy',()=>fs.appendFileSync(new URL('./game-idle.mjs',import.meta.url),'\\n// changed during test\\n'));\n");
  const run = invoke(root, ['--write']); assert.equal(run.status, 1); assert.match(run.stderr, /changed during measurement/);
  assert.deepEqual(fs.readFileSync(target), before);
}));
test('concurrently changed evidence is not overwritten', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json');
  fs.writeFileSync(path.join(root, 'capabilities/operations.test.mjs'), "import {test} from 'node:test';import fs from 'node:fs';test('synthetic concurrent evidence writer',()=>fs.writeFileSync(new URL('./test-evidence.json',import.meta.url),'other-writer'));\n");
  const run = invoke(root, ['--write']); assert.equal(run.status, 1); assert.match(run.stderr, /changed concurrently/);
  assert.equal(fs.readFileSync(target, 'utf8'), 'other-writer');
}));
test('cooperating CLI writer is rejected at the commit boundary and can retry after release', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json');
  const prior = fs.readFileSync(target), rename = fs.renameSync;
  let contender;
  try {
    fs.renameSync = (from, to) => {
      assert.equal(to, target);
      contender = invoke(root, ['--write']);
      assert.deepEqual(fs.readFileSync(target), prior);
      return rename(from, to);
    };
    refreshEvidence(root);
  } finally { fs.renameSync = rename; }
  assert.equal(contender?.status, 1, contender?.stdout + contender?.stderr);
  assert.match(contender.stderr, /lock already exists/);
  assert.equal(invoke(root, ['--write']).status, 0);
}));
test('existing lock is never removed by a rejected invocation', () => fixture(root => {
  const lock = path.join(root, 'capabilities/.omni-evidence-write.lock');
  fs.mkdirSync(lock);
  const run = invoke(root, ['--write']);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /lock already exists/);
  assert.ok(fs.lstatSync(lock).isDirectory());
  assert.equal(invoke(root).status, 0);
}));
test('output symlink refuses overwrite and leaves its target alone', () => fixture(root => {
  const out = path.join(root, 'capabilities/test-evidence.json'), target = path.join(root, 'other.json');
  fs.writeFileSync(target, 'unrelated-owned-fixture'); assert.ok(out.startsWith(root + path.sep)); fs.unlinkSync(out); fs.symlinkSync(target, out);
  assert.equal(invoke(root, ['--write']).status, 1); assert.equal(fs.readFileSync(target, 'utf8'), 'unrelated-owned-fixture');
}));
test('TAP and spec parsing agree, reject missing/repeated summaries', () => {
  const expected = {tests: 2, pass: 2, fail: 0, cancelled: 0, skipped: 0, todo: 0};
  const summary = prefix => Object.entries(expected).map(([k, v]) => prefix + ' ' + k + ' ' + v).join('\n');
  assert.deepEqual(parseCounts(summary('#')), expected); assert.deepEqual(parseCounts(summary('ℹ')), expected);
  assert.throws(() => parseCounts('# tests 2')); assert.throws(() => parseCounts(summary('#') + '\n# pass 2'));
});
test('transport-failure injections are refused before writing (not real OS timeout/OOM proof)', () => fixture(root => {
  const target = path.join(root, 'capabilities/test-evidence.json'), before = fs.readFileSync(target);
  for (const result of [{status: null, signal: 'SIGTERM'}, {status: 0, error: {code: 'ETIMEDOUT'}}, {status: 0, stdout: ''}]) {
    assert.throws(() => refreshEvidence(root, {run: () => result})); assert.deepEqual(fs.readFileSync(target), before);
  }
}));
test('fresh --write executes real synthetic suites and passes independent --check', () => fixture(root => {
  const run = invoke(root, ['--write']); assert.equal(run.status, 0, run.stderr);
  assert.equal(read(root).evidence.counts.tests, CONTRACT_TEST_FILES.length);
  assert.equal(checkEvidence(read(root), root).check, 'PASS'); assert.equal(invoke(root).status, 0);
}));
test('all probes leave every real source and historical evidence byte unchanged', () => {
  for (const [p, hash] of Object.entries(sourceBefore)) assert.equal(sha(fs.readFileSync(p)), hash);
});
