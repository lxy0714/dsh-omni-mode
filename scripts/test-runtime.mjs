import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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
