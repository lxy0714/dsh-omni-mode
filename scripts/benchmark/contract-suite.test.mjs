import test from 'node:test';
import assert from 'node:assert/strict';
import {makeContractSuite} from './contract-suite.mjs';

function fixture() {
  const source = {schemaVersion: 1, cases: [{id: 'fixture-01', category: 'synthetic', prompt: {zh: '读取输入并交付。', en: 'Read input and deliver.'},
    files: {'input.json': '[3,4]'}, sources: [], userAnswers: ['USER_REPLY_ONLY'], tools: ['fixture_read'],
    expected: {rules: [{value: 'PRIVATE_ORACLE_CANARY'}], referenceFiles: {'result.json': 'GOLDEN_ARTIFACT_CANARY'}}}]};
  const manifest = {schemaVersion: 1, id: 'original40-explicit-contract-v2', common: {zh: '数值必须是JSON数值。', en: 'Numbers are JSON numbers.'},
    cases: [{id: 'fixture-01', contract: {zh: '输出对象的rows字段为数组。', en: 'The output object has an array-valued rows field.'}}]};
  return {source, manifest, build: () => makeContractSuite(JSON.stringify(source), JSON.stringify(manifest))};
}

test('new version appends the same public contract to both languages without changing original evidence or grader', () => {
  const {source, build} = fixture();
  const before = JSON.stringify(source), built = build();
  assert.equal(JSON.stringify(source), before);
  const {prompt: oldPrompt, ...oldRest} = source.cases[0];
  const {prompt: newPrompt, ...newRest} = built.suite.cases[0];
  assert.deepEqual(newRest, oldRest);
  assert.ok(newPrompt.zh.startsWith(oldPrompt.zh));
  assert.ok(newPrompt.en.startsWith(oldPrompt.en));
  assert.equal(built.suite.protocol.historicalResultsChanged, false);
  assert.equal(built.suite.protocol.outcomeGraderUnchanged, true);
  assert.ok(built.promptBytes[0].afterZh > built.promptBytes[0].beforeZh);
});

test('oracle, golden artifacts and queued private replies do not enter model-visible task prompts', () => {
  const built = fixture().build();
  const publicText = JSON.stringify(built.suite.cases.map(c => c.prompt));
  for (const marker of ['PRIVATE_ORACLE_CANARY', 'GOLDEN_ARTIFACT_CANARY', 'USER_REPLY_ONLY']) assert.ok(!publicText.includes(marker));
  assert.ok(built.text.includes('PRIVATE_ORACLE_CANARY'), 'the private grader data is preserved for the controller, not discarded');
});

test('missing, repeated, unknown or duplicate source identities fail closed', () => {
  for (const mutate of [
    ({manifest}) => { manifest.cases = []; },
    ({manifest}) => { manifest.cases.push(structuredClone(manifest.cases[0])); },
    ({manifest}) => { manifest.cases[0].id = 'not-in-source'; },
    ({source}) => { source.cases.push(structuredClone(source.cases[0])); },
  ]) { const f = fixture(); mutate(f); assert.throws(f.build); }
});

test('non-bilingual or extra payload fields cannot silently add private manifest channels', () => {
  for (const mutate of [
    ({manifest}) => { delete manifest.common.en; },
    ({manifest}) => { manifest.expected = {answer: 'forbidden-channel'}; },
    ({manifest}) => { manifest.cases[0].referenceFiles = {}; },
    ({manifest}) => { manifest.cases[0].contract.en = ''; },
    ({source}) => { source.cases[0].prompt.zh = null; },
  ]) { const f = fixture(); mutate(f); assert.throws(f.build); }
});

test('different public protocol bytes produce different frozen task identities', () => {
  const f = fixture(); const first = f.build();
  f.manifest.cases[0].contract.zh += ' 保持数组顺序。';
  const second = f.build();
  assert.notEqual(first.suite.protocol.publicContractHash, second.suite.protocol.publicContractHash);
  assert.equal(first.suite.protocol.sourceCaseSetHash, second.suite.protocol.sourceCaseSetHash);
});
