import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeNewOutput } from './runner.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const cli = (args, runner = path.join(HERE, 'runner.mjs')) => spawnSync(process.execPath, [runner, ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, NODE_OPTIONS: '' } });
async function fixture(fn) {
  const root = await fs.mkdtemp(path.join(HERE, '.test-'));
  try { return await fn(root); } finally { assert.equal(path.dirname(root), HERE); assert.ok(path.basename(root).startsWith('.test-')); await fs.rm(root, { recursive: true, force: true }); }
}
const json = JSON.stringify({ text: '>a\nGCGC', alphabet: 'dna' });
test('CLI list is machine-readable and contains actual closed input schemas', () => {
  const r = cli(['list']); assert.equal(r.status, 0, r.stderr); const d = JSON.parse(r.stdout); assert.equal(d.schemaVersion, 1); assert.equal(d.categories.length, 10); assert.ok(d.operations.find(x => x.id === 'molbio.fasta').inputs.required.includes('alphabet'));
});
test('CLI performs actual JSON-input FASTA computation', () => {
  const r = cli(['run', 'molbio.fasta', '--json', json]); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).records[0].gcFractionCanonical, 1);
});
test('CLI returns explicit errors for malformed, missing, unknown and oversized arguments', () => {
  for (const args of [['run', 'molbio.fasta', '--json', '{bad'], ['run', 'molbio.fasta'], ['run', 'bogus', '--json', '{}'], ['run', 'molbio.fasta', '--json', json, '--unknown'], ['list', '--json', '{}']]) {
    const r = cli(args); assert.equal(r.status, 1); assert.ok(JSON.parse(r.stderr).error.code.startsWith('E_'));
  }
});
test('explicit file read, root check, authorization and atomic no-overwrite output', async () => fixture(async root => {
  const input = path.join(root, 'input.json'), out = path.join(root, 'stats.json'); await fs.writeFile(input, json);
  const no = cli(['run', 'molbio.fasta', '--input', input, '--out', out]); assert.equal(JSON.parse(no.stderr).error.code, 'E_AUTHORIZATION'); await assert.rejects(fs.stat(out), { code: 'ENOENT' });
  const yes = cli(['run', 'molbio.fasta', '--input', input, '--root', root, '--out', out, '--allow-write']); assert.equal(yes.status, 0, yes.stderr); assert.equal(JSON.parse(await fs.readFile(out)).records[0].length, 4);
  const again = cli(['run', 'molbio.fasta', '--input', input, '--out', out, '--allow-write']); assert.equal(JSON.parse(again.stderr).error.code, 'EEXIST'); assert.equal(JSON.parse(await fs.readFile(out)).records[0].length, 4); assert.equal((await fs.readdir(root)).filter(f => f.startsWith('.omni-owned-')).length, 0);
}));
test('CLI rejects symlink leaf, root escape and non-regular input', async () => fixture(async root => {
  const inside = path.join(root, 'inside'); await fs.mkdir(inside); const outside = path.join(root, 'outside.json'); await fs.writeFile(outside, json); const link = path.join(inside, 'link.json'); await fs.symlink(outside, link);
  assert.equal(JSON.parse(cli(['run', 'molbio.fasta', '--input', outside, '--root', inside]).stderr).error.code, 'E_SCOPE');
  assert.equal(JSON.parse(cli(['run', 'molbio.fasta', '--input', link]).stderr).error.code, 'ELOOP');
  assert.equal(JSON.parse(cli(['run', 'molbio.fasta', '--input', inside]).stderr).error.code, 'E_PATH');
}));
test('CLI rejects file larger than 2MiB before parsing', async () => fixture(async root => {
  const input = path.join(root, 'large.json'); await fs.writeFile(input, 'x'.repeat(2 * 1024 * 1024 + 1)); assert.equal(JSON.parse(cli(['run', 'molbio.fasta', '--input', input]).stderr).error.code, 'E_LIMIT');
}));
test('CLI text output writes actual UTC ICS, not a claim wrapper', async () => fixture(async root => {
  const out = path.join(root, 'calendar.ics'); const input = { events: [{ uid: '1@local', summary: 'Review', start: '2026-11-20T01:00:00Z', end: '2026-11-20T02:00:00Z' }] };
  const r = cli(['run', 'assistant.ics', '--json', JSON.stringify(input), '--text', '--out', out, '--allow-write']); assert.equal(r.status, 0, r.stderr); const content = await fs.readFile(out, 'utf8'); assert.ok(content.startsWith('BEGIN:VCALENDAR\r\n')); assert.ok(content.includes('DTSTART:20261120T010000Z'));
}));
test('owned temp is removed after simulated partial ENOSPC and destination stays absent', async () => fixture(async root => {
  const dest = path.join(root, 'failed.txt');
  const io = { ...fs, open: async (...args) => { const h = await fs.open(...args); return { writeFile: async data => { await h.writeFile(data.slice(0, 2)); throw Object.assign(new Error('simulated disk full'), { code: 'ENOSPC' }); }, sync: () => h.sync(), close: () => h.close() }; } };
  await assert.rejects(writeNewOutput(dest, 'abcdef', io), { code: 'ENOSPC' }); await assert.rejects(fs.stat(dest), { code: 'ENOENT' }); assert.deepEqual(await fs.readdir(root), []);
}));
test('hardlink commit verifies regular type, same inode and content after temp unlink', async () => fixture(async root => {
  const dest = path.join(root, 'committed.txt'); await writeNewOutput(dest, 'owned-probe'); const stat = await fs.lstat(dest); assert.equal(stat.isSymbolicLink(), false); assert.equal(stat.isFile(), true); assert.equal(await fs.readFile(dest, 'utf8'), 'owned-probe'); assert.deepEqual(await fs.readdir(root), ['committed.txt']);
}));
test('simulated symlink-emulating link fails closed and removes only its owned outputs', async () => fixture(async root => {
  const dest = path.join(root, 'unsupported.txt'), io = { ...fs, link: (source, target) => fs.symlink(source, target) };
  await assert.rejects(writeNewOutput(dest, 'probe', io), e => e.code === 'E_FILESYSTEM'); assert.deepEqual(await fs.readdir(root), []);
}));
test('normal doctor is honest about installed versus tests/Host/service acceptance', () => {
  const r = cli(['status']); assert.equal(r.status, 0, r.stderr); const d = JSON.parse(r.stdout); assert.equal(d.installed, true); assert.equal(d.accepted, 'not-tested-this-run'); assert.equal(d.hostMounted, 'not-checked'); assert.equal(d.evidence.executed, false);
  for (const op of d.operations) { assert.equal(op.operationInvoked, 'not-checked'); assert.equal(op.realServiceAccepted, 'not-checked'); if (op.installed) { assert.equal(op.maturity, 'method-only'); assert.equal(op.evidence.testsExecuted, false); assert.equal(Object.hasOwn(op.evidence, 'liveRun'), false); } }
});
test('runtime-only copied package status works without optional test files', async () => fixture(async root => {
  const cap = path.join(root, 'capabilities'); await fs.mkdir(cap);
  for (const file of ['runner.mjs', 'schema.mjs', 'operations.mjs', 'catalog.json']) await fs.copyFile(path.join(HERE, file), path.join(cap, file));
  const r = cli(['doctor'], path.join(cap, 'runner.mjs')); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).accepted, 'not-tested-this-run');
  const noTests = cli(['doctor', '--test'], path.join(cap, 'runner.mjs')); assert.equal(noTests.status, 1); const d = JSON.parse(noTests.stdout); assert.equal(d.accepted, false); assert.equal(d.evidence.supported, false); assert.equal(d.evidence.executed, false); assert.equal(d.evidence.missingTests.length, 3);
}));
test('package-contained operation/catalog tests need no research/cache/third-party modules', async () => fixture(async root => {
  const cap = path.join(root, 'capabilities'); await fs.mkdir(cap);
  for (const file of ['runner.mjs', 'schema.mjs', 'operations.mjs', 'catalog.json', 'source-excerpts.json', 'operations.test.mjs', 'catalog.test.mjs']) await fs.copyFile(path.join(HERE, file), path.join(cap, file));
  await fs.cp(path.join(HERE, '..', 'skills'), path.join(root, 'skills'), { recursive: true, filter: src => { const rel = path.relative(path.join(HERE, '..', 'skills'), src); return !rel || ['omni-engineering', 'omni-game', 'omni-cyber', 'omni-documents', 'omni-fiction', 'omni-research', 'omni-personalization', 'omni-assistant', 'omni-molbio', 'omni-business'].includes(rel.split(path.sep)[0]); } });
  const r = spawnSync(process.execPath, ['--test', path.join(cap, 'operations.test.mjs'), path.join(cap, 'catalog.test.mjs')], { cwd: root, encoding: 'utf8', timeout: 15000, env: { PATH: process.env.PATH, NODE_OPTIONS: '' } }); assert.equal(r.status, 0, r.stdout + r.stderr);
}));
