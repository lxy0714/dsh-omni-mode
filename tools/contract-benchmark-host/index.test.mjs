// Mock-only controller contracts; never real-provider benchmark outcomes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createController, SNAPSHOT_PATHS} from './index.js';
import {makeContractSuite} from '../../scripts/benchmark/contract-suite.mjs';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = text => createHash('sha256').update(text).digest('hex');

function setup(t, {failFirst = false} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'omni-contract-controller-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const sample = {id: 'fixture-01', category: 'synthetic', prompt: {zh: '读input，写out.json的ready布尔字段并校验。', en: 'Read input, write ready boolean to out.json and check.'},
    files: {'input.txt': 'public evidence'}, sources: [], userAnswers: ['PRIVATE_REPLY_CANARY'],
    tools: ['fixture_read', 'fixture_write', 'fixture_check', 'fixture_capabilities'],
    expected: {rules: [{id: 'result', kind: 'json', path: 'out.json', mode: 'subset', value: {ready: true}}],
      referenceFiles: {'out.json': 'PRIVATE_GOLDEN_CANARY'}, probes: ['PRIVATE_PROBE_CANARY'], critical: ['result'],
      process: {writePaths: ['out.json'], reads: ['input.txt'], checks: ['out.json']}}};
  const source = JSON.stringify({cases: [sample]});
  const manifest = JSON.stringify({schemaVersion: 1, id: 'original40-explicit-contract-v2', common: {zh: '使用真实布尔。', en: 'Use real booleans.'}, cases: [{id: sample.id, contract: {zh: 'ready为boolean。', en: 'ready is boolean.'}}]});
  const built = makeContractSuite(source, manifest);
  const protocol = JSON.parse(fs.readFileSync(path.join(project, 'benchmark/contract-v2-protocol.json'), 'utf8')); protocol.expectedCases = 1;
  const overrides = {'benchmark/cases-v1.json': source, 'benchmark/contracts-v2.json': manifest, 'benchmark/cases-v2.json': built.text,
    'benchmark/contract-v2-protocol.json': JSON.stringify(protocol),
    'tools/benchmark-host/baseline.json': JSON.stringify({version: 'test-baseline', commit: 'test', persona: 'BASELINE', grilling: 'method'}),
    'cordis.patch.yml': '- insert:\n    - config:\n        plugins:\n          - id: persona\n            config:\n              prefix: CANDIDATE\n',
    'skills/grilling/SKILL.md': 'public grilling method', 'skills/omni-method/SKILL.md': 'public execution method'};
  for (const p of SNAPSHOT_PATHS) { const destination = path.join(root, p); fs.mkdirSync(path.dirname(destination), {recursive: true}); fs.writeFileSync(destination, overrides[p] ?? fs.readFileSync(path.join(project, p), 'utf8')); }
  const selected = {provider: 'mock', model: 'mock-model', reasoningEffort: 'mock-effort'};
  const exec = {agent: {model: {current: () => structuredClone(selected)}}, signal: new AbortController().signal};
  const requests = []; let fault = failFirst;
  const ctx = {llm: {resolveCallConfig: async cfg => structuredClone(cfg), stream: async function* (options) {
    requests.push(structuredClone({system: options.system, tools: options.tools, messages: options.messages}));
    if (fault) { fault = false; yield {type: 'finish', reason: {kind: 'error', failure: {code: 'MOCK_TRANSPORT_FAULT'}}}; return; }
    const seen = options.messages.filter(m => m.role === 'tool').length;
    let name, args;
    if (options.messages[0].content[0].text.includes('不计分接线检查')) { if (!seen) {name = 'fixture_capabilities'; args = {};} }
    else if (!seen) {name = 'fixture_read'; args = {path: 'input.txt'};}
    else if (seen === 1) {name = 'fixture_write'; args = {path: 'out.json', content: '{"ready":true}'};}
    else if (seen === 2) {name = 'fixture_check'; args = {target: 'out.json'};}
    if (name) { yield {type: 'block-end', index: 0, block: {type: 'tool-call', id: 'call-' + seen, name, arguments: JSON.stringify(args)}}; yield {type: 'finish', reason: {kind: 'tool-calls'}}; }
    else yield {type: 'finish', reason: {kind: 'stop'}};
  }}};
  const controller = createController(ctx, {root, expectedCases: 1, expectedOriginalHash: sha(source)});
  return {root, selected, requests, exec, controller,
    async freeze() {return controller.execute({mode: 'freeze'}, exec);},
    frozenPath: id => path.join(root, '.verification/contract-benchmark', id, 'frozen.json')};
}

test('freeze makes no model call and preserves original source/code hashes', async t => {
  const f = setup(t), descriptor = await f.freeze();
  assert.equal(f.requests.length, 0);
  assert.equal(descriptor.expectedCases, 1);
  assert.equal(descriptor.historicalResultsChanged, false);
  assert.equal(descriptor.routeIdentity.model, 'mock-model');
  assert.ok(fs.existsSync(f.frozenPath(descriptor.experimentId)));
});

