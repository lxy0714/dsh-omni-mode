import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { styleDraftSchemas, styleDraftImplementations } from './style-draft.mjs';
const id = 'personalization.style-draft';
const run = input => styleDraftImplementations[id](input);
const defaults = { length: 'default', tone: 'default', structure: 'default' };
const requested = { length: 'concise', tone: 'direct', structure: 'bullets' };
const draft = (changes = {}) => ({ action: 'draft', scope: 'current-task', consent: true, current: { ...defaults }, proposed: { ...requested }, ...changes });
const restore = (result, changes = {}) => ({ action: 'revert', scope: result.scope, current: { ...result.proposedState }, undo: structuredClone(result.undo), ...changes });
const rejected = fn => assert.throws(fn, err => err.code === 'E_SCHEMA');

function unapplied(r) {
  assert.equal(r.memoryWritten, false);
  assert.equal(r.profileChanged, false);
  assert.equal(r.rulesApplied, false);
}
test('explicit consent yields only a bilingual scoped draft and an undo declaration', () => {
  const input = draft(), snapshot = structuredClone(input); validate(styleDraftSchemas[id], input);
  const r = run(input); assert.deepEqual(input, snapshot);
  assert.equal(r.scope, 'current-task'); assert.equal(r.status, 'draft');
  assert.deepEqual(r.proposedState, requested);
  assert.deepEqual(r.undo, { scope: 'current-task', expectedCurrent: requested, restore: defaults });
  assert.deepEqual(r.rules.map(x => [x.dimension, x.value]), [['length','concise'],['tone','direct'],['structure','bullets']]);
  for (const row of r.rules) { assert.match(row.zh, /\p{Script=Han}/u); assert.match(row.en, /[A-Za-z]/); }
  r.undo.restore.length = 'detailed'; assert.deepEqual(input, snapshot);
  unapplied(r);
});
test('negative consent generates neither rules nor an undo record', () => {
  const r = run(draft({ consent: false })); assert.equal(r.status, 'consent-required');
  assert.deepEqual(r.rules, []); assert.equal(r.proposedState, null); assert.equal(r.undo, null); unapplied(r);
});
test('missing or untyped consent fails rather than being inferred', () => {
  const missing = draft(); delete missing.consent;
  rejected(() => run(missing));
  for (const value of ['yes', 1, null]) rejected(() => run(draft({ consent: value })));
});
test('a matching current declaration produces a restore draft without applying it', () => {
  const r = run(restore(run(draft())));
  assert.equal(r.status, 'revert-draft'); assert.deepEqual(r.proposedState, defaults); assert.equal(r.undo, null); unapplied(r);
});
test('stale undo or a different scope cannot overwrite the supplied current choices', () => {
  const r = run(draft());
  for (const changes of [{ current: { ...requested, tone: 'warm' } }, { scope: 'current-draft' }]) {
    const conflict = run(restore(r, changes));
    assert.equal(conflict.status, 'undo-conflict'); assert.equal(conflict.proposedState, null);
    assert.deepEqual(conflict.rules, []); assert.equal(conflict.undo, null); unapplied(conflict);
  }
});
test('modes require their exact field sets and never accept global scope', () => {
  const r = run(draft());
  rejected(() => run(draft({ undo: r.undo }))); rejected(() => run(restore(r, { consent: true })));
  rejected(() => run(restore(r, { proposed: requested }))); rejected(() => run(draft({ scope: 'profile' })));
  const missing = restore(r); delete missing.undo; rejected(() => run(missing));
});
test('draft does not accept free-form prompts, identities or unknown preference dimensions', () => {
  const secret = 'privacy-marker-long-personal-value';
  for (const input of [draft({ proposed: { ...requested, tone: secret } }), draft({ proposed: { ...requested, [secret]: 'x' } })]) {
    assert.throws(() => run(input), err => err.code === 'E_SCHEMA' && !`${err.path} ${err.message}`.includes(secret));
  }
});
test('direct callers cannot inject getters, proxies or sparse/non-JSON containers', () => {
  let called = 0;
  const dangerous = { ...requested, get tone() { called++; return 'warm'; } };
  rejected(() => run(draft({ proposed: dangerous })));
  rejected(() => run(draft({ proposed: new Proxy(requested, { ownKeys() { called++; return []; } }) })));
  rejected(() => run(draft({ proposed: Object.create(requested) })));
  rejected(() => run(draft({ proposed: [] })));
  assert.equal(called, 0);
});
test('every allowed rule tuple round-trips across distinct previous states in both scopes', () => {
  const combinations = ['default','concise','detailed'].flatMap(length => ['default','neutral','warm','direct'].flatMap(tone =>
    ['default','paragraphs','bullets','steps'].map(structure => ({ length,tone,structure }))));
  for (const scope of ['current-task','current-draft']) for (const current of combinations) for (const proposed of combinations) {
    const r = run(draft({ current, proposed, scope }));
    assert.deepEqual(r.proposedState, proposed);
    assert.deepEqual(run(restore(r)).proposedState, current);
  }
});
