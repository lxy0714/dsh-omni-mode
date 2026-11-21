// Maintainer-only first-attempt infrastructure. Does not resolve credentials or
// call a provider. Use only under a fresh, private, durable project directory.
import fs from 'node:fs';
import path from 'node:path';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';

const variants = new Set(['baseline', 'candidate']);
const statuses = new Set(['stop','tool-calls','max-tokens','aborted','error','interrupted','missing-finish']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const validKey = value => typeof value === 'string' && /^[a-z][a-z0-9-]{1,62}(?![\s\S])/.test(value);

function syncDir(directory) {
  const fd = fs.openSync(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function writeNew(file, data) {
  const bytes = Buffer.from(JSON.stringify(data) + '\n');
  const fd = fs.openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  syncDir(path.dirname(file));
  return sha(bytes);
}
function read(file) {
  const fd = fs.openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile() || st.size > 8 * 1024 * 1024) throw Error('invalid journal entry');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}
function storePath(root, caseId, variant) {
  if (!validKey(caseId) || !variants.has(variant)) throw Error('unknown journal arm');
  if (!path.isAbsolute(root) || fs.realpathSync(root) !== root) throw Error('expected absolute non-aliased journal root');
  return path.join(root, `${caseId}.${variant}`);
}
const num = n => String(n).padStart(2, '0');

export function claimPrimaryArm(root, caseId, variant, frozenSha256) {
  if (typeof frozenSha256 !== 'string' || !/^[0-9a-f]{64}(?![\s\S])/.test(frozenSha256)) throw Error('invalid experiment digest');
  const dir = storePath(root, caseId, variant);
  // This is a permanent exclusive primary reservation, not an expiring lock.
  // A crash before writing the intent is still indeterminate and never replayed.
  fs.mkdirSync(dir, { mode: 0o700 });
  syncDir(root);
  const identity = { caseId, variant, frozenSha256 };
  writeNew(path.join(dir, '00.arm-intent.json'), identity);
  let callCount = 0, active = false, failed = false, closed = false;
  function beginCall() {
    if (active || failed || closed || callCount >= 24) throw Error('primary call cannot begin');
    const call = ++callCount;
    active = true;
    writeNew(path.join(dir, `${num(call)}.call-intent.json`), { call });
    return function endCall(kind) {
      if (!active || callCount !== call || !statuses.has(kind)) throw Error('invalid call terminal receipt');
      writeNew(path.join(dir, `${num(call)}.call-terminal.json`), { call, kind });
      active = false;
      failed = ['aborted', 'error', 'interrupted', 'missing-finish', 'max-tokens'].includes(kind);
    };
  }
  function recordArm(receipt) {
    if (closed || active || !receipt || receipt.variant !== variant || receipt.modelCalls !== callCount || callCount < 1) throw Error('invalid arm receipt');
    // If writing fails, the primary remains reserved and cannot be retried.
    closed = true;
    const digest = writeNew(path.join(dir, 'arm-result.json'), receipt);
    writeNew(path.join(dir, 'arm-terminal.json'), { callCount, resultSha256: digest });
    return digest;
  }
  return Object.freeze({ beginCall, recordArm });
}

export function inspectPrimaryArm(root, caseId, variant, frozenSha256) {
  const dir = storePath(root, caseId, variant);
  try { if (!fs.lstatSync(dir).isDirectory()) return { state: 'unknown' }; }
  catch (error) { return { state: error.code === 'ENOENT' ? 'unstarted' : 'unknown' }; }
  try {
    const names = new Set(fs.readdirSync(dir));
    function record(name) {
      if (!names.delete(name)) throw Error('missing journal entry');
      return JSON.parse(read(path.join(dir, name)));
    }
    const arm = record('00.arm-intent.json');
    if (arm.caseId !== caseId || arm.variant !== variant || arm.frozenSha256 !== frozenSha256 || Object.keys(arm).length !== 3) throw Error('wrong freeze or arm');
    const term = record('arm-terminal.json');
    const { callCount, resultSha256 } = term;
    if (Object.keys(term).length !== 2 || !Number.isInteger(callCount) || callCount < 1 || callCount > 24 || typeof resultSha256 !== 'string') throw Error('invalid arm receipt');
    const calls = [];
    for (let n = 1; n <= callCount; n++) {
      const intent = record(`${num(n)}.call-intent.json`), terminal = record(`${num(n)}.call-terminal.json`);
      if (intent.call !== n || terminal.call !== n || Object.keys(intent).length !== 1 || Object.keys(terminal).length !== 2 || !statuses.has(terminal.kind)) throw Error('invalid call receipt');
      calls.push(terminal.kind);
    }
    if (!names.delete('arm-result.json') || names.size) throw Error('unexpected journal membership');
    const bytes = read(path.join(dir, 'arm-result.json'));
    if (sha(bytes) !== resultSha256) throw Error('arm result bytes changed');
    const result = JSON.parse(bytes);
    if (result.variant !== variant || result.modelCalls !== callCount) throw Error('wrong result identity');
    // The grading layer must still replay the whole result and check strict
    // primary criteria. A journal receipt is not itself a passing evaluation.
    return { state: 'recorded', calls, result, resultSha256 };
  } catch {
    // Refuse to reason from partial data or to silently resume this primary.
    return { state: 'unknown' };
  }
}

export function journaledStream(serverStream, arm) {
  return async function* stream(options) {
    const end = arm.beginCall(); // fsync completed before invoking transport.
    let terminal;
    let exhausted = false;
    try {
      for await (const chunk of serverStream(options)) {
        if (chunk.type === 'finish') {
          const kind = chunk.reason?.kind;
          terminal = terminal || !statuses.has(kind) ? 'error' : kind;
        }
        yield chunk;
      }
      exhausted = true;
    } finally {
      end(exhausted ? (terminal ?? 'missing-finish') : 'interrupted');
    }
  };
}
