// Maintainer metadata tests, deliberately not required by runtime-only consumers.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { operations } from './operations.mjs';
import { makeNativeCatalogEntries, refreshNativeCatalog } from './catalog-native.mjs';
const catalogURL = new URL('./catalog.json', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(catalogURL));
test('native metadata matches the closed executable schemas without elevating whole domains', () => {
  const entries = makeNativeCatalogEntries(catalog.categories); assert.equal(entries.length, 20);
  for (const entry of entries) { assert.deepEqual(entry.inputs, operations[entry.id].inputSchema); assert.equal(entry.maturity, 'verified'); assert.ok(entry.requiredTools.includes('Node.js >=24.9.0')); assert.match(entry.maturityMeaning.en, /local operation contract/); }
  assert.ok(entries.find(x => x.id === 'documents.audit').scope.en.includes('footnotes'));
});
test('native refresh retains every source-provenance field and non-executable extra unchanged', () => {
  const old = JSON.stringify(catalog), next = refreshNativeCatalog(catalog);
  assert.equal(JSON.stringify(catalog), old);
  assert.deepEqual({ ...next, operations: null }, { ...catalog, operations: null });
  assert.deepEqual(next.operations.filter(x => !Object.hasOwn(operations, x.id)), catalog.operations.filter(x => !Object.hasOwn(operations, x.id)));
  assert.equal(next.operations.length, 32); assert.equal(next.sourceRefs.length, 100); assert.equal(next.evidence.independentProjects, 63);
  assert.deepEqual(refreshNativeCatalog(next), next);
});
test('metadata results do not expose mutable registry schemas or category source arrays', () => {
  const originalSchemas = JSON.stringify(Object.values(operations).map(x => x.inputSchema)), originalCategories = JSON.stringify(catalog.categories);
  const entries = makeNativeCatalogEntries(catalog.categories); entries[0].inputs.properties.extra = { type: 'string' }; entries[0].sourceRefs.push('local-mutator');
  assert.equal(JSON.stringify(Object.values(operations).map(x => x.inputSchema)), originalSchemas); assert.equal(JSON.stringify(catalog.categories), originalCategories);
});
test('native refresh refuses a changed source baseline and unregistered verified declarations', () => {
  const bad = structuredClone(catalog); bad.evidence.selectedConfigurations = 99; assert.throws(() => refreshNativeCatalog(bad), /baseline/);
  const unknown = structuredClone(catalog); unknown.operations.push({ id: 'unregistered.fake', maturity: 'verified' }); assert.throws(() => refreshNativeCatalog(unknown), /Unregistered verified/);
});
test('source generator rejects an unapproved refresh before modifying catalog bytes', () => {
  const before = fs.readFileSync(catalogURL), p = spawnSync(process.execPath, [fileURLToPath(new URL('./build-catalog.mjs', import.meta.url)), '--refresh-native'], { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });
  assert.equal(p.status, 1); assert.match(p.stderr, /requires only/); assert.ok(fs.readFileSync(catalogURL).equals(before));
});