test('receipt envelope version is not overwritten by the frozen descriptor version', async t => {
  const f = setup(t), descriptor = await f.freeze();
  assert.equal(descriptor.schemaVersion, 1);
  const result = await f.controller.execute({mode: 'pair', experimentId: descriptor.experimentId, caseId: 'fixture-01'}, f.exec);
  const receipt = JSON.parse(fs.readFileSync(path.join(f.root, result.cases[0].receipt), 'utf8'));
  assert.equal(receipt.schemaVersion, 2);
  assert.equal(receipt.caseSetHash, descriptor.caseSetHash);
  assert.ok(receipt.results.every(arm => arm.grade.passed));
});

test('both arms receive identical public inputs/tools and no private grading/answer payload', async t => {
  const f = setup(t), {experimentId} = await f.freeze();
  const result = await f.controller.execute({mode: 'pair', experimentId, caseId: 'fixture-01'}, f.exec);
  assert.equal(result.count, 1);
  assert.equal(result.cases[0].status, 'complete');
  assert.ok(result.cases[0].results.every(arm => arm.passed));
  const allRequests = JSON.stringify(f.requests);
  for (const marker of ['PRIVATE_GOLDEN_CANARY', 'PRIVATE_PROBE_CANARY', 'PRIVATE_REPLY_CANARY']) assert.ok(!allRequests.includes(marker));
  const firsts = f.requests.filter(r => r.messages.length === 1);
  assert.equal(firsts.length, 2);
  assert.deepEqual(firsts[0].messages, firsts[1].messages);
  assert.deepEqual(firsts[0].tools, firsts[1].tools);
  await assert.rejects(f.controller.execute({mode: 'pair', experimentId, caseId: 'fixture-01'}, f.exec), /already attempted/);
  await assert.rejects(f.controller.execute({mode: 'recover', experimentId, caseId: 'fixture-01'}, f.exec), /infrastructure failure/);
});

test('a provider failure stays primary and permits exactly one separate infrastructure recovery', async t => {
  const f = setup(t, {failFirst: true}), {experimentId} = await f.freeze();
  const failed = await f.controller.execute({mode: 'pair', experimentId, caseId: 'fixture-01'}, f.exec);
  assert.equal(failed.cases[0].status, 'infrastructure-error');
  assert.equal(failed.cases[0].attemptKind, 'primary');
  const recovered = await f.controller.execute({mode: 'recover', experimentId, caseId: 'fixture-01'}, f.exec);
  assert.equal(recovered.cases[0].attemptKind, 'infrastructure-recovery');
  assert.ok(recovered.cases[0].results.every(arm => arm.passed));
  await assert.rejects(f.controller.execute({mode: 'recover', experimentId, caseId: 'fixture-01'}, f.exec), /one explicitly separate recovery/);
  const status = await f.controller.execute({mode: 'status', experimentId}, f.exec);
  assert.equal(status.recordedReceipts, 2);
});

test('source, frozen policy and selected-model drift stop before any inference', async t => {
  for (const mutate of [
    f => {f.selected.model = 'manual-other-model';},
    f => {fs.appendFileSync(path.join(f.root, 'skills/omni-method/SKILL.md'), ' changed');},
    (f, id) => {const p = f.frozenPath(id), data = JSON.parse(fs.readFileSync(p, 'utf8')); data.arms.candidate.prompt = 'tampered'; fs.writeFileSync(p, JSON.stringify(data));},
    (f, id) => {const p = f.frozenPath(id), data = JSON.parse(fs.readFileSync(p, 'utf8')); data.route.model = 'tampered'; fs.writeFileSync(p, JSON.stringify(data));},
  ]) {
    const f = setup(t), {experimentId} = await f.freeze(); mutate(f, experimentId);
    await assert.rejects(f.controller.execute({mode: 'pair', experimentId, caseId: 'fixture-01'}, f.exec));
    assert.equal(f.requests.length, 0);
  }
});

test('pilot remains outside the scored receipt directory and invalid identities/arguments fail', async t => {
  const f = setup(t), {experimentId} = await f.freeze();
  const pilot = await f.controller.execute({mode: 'pilot', experimentId}, f.exec);
  assert.ok(pilot.cases[0].results.every(arm => arm.passed));
  const status = await f.controller.execute({mode: 'status', experimentId}, f.exec);
  assert.equal(status.recordedReceipts, 0);
  await assert.rejects(f.controller.execute({mode: 'pair', experimentId: '../escape', caseId: 'fixture-01'}, f.exec), /UUID/);
  await assert.rejects(f.controller.execute({mode: 'sweep', experimentId, offset: 0.5}, f.exec), /Integer offset/);
  await assert.rejects(f.controller.execute({mode: 'freeze', root: '/unrequested'}, f.exec), /Invalid controlled/);
});
