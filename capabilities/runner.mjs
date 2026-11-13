#!/usr/bin/env node
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { CapabilityError, fail } from './schema.mjs';
import { operations, runOperation } from './operations.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAX = 2 * 1024 * 1024;
async function readBounded(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { const stat = await handle.stat(); if (!stat.isFile()) fail('E_PATH', '仅接受普通文件 / Regular files only'); if (stat.size > MAX) fail('E_LIMIT', '输入超过2MiB / Input exceeds 2 MiB'); const buffer = Buffer.alloc(MAX + 1); let n = 0; while (n < buffer.length) { const r = await handle.read(buffer, n, buffer.length - n, null); if (!r.bytesRead) break; n += r.bytesRead; } if (n > MAX) fail('E_LIMIT', '输入超过2MiB / Input exceeds 2 MiB'); return buffer.subarray(0, n).toString('utf8'); } finally { await handle.close(); }
}
async function contained(file, root, output = false) {
  const resolved = path.resolve(file), parent = await fs.realpath(path.dirname(resolved));
  const canonical = path.join(parent, path.basename(resolved));
  if (!root) return canonical;
  const base = await fs.realpath(root), candidate = output ? canonical : await fs.realpath(canonical);
  const relative = path.relative(base, candidate); if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) fail('E_SCOPE', '路径超出显式root / Path outside explicit root'); return canonical;
}
// Atomic no-overwrite commit. Only this call's exclusively created temp is removed.
// --root prevents path mistakes, not malicious ancestor-symlink races (not a sandbox).
export async function writeNewOutput(dest, output, io = fs) {
  const parent = path.dirname(dest), canonical = await io.realpath(parent);
  if (canonical !== parent) fail('E_SCOPE', '输出父目录已改变 / Output parent changed');
  const temp = path.join(parent, `.omni-owned-${randomUUID()}.tmp`); let owned = false, createdDest = false, committed = false, handle;
  try {
    handle = await io.open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); owned = true;
    await handle.writeFile(output); await handle.sync(); const original = await handle.stat(); await handle.close(); handle = null;
    if (await io.realpath(parent) !== canonical) fail('E_SCOPE', '提交前输出父目录已改变 / Output parent changed before commit');
    await io.link(temp, dest); createdDest = true;
    const linked = await io.lstat(dest);
    if (!linked.isFile() || linked.isSymbolicLink() || linked.dev !== original.dev || linked.ino !== original.ino) fail('E_FILESYSTEM', '文件系统不支持已验证的硬链接提交 / Filesystem lacks verified hardlink commit semantics');
    if (!(await io.readFile(dest)).equals(Buffer.from(output))) fail('E_FILESYSTEM', '输出读回不一致 / Output readback mismatch');
    await io.unlink(temp); owned = false;
    if (!(await io.readFile(dest)).equals(Buffer.from(output))) fail('E_FILESYSTEM', '临时文件清理后输出失效 / Output failed after temporary cleanup');
    committed = true;
  } finally {
    if (handle) await handle.close().catch(() => {});
    if (createdDest && !committed) await io.unlink(dest);
    if (owned) await io.unlink(temp);
  }
}
function parse(args) {
  const [command, ...rest] = args, flags = {}, values = [];
  for (let i = 0; i < rest.length; i++) { const a = rest[i]; if (!a.startsWith('--')) { values.push(a); continue; } const key = a.slice(2); if (Object.hasOwn(flags, key)) fail('E_ARGUMENT', '参数重复 / Duplicate option'); if (['test', 'text', 'allow-write'].includes(key)) flags[key] = true; else if (['input', 'json', 'out', 'root'].includes(key) && rest[i + 1] && !rest[i + 1].startsWith('--')) flags[key] = rest[++i]; else fail('E_ARGUMENT', '未知参数或缺少值 / Unknown option or missing value'); }
  return { command, flags, values };
}
async function catalog() { return JSON.parse(await readBounded(path.join(HERE, 'catalog.json'))); }
async function doctor(test) {
  const c = await catalog(), hashes = {};
  for (const file of ['schema.mjs', 'operations.mjs', 'runner.mjs', 'catalog.json']) hashes[file] = createHash('sha256').update(await fs.readFile(path.join(HERE, file))).digest('hex');
  const testFiles = ['operations.test.mjs', 'runner.test.mjs', 'catalog.test.mjs'], missingTests = [];
  if (test) for (const file of testFiles) { try { hashes[file] = createHash('sha256').update(await fs.readFile(path.join(HERE, file))).digest('hex'); } catch (e) { if (e.code === 'ENOENT') missingTests.push(file); else throw e; } }
  const evidence = { command: 'node --test capabilities/operations.test.mjs capabilities/runner.test.mjs capabilities/catalog.test.mjs', hashes, node: process.version, executed: false, supported: missingTests.length === 0, missingTests, exitCode: null };
  if (test && !missingTests.length) {
    const result = await new Promise(resolve => {
      const child = spawn(process.execPath, ['--test', path.join(HERE, 'operations.test.mjs'), path.join(HERE, 'runner.test.mjs'), path.join(HERE, 'catalog.test.mjs')], { cwd: path.dirname(HERE), env: { ...process.env, NODE_OPTIONS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '', timedOut = false; const collect = data => { output = (output + data).slice(-24000); }; child.stdout.on('data', collect); child.stderr.on('data', collect);
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 30000);
      child.once('error', e => { clearTimeout(timer); resolve({ exitCode: null, error: e.message }); });
      child.once('close', (code, signal) => { clearTimeout(timer); resolve({ exitCode: code, signal, timedOut, output }); });
    }); Object.assign(evidence, result, { executed: true });
  }
  const accepted = evidence.executed && evidence.exitCode === 0;
  return { schemaVersion: 1, package: 'dsh-omni-mode', presetId: 'omni', displayName: '全能模式', runtime: 'standalone-node-cli', installed: true, hostMounted: 'not-checked', accepted: test ? accepted : 'not-tested-this-run', evidence, operations: c.operations.map(op => ({ id: op.id, installed: Boolean(operations[op.id]), maturity: operations[op.id] ? (accepted ? 'verified' : 'method-only') : op.maturity, accepted: operations[op.id] ? (test ? accepted : 'not-tested-this-run') : false, operationInvoked: 'not-checked', hostMounted: 'not-checked', realServiceAccepted: 'not-checked', evidence: operations[op.id] ? { tests: op.checks, testsExecuted: evidence.executed, localContractTests: test ? (accepted ? 'passed' : evidence.supported ? 'failed' : 'unsupported') : 'not-executed' } : null })), note: { zh: 'installed仅指本地CLI，不代表Host挂载/账户/外部工具验收；未运行测试不声称verified。测试只证明明确的本地契约。', en: 'installed means this local CLI, not Host mounting, accounts or external-tool acceptance. No verified claim without tests. Tests establish only the explicit local contracts.' } };
}
export async function main(args) {
  const { command, flags, values } = parse(args); let result;
  if (command === 'list') {
    if (values.length || Object.keys(flags).some(k => k !== 'out' && k !== 'allow-write' && k !== 'root')) fail('E_ARGUMENT', 'list参数无效 / Invalid list arguments');
    const c = await catalog(); result = { schemaVersion: 1, categories: c.categories, maturityStates: c.maturityStates, operations: c.operations };
  } else if (command === 'doctor' || command === 'status') {
    if (values.length || Object.keys(flags).some(k => !['test', 'out', 'allow-write', 'root'].includes(k))) fail('E_ARGUMENT', 'doctor参数无效 / Invalid doctor arguments'); result = await doctor(flags.test === true);
    if (flags.test && result.accepted !== true) process.exitCode = 1;
  } else if (command === 'run') {
    if (values.length !== 1 || Boolean(flags.input) === Boolean(flags.json) || flags.test) fail('E_ARGUMENT', 'run需要操作ID和input或json二选一 / run requires operation ID and exactly one of --input or --json');
    const raw = flags.input ? await readBounded(await contained(flags.input, flags.root)) : flags.json;
    if (Buffer.byteLength(raw) > MAX) fail('E_LIMIT', '输入超过2MiB / Input exceeds 2 MiB');
    let input; try { input = JSON.parse(raw); } catch { fail('E_JSON', 'JSON解析失败 / Invalid JSON'); }
    result = runOperation(values[0], input);
  } else fail('E_ARGUMENT', '用法 / Usage: node capabilities/runner.mjs list | doctor [--test] | run <id> (--input <json-file> | --json <json>) [--text] [--out <new-file> --allow-write] [--root <directory>]');
  const output = flags.text ? (typeof result.text === 'string' ? result.text : fail('E_OUTPUT', '操作没有文本输出 / Operation has no text output')) : JSON.stringify(result, null, 2) + '\n';
  if (Buffer.byteLength(output) > 8 * 1024 * 1024) fail('E_LIMIT', '输出超过8MiB / Output exceeds 8 MiB');
  if (flags.out) { if (!flags['allow-write']) fail('E_AUTHORIZATION', '写入需显式allow-write / Output requires --allow-write'); const dest = await contained(flags.out, flags.root, true); await writeNewOutput(dest, output); return { outputPath: dest }; }
  if (flags['allow-write']) fail('E_ARGUMENT', 'allow-write需要out / --allow-write requires --out');
  return { output };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(r => process.stdout.write(r.output ?? JSON.stringify(r) + '\n')).catch(e => { const error = e instanceof CapabilityError ? { code: e.code, message: e.message, path: e.path } : { code: e.code || 'E_INTERNAL', message: e.message }; process.stderr.write(JSON.stringify({ error }) + '\n'); process.exitCode = 1; });
}
