// Package-contained metadata/skill tests. No research directory or external cache needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { operations } from './operations.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(await fs.readFile(path.join(HERE, 'catalog.json')));
const excerpts = JSON.parse(await fs.readFile(path.join(HERE, 'source-excerpts.json')));
const states = ['verified', 'needs-dependency', 'method-only', 'uncovered'];
const bilingual = x => { assert.equal(typeof x?.zh, 'string'); assert.equal(typeof x?.en, 'string'); assert.ok(x.zh.length > 0 && x.en.length > 0); };
test('catalog identity, four maturity states and exact approved ten-domain partition', () => {
  assert.equal(catalog.schemaVersion, 1); assert.equal(catalog.package, 'dsh-omni-mode'); assert.equal(catalog.presetId, 'omni'); assert.equal(catalog.displayName, '全能模式'); assert.deepEqual(Object.keys(catalog.maturityStates).sort(), [...states].sort());
  assert.deepEqual(Object.fromEntries(catalog.categories.map(c => [c.id, c.sourceRefs.length])), { engineering: 60, game: 10, cyber: 6, documents: 4, fiction: 3, research: 4, personalization: 6, assistant: 4, molbio: 1, business: 2 });
  assert.equal(catalog.sourceRefs.length, 100); assert.equal(new Set(catalog.sourceRefs.map(s => s.id)).size, 100); assert.equal(new Set(catalog.sourceRefs.map(s => s.sourceId)).size, 63);
  assert.equal(new Set(catalog.categories.flatMap(c => c.sourceRefs)).size, 100);
});
test('every source preserves exact package/config keys, pins, learning points and hashed file references', () => {
  const sourceMap = new Map(catalog.sourceRefs.map(s => [s.id, s])); const excerptMap = new Map(excerpts.excerpts.map(e => [e.id, e]));
  for (const category of catalog.categories) { bilingual(category.label); bilingual(category.description); for (const id of category.sourceRefs) assert.equal(sourceMap.get(id)?.domain, category.id); }
  for (const s of catalog.sourceRefs) {
    assert.equal(s.id, `${s.package}#${s.configId}`); assert.equal(s.fullInventoryMatched, true); assert.equal(s.runtimeAccepted, false); assert.match(s.configSha256, /^[a-f0-9]{64}$/); assert.match(s.substantiveSha256, /^[a-f0-9]{64}$/); assert.match(s.tarballSha256, /^[a-f0-9]{64}$/); assert.ok(s.pin); bilingual(s.learningPoint); bilingual(s.selectedReason); assert.ok(s.evidence.length > 0);
    for (const e of s.evidence) { assert.match(e.sha256, /^[a-f0-9]{64}$/); assert.ok(e.url.startsWith('https://')); const original = excerptMap.get(e.excerptId); assert.equal(original.sha256, e.sha256); assert.equal(original.execution, 'static-text-only-never-imported'); assert.ok(original.excerpt.length <= 2400); }
  }
});
test('all eleven implemented operation schemas equal catalog schemas; maturity is bounded to contracts', () => {
  for (const [id, op] of Object.entries(operations)) { const entry = catalog.operations.find(o => o.id === id); assert.ok(entry); assert.equal(entry.maturity, 'verified'); assert.deepEqual(entry.inputs, op.inputSchema); assert.ok(entry.checks.includes('capabilities/operations.test.mjs')); bilingual(entry.maturityMeaning); }
  assert.equal(catalog.operations.filter(o => o.maturity === 'verified').length, 11);
});
test('all catalog operations disclose inputs/outputs/checks/tools/risk/scope/sources/skills bilingually', () => {
  const refs = new Set(catalog.sourceRefs.map(s => s.id));
  for (const op of catalog.operations) { assert.ok(states.includes(op.maturity)); bilingual(op.label); bilingual(op.method); bilingual(op.risk); bilingual(op.scope); assert.ok(op.inputs && op.outputs); assert.ok(Array.isArray(op.checks)); assert.ok(op.requiredTools.length > 0); assert.ok(op.skills.length > 0); for (const id of op.sourceRefs) assert.ok(refs.has(id)); if (!operations[op.id]) assert.notEqual(op.maturity, 'verified'); }
  const media = catalog.operations.find(o => o.id === 'media.code'); assert.equal(media.maturity, 'needs-dependency'); assert.deepEqual(media.skills, ['omni-code-media']);
  assert.equal(catalog.operations.find(o => o.id === 'molbio.advanced').maturity, 'uncovered'); assert.equal(catalog.operations.find(o => o.id === 'unknown.grounded-fallback').maturity, 'uncovered');
});
test('ten skill files are distinct bilingual specialist instructions with matching frontmatter', async () => {
  const bodies = new Set();
  for (const c of catalog.categories) { const body = await fs.readFile(path.join(HERE, '..', 'skills', c.skill, 'SKILL.md'), 'utf8'); assert.ok(body.startsWith(`---\nname: ${c.skill}\n`)); assert.match(body, /description: .+ \/ .+/); assert.match(body, /[\u4e00-\u9fff]/u); assert.match(body, /[A-Za-z]{4}/); assert.ok(body.length > 1800); assert.ok(body.includes('验收')); assert.ok(body.includes('来源')); assert.ok(body.includes('../../capabilities/')); bodies.add(body); }
  assert.equal(bodies.size, 10);
});
test('native runtime imports only authored local modules and Node builtins', async () => {
  for (const file of ['operations.mjs', 'schema.mjs', 'runner.mjs']) { const body = await fs.readFile(path.join(HERE, file), 'utf8'); assert.doesNotMatch(body, /\b(?:eval|new Function)\s*\(/); assert.doesNotMatch(body, /\bimport\s*\(/); const imports = [...body.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1]); for (const spec of imports) assert.ok(spec.startsWith('node:') || ['./schema.mjs', './operations.mjs'].includes(spec), spec); }
});
