import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Never inherit real user/shared/bundled skill roots in a test child.
export function isolatedTestEnv(directory, inherited = process.env) {
  return { ...inherited,
    DSH_HOME: path.join(directory, 'home'),
    DSH_AGENTS_HOME: path.join(directory, 'agents'),
    DSH_BUNDLED_SKILL_DIR: path.join(directory, 'bundled'),
  };
}

// spawnSync/execFileSync already propagate failures. Keep this explicit check
// shared by worker consumers so signals, timeouts and bad reports stay fatal.
export function processReport(child, label, validate) {
  if (child.error || child.status !== 0 || child.signal) {
    throw new Error(`${label} worker failed: status=${child.status}, signal=${child.signal}, error=${child.error?.code ?? 'none'}`);
  }
  let report;
  try { report = JSON.parse(child.stdout); }
  catch { throw new Error(`${label} worker returned an invalid JSON report`); }
  if (!report || typeof report !== 'object' || Array.isArray(report) || !validate(report)) {
    throw new Error(`${label} worker returned an invalid report shape`);
  }
  return report;
}

// Match the native filesystem provider: remove the opening/closing YAML lines
// without normalizing body whitespace, then apply its final String.trim().
export function skillBody(raw) {
  const lines = raw.split('\n');
  if (lines[0].replace(/\r$/, '') !== '---') throw new Error('Skill is missing frontmatter');
  const end = lines.findIndex((line, index) => index > 0 && line.replace(/\r$/, '') === '---');
  if (end < 0) throw new Error('Skill frontmatter is unterminated');
  return lines.slice(end + 1).join('\n').trim();
}

export function verifyLockMetadata(manifest, lock) {
  const root = lock.packages?.[''];
  if (lock.version !== manifest.version || root?.version !== manifest.version) {
    throw new Error('Lock root versions must match the package manifest');
  }
  // engines.dsh may be an accepted set, so compare structurally rather than by
  // reference; a mismatch here means the lockfile and manifest disagree.
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (root.engines?.node !== manifest.engines.node || !same(root.engines?.dsh, manifest.engines.dsh)) {
    throw new Error('Lock root engines must match the package manifest');
  }
  // Check this known non-aliased dependency only; npm aliases and other
  // registry tarball naming conventions need not follow this basename.
  const sdk = lock.packages?.['node_modules/@agentclientprotocol/sdk'];
  if (!sdk || path.basename(new URL(sdk.resolved).pathname) !== `sdk-${sdk.version}.tgz`) {
    throw new Error('ACP SDK lock version must match its resolved tarball');
  }
}

export function verifyNodeGate(declared, official, current = process.versions.node) {
  const minimum = range => {
    const match = /^>=(\d+)\.(\d+)\.(\d+)$/.exec(range ?? '');
    if (!match) throw new Error('Unsupported Node engine range; update the explicit compatibility verifier');
    return match.slice(1).map(Number);
  };
  const compare = (a, b) => {
    for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] - b[index];
    return 0;
  };
  const own = minimum(declared), required = minimum(official);
  if (compare(own, required) < 0) throw new Error('Public Node minimum is below the official DSH CLI requirement');
  if (!/^\d+\.\d+\.\d+$/.test(current)) throw new Error('Unsupported current Node version format');
  if (compare(current.split('.').map(Number), own) < 0) throw new Error('Current Node does not satisfy the package Node minimum');
  return declared;
}

export function testRuntimeRequire() {
  if (process.env.DSH_TEST_BASE) {
    const base = path.resolve(process.env.DSH_TEST_BASE);
    if (!fs.existsSync(base)) throw new Error('DSH_TEST_BASE must point to an existing package.json');
    return createRequire(base);
  }
  const local = createRequire(new URL('../package.json', import.meta.url));
  try {
    return createRequire(local.resolve('@deepseek-ai/dsh/package.json'));
  } catch {
    throw new Error('Install development dependencies with npm ci, or set DSH_TEST_BASE to an existing Harness installation package.json.');
  }
}

export function linkRuntimePackages(requireRuntime, directory) {
  const names = new Set([
    ...Object.keys(requireRuntime('@deepseek-ai/dsh/package.json').dependencies ?? {}),
    ...Object.keys(requireRuntime('@deepseek-ai/dsh-base/package.json').dependencies ?? {}),
    '@deepseek-ai/dsh-base', '@deepseek-ai/dsh-cordis-host-runner',
    '@deepseek-ai/dsh-tool-cordis', '@deepseek-ai/dsh-agent-preset-registry',
    '@deepseek-ai/dsh-client-connection', '@deepseek-ai/dsh-workspace', '@deepseek-ai/dsh-schedule',
  ]);
  const scope = path.join(directory, 'node_modules', '@deepseek-ai');
  fs.mkdirSync(scope, { recursive: true });
  for (const name of names) {
    if (!name.startsWith('@deepseek-ai/')) continue;
    let manifest;
    try { manifest = requireRuntime.resolve(`${name}/package.json`); }
    catch { continue; } // Unused platform-specific packages need not be installed.
    fs.symlinkSync(path.dirname(manifest), path.join(scope, name.split('/')[1]), process.platform === 'win32' ? 'junction' : 'dir');
  }
}
