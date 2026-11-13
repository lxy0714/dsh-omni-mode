// Fail when a documented current-state claim no longer matches measured reality.
// Historical changelog entries are exempt: they describe what was true then.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const countTests = files => {
  const r = spawnSync(process.execPath, ['--test', ...files], {cwd: ROOT, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024});
  const m = /^# pass (\d+)$/m.exec(r.stdout ?? '') ?? /^ℹ pass (\d+)$/m.exec(r.stdout ?? '');
  assert.ok(m, 'could not read a pass count from the test run');
  assert.equal(r.status, 0, 'the suite this claim describes must pass');
  return Number(m[1]);
};

const suite = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts.test.match(/node --test (.+)$/)[1].trim().split(/\s+/);
const repoPassed = countTests(suite);
const capabilityPassed = countTests(['capabilities/operations.test.mjs', 'capabilities/runner.test.mjs', 'capabilities/catalog.test.mjs']);

// Docs that describe the current state, not history.
const current = ['README.md', 'README.en.md', 'docs/verification.md', 'docs/release-notes.md',
  'docs/enhancement-evidence.md', 'docs/domain-capabilities.md'];
const claims = [];
for (const file of current) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const m of text.matchAll(/(\d+)\s*(?:项仓库测试|repository tests)/g)) claims.push({file, kind: 'repo', value: Number(m[1])});
  for (const m of text.matchAll(/(\d+)\s*(?:项(?:领域)?能力契约测试|项本地契约测试|capability contract tests|local contract tests)/g)) claims.push({file, kind: 'capability', value: Number(m[1])});
}
assert.ok(claims.length > 0, 'expected at least one numeric claim to verify');

const wrong = claims.filter(c => c.value !== (c.kind === 'repo' ? repoPassed : capabilityPassed));
assert.deepEqual(wrong, [], `documented claims disagree with measured counts (repo=${repoPassed}, capability=${capabilityPassed})`);
console.log(JSON.stringify({claims: 'PASS', checked: claims.length, repoPassed, capabilityPassed, files: current.length}));
