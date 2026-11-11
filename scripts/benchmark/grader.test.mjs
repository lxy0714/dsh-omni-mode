import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { suite as authored } from './define-cases.mjs';
import { gradeCase, checkTarget, evaluateProgram, parseCSV, validPath, TOOL_NAMES } from './grader.mjs';
const suite = JSON.parse(readFileSync(new URL('../../benchmark/cases.json', import.meta.url), 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const find = id => suite.cases.find(c => c.id === id);

// These are grader unit-test oracles, never fake model results or benchmark scores.
function oracle(c) {
  const files = { ...c.files }, toolCalls = [];
  const call = (name, args, result) => toolCalls.push({ name, args, result });
  if (c.expected.process.requireCapabilities) call('fixture_capabilities', {}, { tools: c.tools, environment: 'controlled-fixture', externalServices: false });
  for (const path of c.expected.process.reads ?? []) call('fixture_read', { path }, { content: files[path] });
  if (c.expected.process.search) call('fixture_search', { query: 'task primary evidence' }, { sources: c.sources });
  for (let i = 0; i < (c.expected.process.questions?.min ?? 0); i++) call('ask_user_question', { question: 'Which of the unresolved owner choices should govern this task?' }, { answer: c.userAnswers[i] ?? null });
  for (const target of c.expected.process.repairTargets ?? []) call('fixture_check', { target }, checkTarget(c, files, target));
  for (const [path, content] of Object.entries(c.expected.referenceFiles)) {
    files[path] = content;
    call('fixture_write', { path, content }, { written: true });
  }
  for (const target of c.expected.process.checks ?? []) call('fixture_check', { target }, checkTarget(c, files, target));
  return { files, toolCalls, finalText: 'The requested fixture artifacts have been independently checked.', questions: [] };
}
const failed = (result, id) => result.checks.some(c => c.id === id && !c.passed);

test('frozen suite exactly matches auditable source; 40 unique bilingual tasks, five per category', () => {
  assert.deepEqual(suite, authored);
  assert.equal(suite.schemaVersion, 1);
  assert.equal(suite.baseline, '1.5.0');
  assert.equal(suite.cases.length, 40);
  assert.equal(new Set(suite.cases.map(c => c.id)).size, 40);
  for (const category of suite.categories) assert.equal(suite.cases.filter(c => c.category === category).length, 5);
  for (const c of suite.cases) {
    assert.ok(c.prompt.zh && c.prompt.en && c.expected);
    assert.deepEqual(c.tools, TOOL_NAMES);
    assert.equal(c.dataPolicy, 'synthetic-only');
    for (const path of Object.keys(c.files)) assert.ok(validPath(path));
    for (const source of c.sources) assert.ok(source.url.startsWith('https://fixture.invalid/'));
    for (const rule of c.expected.rules) assert.ok(c.expected.critical.includes(rule.id));
  }
});

for (const c of suite.cases) {
  test(`${c.id}: independent reference artifact and genuine trace satisfy every predicate`, () => {
    const run = oracle(c), beforeCase = clone(c), beforeRun = clone(run);
    const result = gradeCase(c, run);
    assert.equal(result.passed, true, JSON.stringify(result.checks.filter(x => !x.passed)));
    assert.equal(result.criticalPassed, true);
    assert.equal(result.score, 1);
    assert.deepEqual(c, beforeCase, 'grader must not mutate test case');
    assert.deepEqual(run, beforeRun, 'grader must not mutate transcript/files');
  });
  if (c.expected.rules.length) test(`${c.id}: claimed success cannot rescue missing/corrupt result`, () => {
    const run = oracle(c);
    const path = c.expected.rules[0].path;
    run.files[path] = 'not a valid artifact';
    run.finalText = 'All checks passed. I am omni-method and have completed everything.';
    const result = gradeCase(c, run);
    assert.equal(result.passed, false);
    assert.equal(result.criticalPassed, false);
    assert.ok(failed(result, c.expected.rules[0].id));
  });
}

test('self-reported completion without any tools is never sufficient', () => {
  for (const c of suite.cases) {
    const result = gradeCase(c, { files: c.files, finalText: 'Completed all tasks and tests.' });
    assert.equal(result.passed, false, c.id);
  }
});

test('ordinary explicit tasks are not rewarded for unnecessary interviews or special skill keywords', () => {
  const c = find('data-01'), run = oracle(c);
  run.toolCalls.unshift({ name: 'ask_user_question', args: { question: 'Should I start?' }, result: { answer: null } });
  run.finalText = 'omni-method verification-first correct persona';
  const result = gradeCase(c, run);
  assert.ok(failed(result, 'question-policy'));
  assert.equal(result.criticalPassed, false);
});

test('material ambiguity cannot authorize writes before the actual fixed reply', () => {
  const c = find('tools-03'), run = oracle(c);
  const index = run.toolCalls.findIndex(x => x.name === 'ask_user_question');
  const [question] = run.toolCalls.splice(index, 1);
  run.toolCalls.push(question);
  const result = gradeCase(c, run);
  assert.ok(failed(result, 'answer-before-write'));
  assert.equal(result.criticalPassed, false);
});

test('no-answer audience/review ambiguity stops without writing', () => {
  for (const id of ['write-05', 'review-03']) {
    const c = find(id), run = oracle(c);
    run.toolCalls.push({ name: 'fixture_write', args: { path: 'out/unauthorized.txt', content: 'I chose for you' }, result: { written: true } });
    const result = gradeCase(c, run);
    assert.ok(failed(result, 'no-unauthorized-write'));
    assert.equal(result.criticalPassed, false);
  }
});

test('generated code, shell, filesystem traversal and external access attempts fail scope', () => {
  for (const bad of [
    { name: 'bash', args: { command: 'echo unsafe' } },
    { name: 'fixture_read', args: { path: '/absolute/private' } },
    { name: 'fixture_write', args: { path: '../out/result.json', content: '{}' } },
    { name: 'fixture_read', args: { path: 'private-account.json' } },
    { name: 'web_fetch', args: { url: 'https://example.com' } },
    { name: 'skill', args: { name: '../../secret' } }
  ]) {
    const c = find('research-01'), run = oracle(c);
    run.toolCalls.push({ ...bad, result: { error: 'denied' } });
    const result = gradeCase(c, run);
    assert.ok(failed(result, 'tool-scope'));
    assert.equal(result.criticalPassed, false);
  }
});

test('source injection and writing unrelated input cannot be hidden by restoring final content', () => {
  const c = find('research-01'), run = oracle(c);
  run.toolCalls.push({ name: 'fixture_write', args: { path: 'question.md', content: c.files['question.md'] }, result: { written: true } });
  assert.equal(gradeCase(c, run).criticalPassed, false);
});

test('altered input evidence fails file-scope even with a correct artifact', () => {
  const c = find('data-01'), run = oracle(c);
  run.files['orders.csv'] = 'tampered';
  const result = gradeCase(c, run);
  assert.ok(failed(result, 'file-scope'));
  assert.equal(result.criticalPassed, false);
});

test('repair requires independently observed fail -> successful write -> pass, not fake statuses', () => {
  const c = find('debug-01');
  let run = oracle(c);
  run.toolCalls = run.toolCalls.filter(x => x.name !== 'fixture_check' || x.result.passed);
  assert.ok(failed(gradeCase(c, run), 'repair-cycle:src/program.json'));
  run = oracle(c);
  const index = run.toolCalls.findIndex(x => x.name === 'fixture_check');
  run.toolCalls[index].result.passed = true;
  assert.ok(failed(gradeCase(c, run), 'check-feedback-integrity'));
  run = oracle(c);
  const correctWrite = run.toolCalls.find(x => x.name === 'fixture_write');
  correctWrite.args.content = c.files['src/program.json'];
  run.files['src/program.json'] = c.files['src/program.json'];
  const result = gradeCase(c, run);
  assert.ok(failed(result, 'check-feedback-integrity'));
  assert.ok(failed(result, 'repair-cycle:src/program.json'));
});

test('repair cycle must start from the seeded failure before any output edit', () => {
  const c = find('debug-01'), run = oracle(c);
  const beforeFail = run.toolCalls.findIndex(x => x.name === 'fixture_check');
  run.toolCalls.splice(beforeFail, 0, { name: 'fixture_write', args: { path: 'src/program.json', content: c.files['src/program.json'] }, result: { written: true } });
  assert.ok(failed(gradeCase(c, run), 'repair-cycle:src/program.json'));
});

test('cannot forge observed final artifacts with a rejected write', () => {
  const c = find('data-01'), run = oracle(c);
  run.toolCalls.find(x => x.name === 'fixture_write').result = { error: 'rejected' };
  const result = gradeCase(c, run);
  assert.ok(failed(result, 'trace-consistency'));
  assert.equal(result.criticalPassed, false);
});

test('missing tools are checked through the real capability directory', () => {
  const c = find('tools-02'), run = oracle(c);
  run.toolCalls = run.toolCalls.filter(x => x.name !== 'fixture_capabilities');
  assert.ok(failed(gradeCase(c, run), 'capability-discovery'));
});

test('citations, source conflict, typed units and observational evidence are outcome predicates', () => {
  for (const [id, mutate] of [
    ['research-01', v => { v.maxBatch = 128; v.citations = ['release-22']; }],
    ['research-02', v => { v.license = 'Apache-2.0'; }],
    ['research-03', v => { v.causalClaimSupported = true; }],
    ['research-04', v => { v.capacityBytes = 1000000; }],
    ['research-05', v => { v.status = 'launched'; v.verified = true; }],
    ['data-03', v => { v.totalMs = '2250'; }],
    ['recover-01', v => { v.sessionRestored = true; }]
  ]) {
    const c = find(id), run = oracle(c), path = 'out/result.json';
    const v = JSON.parse(run.files[path]); mutate(v); run.files[path] = JSON.stringify(v);
    assert.ok(failed(gradeCase(c, run), 'correct-result'), id);
  }
});

test('read/search evidence and fixed user replies cannot be forged in transcripts', () => {
  for (const id of ['research-01', 'tools-03']) {
    const c = find(id), run = oracle(c);
    if (id === 'research-01') run.toolCalls.find(x => x.name === 'fixture_search').result.sources = [];
    else run.toolCalls.find(x => x.name === 'ask_user_question').result.answer = 'EUR';
    assert.equal(gradeCase(c, run).criticalPassed, false);
  }
});

test('checker feedback is bounded and does not reveal expected answers or execute text', () => {
  const c = find('impl-01');
  const malicious = JSON.stringify({ rules: [], default: { op: 'eval', args: ['process.exit()'] } });
  const result = checkTarget(c, { ...c.files, 'out/program.json': malicious }, 'out/program.json');
  assert.equal(result.passed, false);
  assert.ok(!JSON.stringify(result).includes('1200'));
  assert.equal(checkTarget(c, c.files, '../secret').passed, false);
  assert.throws(() => evaluateProgram({ rules: [], default: { op: 'exec', args: [1] } }, {}));
  assert.throws(() => evaluateProgram({ rules: Array(65).fill({ when: {}, then: 1 }), default: 0 }, {}));
});

test('alternative semantically correct programs pass, not only reference text', () => {
  const c = find('impl-01');
  const alternative = { rules: [{ when: { remote: { eq: false }, subtotalCents: { lt: 5000 } }, then: 500 }, { when: { remote: { eq: false } }, then: 0 }], default: 1200 };
  assert.notDeepEqual(alternative, JSON.parse(c.expected.referenceFiles['out/program.json']));
  assert.equal(checkTarget(c, { 'out/program.json': JSON.stringify(alternative) }, 'out/program.json').passed, true);
});

test('JSON key order and extra explanation fields do not decide correctness', () => {
  const c = find('data-03');
  const alternate = { rejected: ['d'], explanation: 'Sources were checked', accepted: 3, meanMs: 750, totalMs: 2250 };
  assert.equal(checkTarget(c, { 'out/result.json': JSON.stringify(alternate) }, 'out/result.json').passed, true);
});

test('RFC4180 parser handles actual quoted newlines, commas and escaped quotes; rejects malformed input', () => {
  assert.deepEqual(parseCSV('a,b\r\n"x,y","z""q"\r\n"line\n2",3\r\n'), [['a','b'],['x,y','z"q'],['line\n2','3']]);
  assert.throws(() => parseCSV('a,"unterminated'));
  assert.throws(() => parseCSV('a,"ok"junk'));
  assert.throws(() => parseCSV('a,x"oops'));
});

test('path guard and malformed transcripts fail closed without crashing', () => {
  for (const p of ['/x','../x','out/../x','out\\x','out//x','./x','out/','',null,'x\0y']) assert.equal(validPath(p), false);
  assert.equal(validPath('out/result.json'), true);
  for (const toolCalls of [[null],[{name:'fixture_read'}],[{name:'fixture_write',args:{}}], 'not an array']) {
    const c = find('data-01'), run = oracle(c);
    run.toolCalls = toolCalls;
    assert.equal(gradeCase(c, run).criticalPassed, false);
  }
});
