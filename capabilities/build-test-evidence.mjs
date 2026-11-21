// Repository-only contract evidence. A positive record is bound to exact inputs
// and a successful, nonempty, zero-skip real test process; it is not a signed
// attestation, a coverage-quality proof, or a Host/real-service acceptance.
// Usage: node capabilities/build-test-evidence.mjs --check | --write
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {RUNTIME_FILES, CONTRACT_TEST_FILES} from './runtime-files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATOR = 'build-test-evidence.mjs';
const GENERATE_COMMAND = 'capabilities/build-test-evidence.mjs --write';
const COUNT_KEYS = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
const MATURITIES = ['verified', 'needs-dependency', 'method-only', 'uncovered'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = isDeepStrictEqual;
const keysEqual = (value, keys) => object(value) && same(Object.keys(value).sort(), [...keys].sort());
function fail(message) { throw Object.assign(new Error(message), {code: 'E_EVIDENCE'}); }
function parse(bytes, name) { try { return JSON.parse(String(bytes)); } catch { fail('Invalid JSON: ' + name); } }
function regular(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail('Expected a regular nonsymlink input file');
  return fs.readFileSync(file);
}
function inputPath(root, relative) {
  const absolute = path.resolve(root, 'capabilities', relative);
  const realRoot = fs.realpathSync(root);
  if (!absolute.startsWith(path.resolve(root) + path.sep) ||
      !fs.realpathSync(absolute).startsWith(realRoot + path.sep)) fail('Input escapes project root');
  return absolute;
}
function context(root) {
  root = path.resolve(root);
  const catalog = parse(regular(path.join(root, 'capabilities/catalog.json')), 'catalog');
  const pkg = parse(regular(path.join(root, 'package.json')), 'package manifest');
  if (pkg.name !== 'dsh-omni-mode' || typeof pkg.version !== 'string' || !pkg.version || pkg.type !== 'module') fail('Unexpected package identity or module type');
  if (catalog.package !== pkg.name || catalog.presetId !== 'omni' ||
      !Array.isArray(catalog.categories) || catalog.categories.length !== 10 ||
      !Array.isArray(catalog.operations) || catalog.operations.length === 0) fail('Invalid catalog identity or collections');
  const skills = catalog.categories.map(c => c?.skill);
  if (skills.some(s => typeof s !== 'string' || !/^omni-[a-z-]+$/.test(s)) || new Set(skills).size !== 10) fail('Invalid catalog skill inventory');
  const ids = new Set();
  for (const op of catalog.operations) {
    if (!object(op) || typeof op.id !== 'string' || !/^[a-z][a-z0-9.-]+$/.test(op.id) ||
        ids.has(op.id) || !MATURITIES.includes(op.maturity)) fail('Invalid or duplicate catalog operation');
    ids.add(op.id);
  }
  if (!catalog.operations.some(op => op.maturity === 'verified')) fail('No declared verified operation');
  // The vendored .js ESM files inherit the root package type. An added nested
  // package scope can change actual loading without changing any existing file.
  for (const directory of new Set(RUNTIME_FILES.map(file => path.dirname(file)))) {
    const relative = path.posix.join(directory, 'package.json');
    const scope = fs.lstatSync(path.join(root, 'capabilities', relative), {throwIfNoEntry: false});
    if (scope) fail('Unexpected nested runtime package scope: ' + relative);
  }
  // Parent-relative skill keys are produced only from this trusted, validated
  // inventory. A record never chooses paths: its complete key set must match.
  const names = [...new Set([
    ...RUNTIME_FILES, ...CONTRACT_TEST_FILES, 'source-excerpts.json', GENERATOR, '../package.json',
    ...skills.sort().map(skill => '../skills/' + skill + '/SKILL.md'),
  ])];
  const files = CONTRACT_TEST_FILES.map(file => 'capabilities/' + file);
  const argv = ['--test', '--test-reporter=tap', ...files];
  return {root, catalog, pkg, names, files, argv, command: 'node ' + argv.join(' ')};
}
function fingerprint(ctx) {
  return Object.fromEntries(ctx.names.map(name => [name, sha(regular(inputPath(ctx.root, name)))]));
}
export function expectedInputs(root = ROOT) { return context(root).names; }

// Accept either real Node TAP or spec summaries, but never guess absent values,
// merge summaries, accept repeated keys, or trust a zero process exit on its own.
export function parseCounts(output) {
  if (typeof output !== 'string') fail('Missing test output');
  const clean = output.replace(/\u001b\[[0-9;]*m/g, '');
  const counts = {};
  for (const key of COUNT_KEYS) {
    const matches = [...clean.matchAll(new RegExp('^(?:#|ℹ) ' + key + ' ([0-9]+)\\r?$', 'gm'))];
    if (matches.length !== 1) fail('Missing or repeated test summary: ' + key);
    const value = Number(matches[0][1]);
    if (!Number.isSafeInteger(value)) fail('Invalid test summary integer');
    counts[key] = value;
  }
  return counts;
}
function countsArePositive(counts) {
  return keysEqual(counts, COUNT_KEYS) && COUNT_KEYS.every(k => Number.isSafeInteger(counts[k]) && counts[k] >= 0) &&
    counts.tests > 0 && counts.pass === counts.tests &&
    counts.fail === 0 && counts.cancelled === 0 && counts.skipped === 0 && counts.todo === 0;
}
function operationRecord(op, files) {
  const verified = op.maturity === 'verified';
  return {
    id: op.id, installed: verified, maturity: op.maturity, accepted: verified,
    operationInvoked: 'not-checked', hostMounted: 'not-checked', realServiceAccepted: 'not-checked',
    evidence: verified ? {tests: files, testsExecuted: true, localContractTests: 'passed'} : null,
  };
}

export function checkEvidence(record, root = ROOT) {
  const problems = [];
  let ctx, currentHashes;
  try { ctx = context(root); currentHashes = fingerprint(ctx); }
  catch (error) { return {check: 'FAIL', problems: ['Cannot fingerprint all required inputs: ' + error.message]}; }
  const require = (condition, message) => { if (!condition) problems.push(message); };
  if (!object(record)) return {check: 'FAIL', problems: ['Evidence record must be an object']};
  require(keysEqual(record, ['schemaVersion', 'package', 'presetId', 'displayName', 'runtime', 'installed', 'hostMounted', 'accepted', 'generation', 'evidence', 'operations', 'note']), 'Unexpected or missing top-level fields');
  require(record.schemaVersion === 2 && record.package === ctx.pkg.name && record.presetId === 'omni' &&
    record.displayName === '全能模式' && record.runtime === 'standalone-node-cli', 'Evidence identity/version mismatch');
  require(record.installed === true && record.accepted === true && record.hostMounted === 'not-checked', 'Record is not an accepted local-only run');
  const gen = object(record.generation) ? record.generation : {};
  require(keysEqual(gen, ['generator', 'generatedAt', 'node', 'packageVersion']), 'Invalid generation metadata fields');
  require(gen.generator === GENERATE_COMMAND && gen.packageVersion === ctx.pkg.version, 'Generation identity/package version mismatch');
  require(typeof gen.generatedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(gen.generatedAt) &&
    Number.isFinite(Date.parse(gen.generatedAt)) && new Date(gen.generatedAt).toISOString() === gen.generatedAt, 'Invalid generation timestamp');
  require(typeof gen.node === 'string' && /^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(gen.node), 'Invalid recorded Node version');
  const ev = object(record.evidence) ? record.evidence : {};
  require(keysEqual(ev, ['command', 'hashedRelativeTo', 'hashes', 'node', 'executed', 'supported', 'missingTests', 'exitCode', 'signal', 'timedOut', 'counts', 'outputTail']), 'Invalid evidence fields');
  require(ev.command === ctx.command, 'Recorded command must name every exact contract suite once, with the actual reporter');
  require(ev.hashedRelativeTo === 'capabilities/', 'Unexpected hash base');
  require(keysEqual(ev.hashes, ctx.names), 'Missing, extra or empty required hash manifest');
  if (object(ev.hashes)) for (const name of ctx.names) {
    const value = ev.hashes[name];
    require(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && value === currentHashes[name], 'Hash mismatch: ' + name);
  }
  require(ev.node === gen.node, 'Node provenance disagrees');
  require(ev.executed === true && ev.supported === true && Array.isArray(ev.missingTests) && ev.missingTests.length === 0, 'Suites were not completely supported and executed');
  require(ev.exitCode === 0 && ev.signal === null && ev.timedOut === false, 'Test process did not complete successfully');
  require(countsArePositive(ev.counts), 'Contract counts must be positive, complete, and have no failures/cancellations/skips/todos');
  try { require(same(parseCounts(ev.outputTail), ev.counts), 'Recorded counts disagree with the actual summary tail'); }
  catch { problems.push('Missing, invalid or duplicated test summary tail'); }
  const expectedOps = ctx.catalog.operations.map(op => operationRecord(op, ctx.files));
  require(same(record.operations, expectedOps), 'Operation records must exactly match the full catalog and exact test provenance');
  require(keysEqual(record.note, ['zh', 'en']) && ['zh', 'en'].every(k => typeof record.note[k] === 'string' && record.note[k].trim()), 'Missing bilingual evidence boundary');
  return problems.length ? {check: 'FAIL', problems} : {
    check: 'PASS', verifiedOperations: expectedOps.filter(op => op.accepted).length,
    hashedFiles: ctx.names.length, counts: ev.counts,
    scope: 'hash freshness and consistent recorded local-contract execution, not signed proof or coverage quality',
  };
}

export function measure(root = ROOT, {run = spawnSync, timeout = 600000} = {}) {
  const ctx = context(root), before = fingerprint(ctx);
  const env = {...process.env, NODE_OPTIONS: ''}; delete env.NODE_TEST_CONTEXT;
  const result = run(process.execPath, ctx.argv, {cwd: ctx.root, env, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024});
  if (result.error || result.status !== 0 || result.signal != null) fail('Contract test process failed; original evidence was not changed');
  const counts = parseCounts(result.stdout);
  if (!countsArePositive(counts)) fail('Contract tests empty, failed, cancelled, skipped or todo; original evidence was not changed');
  // Node TAP reports a file with no registered tests as one successful file
  // subtest. Do not count that wrapper as exercising a contract.
  const fileLabels = new Set(ctx.files.flatMap(file => [file, './' + file, path.resolve(ctx.root, file)]));
  for (const m of result.stdout.matchAll(/^ok \d+ - (.+?)\r?$/gm)) {
    if (fileLabels.has(m[1])) fail('Contract file reported only a file-level result: ' + m[1]);
  }
  const afterCtx = context(root), after = fingerprint(afterCtx);
  if (!same(before, after) || !same(ctx.pkg, afterCtx.pkg)) fail('Inputs changed during measurement; original evidence was not changed');
  return {ctx, counts, hashes: before, output: result.stdout};
}
export function buildEvidence(root = ROOT, options = {}) {
  const {ctx, counts, hashes, output} = measure(root, options);
  const next = {
    schemaVersion: 2, package: ctx.pkg.name, presetId: 'omni', displayName: '全能模式',
    runtime: 'standalone-node-cli', installed: true, hostMounted: 'not-checked', accepted: true,
    generation: {generator: GENERATE_COMMAND, generatedAt: new Date().toISOString(), node: process.version, packageVersion: ctx.pkg.version},
    evidence: {command: ctx.command, hashedRelativeTo: 'capabilities/', hashes, node: process.version,
      executed: true, supported: true, missingTests: [], exitCode: 0, signal: null, timedOut: false,
      counts, outputTail: output.split('\n').slice(-60).join('\n')},
    operations: ctx.catalog.operations.map(op => operationRecord(op, ctx.files)),
    note: {
      zh: '仅限已记录Node环境中明确本地契约的实测；哈希覆盖运行文件、契约测试、来源片段、十个领域技能、包清单与生成器，并拒绝新增嵌套运行时包作用域。不是签名证明、覆盖质量或当前Host/账号/真实服务验收；不随安装包分发。',
      en: 'Measured explicit local contracts in the recorded Node environment; hashes cover runtime, contract suites, excerpts, ten skills, package manifest and this generator, rejecting additional nested runtime package scopes. Not signed proof, coverage-quality or current Host/account/real-service acceptance; repository-only.',
    },
  };
  const checked = checkEvidence(next, root);
  if (checked.check !== 'PASS') fail('Generated evidence is inconsistent: ' + checked.problems.join('; '));
  return next;
}
function outputSnapshot(file) {
  try { return regular(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function unchangedOutput(file, before) {
  const now = outputSnapshot(file);
  if (before === null ? now !== null : now === null || !before.equals(now)) fail('Evidence file changed concurrently; refusing overwrite');
}
export function refreshEvidence(root = ROOT, options = {}) {
  root = path.resolve(root);
  const dir = path.join(root, 'capabilities');
  if (!fs.lstatSync(dir).isDirectory()) fail('Expected a real capabilities directory');
  const out = path.join(dir, 'test-evidence.json');
  const lock = path.join(dir, '.omni-evidence-write.lock');
  const temp = path.join(dir, '.omni-evidence-' + randomUUID() + '.tmp');
  // Hold exclusive ownership through readback. A crashed process may leave the
  // lock behind; never guess it is stale or remove another writer's lock.
  try { fs.mkdirSync(lock, {mode: 0o700}); }
  catch (error) {
    if (error.code === 'EEXIST') fail('Evidence write lock already exists; another writer may be active');
    throw error;
  }
  let created = false;
  try {
    const previous = outputSnapshot(out);
    const next = buildEvidence(root, options), body = JSON.stringify(next, null, 2) + '\n';
    const fd = fs.openSync(temp, 'wx'); created = true;
    try { fs.writeFileSync(fd, body); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (checkEvidence(next, root).check !== 'PASS') fail('Inputs changed before commit; refusing stale evidence');
    unchangedOutput(out, previous);
    // Explicit --write authorizes atomic replacement. The lock protects other
    // cooperating generators, not arbitrary external writes to this directory.
    fs.renameSync(temp, out); created = false;
    if (regular(out).toString('utf8') !== body) fail('Evidence readback mismatch');
    return next;
  } finally {
    try {
      if (created) { try { fs.unlinkSync(temp); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
    } finally { fs.rmdirSync(lock); }
  }
}

export function main(args = process.argv.slice(2), root = ROOT) {
  if (args.length !== 1 || !['--check', '--write'].includes(args[0])) fail('Use --check or --write');
  if (args[0] === '--write') {
    const next = refreshEvidence(root);
    return {written: 'capabilities/test-evidence.json', counts: next.evidence.counts, hashes: Object.keys(next.evidence.hashes).length};
  }
  const current = parse(regular(path.join(root, 'capabilities/test-evidence.json')), 'test evidence');
  return checkEvidence(current, root);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = main(); console.log(JSON.stringify(report, null, 2));
    if (report.check === 'FAIL') process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({error: {code: 'E_EVIDENCE', message: String(error.message).slice(0, 2000)}}));
    process.exitCode = 1;
  }
}
