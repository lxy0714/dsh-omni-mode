import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { fictionThreadSchemas, fictionThreadImplementations } from './fiction-threads.mjs';

const id = 'fiction.thread-check';
const schema = fictionThreadSchemas[id], execute = fictionThreadImplementations[id];
// Standalone contracts: no central registry, catalog, filesystem or manuscript.
const run = input => execute(validate(schema, input));
const event = (kind, threadId = 'private-thread-marker') => ({ threadId, kind });
const chapter = (id, events = []) => ({ id, events });
const input = (events = []) => ({ chapters: [chapter('private-chapter-marker', events)] });
const position = (chapterIndex, eventIndex) => ({ chapterIndex, eventIndex });
const zeroCounts = { PAYOFF_BEFORE_SETUP: 0, REPEATED_SETUP: 0, REPEATED_PAYOFF: 0 };

function error(action, code, path, hidden = []) {
  assert.throws(action, failure => {
    assert.equal(failure.name, 'CapabilityError'); assert.equal(failure.code, code);
    if (path !== undefined) assert.equal(failure.path, path);
    assert.match(failure.message, /\p{Script=Han}.* \/ [A-Z]/u);
    assert.ok(failure.message.length < 200);
    // These are the application diagnostic fields. JS stack frames belong to
    // the caller/test runner (e.g. "TestContext" itself contains "text").
    for (const value of hidden) assert.ok(!`${failure.message} ${failure.path}`.includes(value));
    return true;
  });
}
const invalid = (value, code, path, hidden) => {
  error(() => validate(schema, value), code, path, hidden);
  error(() => execute(value), code, path, hidden);
};

test('exports exactly one deeply frozen, recursively closed bounded operation schema', () => {
  assert.deepEqual(Object.keys(fictionThreadSchemas), [id]);
  assert.deepEqual(Object.keys(fictionThreadImplementations), [id]);
  assert.equal(typeof execute, 'function');
  assert.deepEqual(schema.required, ['chapters']);
  assert.equal(schema.properties.chapters.maxItems, 500);
  const c = schema.properties.chapters.items;
  assert.deepEqual(c.required, ['id', 'events']);
  assert.equal(c.properties.id.maxLength, 100);
  assert.equal(c.properties.events.maxItems, 1000);
  assert.deepEqual(c.properties.events.items.required, ['threadId', 'kind']);
  assert.deepEqual(c.properties.events.items.properties.kind.enum, ['setup', 'payoff']);
  const inspect = value => {
    if (value && typeof value === 'object') {
      assert.equal(Object.isFrozen(value), true);
      if (value.type === 'object') assert.equal(value.additionalProperties, false);
      if (value.type === 'array') assert.ok(Number.isSafeInteger(value.maxItems));
      if (value.type === 'string' && !value.enum) assert.ok(Number.isSafeInteger(value.maxLength));
      Object.values(value).forEach(inspect);
    }
  };
  inspect(fictionThreadSchemas);
  assert.throws(() => { c.properties.events.maxItems = Infinity; }, TypeError);
});

test('empty declarations and empty chapters are neutral, not literary approval or an error', () => {
  const empty = run({ chapters: [] });
  assert.equal(empty.chapterCount, 0); assert.equal(empty.eventCount, 0); assert.equal(empty.threadCount, 0);
  assert.deepEqual(empty.threads, []); assert.deepEqual(empty.issues, []);
  assert.deepEqual(empty.statusCounts, { open: 0, 'paid-off': 0, 'payoff-only': 0 });
  assert.deepEqual(empty.issueCounts, zeroCounts); assert.equal(empty.totalIssues, 0);
  assert.equal(empty.needsReview, false); assert.equal(empty.truncated, false);
  assert.equal(empty.scope, 'supplied-single-narrative-only');
  assert.equal(empty.order, 'chapter-and-event-array-order');
  assert.equal(Object.hasOwn(empty, 'valid'), false);
  assert.equal(empty.proseRead, false); assert.equal(empty.storyEvaluated, false); assert.equal(empty.memoryWritten, false);
  assert.match(empty.limitation, /array order is not story time/);
  assert.match(empty.limitation, /open threads are not errors/);
  const blankChapters = run({ chapters: [chapter('z'), chapter('a')] });
  assert.equal(blankChapters.chapterCount, 2); assert.equal(blankChapters.threadCount, 0);
  assert.equal(blankChapters.needsReview, false);
});

test('first setup followed by first payoff is paid off, with exact zero-based coordinates', () => {
  const result = run({ chapters: [chapter('ch9', [event('setup')]), chapter('ch1', []), chapter('ch0', [event('payoff')])] });
  assert.deepEqual(result.threads, [{
    threadIndex: 0, firstOccurrence: position(0, 0), firstSetup: position(0, 0), firstMatchedPayoff: position(2, 0),
    setupCount: 1, payoffCount: 1, payoffBeforeSetupCount: 0, repeatedSetupCount: 0, repeatedPayoffCount: 0,
    status: 'paid-off', needsReview: false
  }]);
  assert.deepEqual(result.statusCounts, { open: 0, 'paid-off': 1, 'payoff-only': 0 });
  assert.equal(result.chapterCount, 3); assert.equal(result.eventCount, 2); assert.equal(result.needsReview, false);
  assert.deepEqual(result.issues, []); assert.deepEqual(result.issueCounts, zeroCounts);
});

test('a setup left open is informational: no issue, no review and no story-error verdict', () => {
  const result = run(input([event('setup')]));
  assert.equal(result.threads[0].status, 'open'); assert.equal(result.threads[0].firstMatchedPayoff, null);
  assert.equal(result.threads[0].needsReview, false); assert.equal(result.needsReview, false);
  assert.equal(result.totalIssues, 0); assert.deepEqual(result.statusCounts, { open: 1, 'paid-off': 0, 'payoff-only': 0 });
});

test('payoff-only requests review without judging the story, and repeated early payoffs stay unmatched', () => {
  const result = run(input([event('payoff'), event('payoff')]));
  assert.equal(result.threads[0].status, 'payoff-only'); assert.equal(result.threads[0].firstSetup, null);
  assert.equal(result.threads[0].firstMatchedPayoff, null);
  assert.equal(result.threads[0].payoffCount, 2); assert.equal(result.threads[0].payoffBeforeSetupCount, 2);
  assert.equal(result.threads[0].repeatedPayoffCount, 0);
  assert.equal(result.needsReview, true); assert.equal(result.totalIssues, 2);
  assert.deepEqual(result.issues.map(row => row.code), ['PAYOFF_BEFORE_SETUP', 'PAYOFF_BEFORE_SETUP']);
  assert.ok(result.issues.every(row => row.severity === 'review'));
  assert.match(result.limitation, /review does not prove a story error/);
});

test('a later setup never fills in an earlier payoff: the thread remains open', () => {
  const result = run({ chapters: [chapter('c2', [event('payoff')]), chapter('c1', [event('setup')])] });
  assert.equal(result.threads[0].status, 'open'); assert.equal(result.threads[0].firstMatchedPayoff, null);
  assert.deepEqual(result.threads[0].firstOccurrence, position(0, 0));
  assert.deepEqual(result.threads[0].firstSetup, position(1, 0));
  assert.equal(result.threads[0].payoffBeforeSetupCount, 1);
  assert.equal(result.needsReview, true);
  assert.equal(result.issues[0].path, '$.chapters[0].events[0]');
  assert.match(result.issues[0].message, /without retroactive matching/);
});

test('early payoff remains a finding even after a subsequent valid setup/payoff pair', () => {
  const result = run(input([event('payoff'), event('setup'), event('payoff')]));
  const thread = result.threads[0];
  assert.equal(thread.status, 'paid-off'); assert.equal(thread.needsReview, true);
  assert.deepEqual(thread.firstMatchedPayoff, position(0, 2)); assert.deepEqual(thread.firstSetup, position(0, 1));
  assert.equal(thread.payoffBeforeSetupCount, 1); assert.equal(thread.repeatedPayoffCount, 0);
  assert.equal(result.totalIssues, 1); assert.equal(result.issues[0].path, '$.chapters[0].events[0]');
});

test('same-chapter array order matters and is not inferred from kind or chapter ID', () => {
  assert.equal(run(input([event('setup'), event('payoff')])).threads[0].status, 'paid-off');
  assert.equal(run(input([event('payoff'), event('setup')])).threads[0].status, 'open');
  const a = run({ chapters: [chapter('chapter-20', [event('setup')]), chapter('chapter-1', [event('payoff')])] });
  const b = run({ chapters: [chapter('chapter-1', [event('payoff')]), chapter('chapter-20', [event('setup')])] });
  assert.equal(a.threads[0].status, 'paid-off'); assert.equal(b.threads[0].status, 'open');
});

test('repeated setup retains first setup and cannot reset an open thread', () => {
  const result = run(input([event('setup'), event('setup'), event('payoff')]));
  const thread = result.threads[0];
  assert.deepEqual(thread.firstSetup, position(0, 0)); assert.deepEqual(thread.firstMatchedPayoff, position(0, 2));
  assert.equal(thread.setupCount, 2); assert.equal(thread.repeatedSetupCount, 1);
  assert.equal(thread.status, 'paid-off'); assert.equal(thread.needsReview, true);
  assert.equal(result.totalIssues, 1); assert.equal(result.issues[0].code, 'REPEATED_SETUP');
  assert.equal(result.issues[0].path, '$.chapters[0].events[1]');
});

test('setup after payoff does not reopen, and repeated payoff never overwrites the first match', () => {
  const result = run(input([event('setup'), event('payoff'), event('setup'), event('payoff'), event('payoff')]));
  const thread = result.threads[0];
  assert.equal(thread.status, 'paid-off'); assert.deepEqual(thread.firstSetup, position(0, 0));
  assert.deepEqual(thread.firstMatchedPayoff, position(0, 1));
  assert.equal(thread.setupCount, 2); assert.equal(thread.payoffCount, 3);
  assert.equal(thread.repeatedSetupCount, 1); assert.equal(thread.repeatedPayoffCount, 2);
  assert.deepEqual(result.issues.map(row => [row.code, row.path]), [
    ['REPEATED_SETUP', '$.chapters[0].events[2]'], ['REPEATED_PAYOFF', '$.chapters[0].events[3]'], ['REPEATED_PAYOFF', '$.chapters[0].events[4]']
  ]);
});

test('interleaved threads stay separate; thread order is first occurrence, findings stay in event order', () => {
  const result = run({ chapters: [
    chapter('last-by-name', [event('setup', 'z'), event('payoff', 'a'), event('setup', 'M')]),
    chapter('first-by-name', [event('payoff', 'z'), event('setup', 'a'), event('setup', 'z'), event('payoff', 'M'), event('payoff', 'a'), event('payoff', 'M')])
  ] });
  assert.deepEqual(result.threads.map(row => [row.threadIndex, row.firstOccurrence, row.status]), [
    [0, position(0, 0), 'paid-off'], [1, position(0, 1), 'paid-off'], [2, position(0, 2), 'paid-off']
  ]);
  assert.deepEqual(result.issues.map(row => [row.code, row.threadIndex, row.path]), [
    ['PAYOFF_BEFORE_SETUP', 1, '$.chapters[0].events[1]'], ['REPEATED_SETUP', 0, '$.chapters[1].events[2]'], ['REPEATED_PAYOFF', 2, '$.chapters[1].events[5]']
  ]);
  assert.deepEqual(result.statusCounts, { open: 0, 'paid-off': 3, 'payoff-only': 0 });
});

test('exhaustive short setup/payoff words agree with a non-state-machine positional oracle', () => {
  for (let length = 0; length <= 8; length++) for (let bits = 0; bits < 2 ** length; bits++) {
    const kinds = Array.from({ length }, (_, index) => bits & (1 << index) ? 'payoff' : 'setup');
    const cut = Math.floor(length / 2);
    const result = run({ chapters: [chapter('z', kinds.slice(0, cut).map(kind => event(kind))), chapter('a', kinds.slice(cut).map(kind => event(kind)))] });
    assert.equal(result.eventCount, length);
    if (!length) { assert.deepEqual(result.threads, []); continue; }
    const at = index => index < cut ? position(0, index) : position(1, index - cut);
    const setups = kinds.flatMap((kind, index) => kind === 'setup' ? [index] : []);
    const payoffs = kinds.flatMap((kind, index) => kind === 'payoff' ? [index] : []);
    const firstSetup = setups[0];
    const matched = firstSetup === undefined ? undefined : payoffs.find(index => index > firstSetup);
    const early = payoffs.filter(index => firstSetup === undefined || index < firstSetup);
    const repeats = matched === undefined ? [] : payoffs.filter(index => index > matched);
    const expectedIssues = kinds.flatMap((kind, index) => {
      const code = early.includes(index) ? 'PAYOFF_BEFORE_SETUP' : kind === 'setup' && index !== firstSetup ? 'REPEATED_SETUP' : repeats.includes(index) ? 'REPEATED_PAYOFF' : null;
      const loc = at(index);
      return code ? [[code, `$.chapters[${loc.chapterIndex}].events[${loc.eventIndex}]`]] : [];
    });
    const thread = result.threads[0];
    assert.deepEqual(thread.firstOccurrence, at(0));
    assert.deepEqual(thread.firstSetup, firstSetup === undefined ? null : at(firstSetup));
    assert.deepEqual(thread.firstMatchedPayoff, matched === undefined ? null : at(matched));
    assert.equal(thread.status, matched !== undefined ? 'paid-off' : firstSetup !== undefined ? 'open' : 'payoff-only');
    assert.equal(thread.setupCount, setups.length); assert.equal(thread.payoffCount, payoffs.length);
    assert.equal(thread.payoffBeforeSetupCount, early.length); assert.equal(thread.repeatedSetupCount, Math.max(0, setups.length - 1)); assert.equal(thread.repeatedPayoffCount, repeats.length);
    assert.deepEqual(result.issues.map(row => [row.code, row.path]), expectedIssues);
    assert.equal(result.needsReview, expectedIssues.length > 0);
    assert.equal(result.totalIssues, expectedIssues.length);
  }
});

test('chapter IDs are unique without exposing values; thread IDs intentionally repeat across chapters', () => {
  const secret = 'private-chapter-sentinel';
  error(() => run({ chapters: [chapter(secret), chapter(secret)] }), 'E_DUPLICATE', '$.chapters[1].id', [secret]);
  error(() => execute({ chapters: [chapter(secret), chapter(secret)] }), 'E_DUPLICATE', '$.chapters[1].id', [secret]);
  const result = run({ chapters: [chapter('Same', [event('setup', 'thread')]), chapter('same', [event('payoff', 'thread')])] });
  assert.equal(result.threadCount, 1); assert.equal(result.threads[0].status, 'paid-off');
  const names = ['toString', 'hasOwnProperty', 'Constructor', 'prototype.child', '9-A_0:b'];
  assert.equal(run({ chapters: names.map(name => chapter(name, [event('setup', name)])) }).threadCount, names.length);
});

test('deterministic multi-thread interleavings agree with independent per-ID positional scans', () => {
  let seed = 0x61f317ba;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const ids = ['thread', 'Thread', 'toString', 'hasOwnProperty', 'a:b', 'a-b', '0', 'z'];
  for (let trial = 0; trial < 120; trial++) {
    const sequence = Array.from({ length: 80 }, () => event(random() < 0.55 ? 'setup' : 'payoff', ids[Math.floor(random() * ids.length)]));
    const value = { chapters: Array.from({ length: 8 }, (_, c) => chapter(`c${8 - c}`, sequence.slice(c * 10, c * 10 + 10))) };
    const result = run(value), firstSeen = [...new Set(sequence.map(row => row.threadId))];
    const expectedFindings = [];
    for (const [threadIndex, threadId] of firstSeen.entries()) {
      const records = sequence.flatMap((row, index) => row.threadId === threadId ? [{ ...row, index }] : []);
      const setups = records.filter(row => row.kind === 'setup'), payoffs = records.filter(row => row.kind === 'payoff');
      const setupIndex = setups[0]?.index, payoffIndex = payoffs.find(row => setupIndex !== undefined && row.index > setupIndex)?.index;
      const at = index => index === undefined ? null : position(Math.floor(index / 10), index % 10);
      const thread = result.threads[threadIndex];
      assert.deepEqual(thread.firstOccurrence, at(records[0].index)); assert.deepEqual(thread.firstSetup, at(setupIndex)); assert.deepEqual(thread.firstMatchedPayoff, at(payoffIndex));
      assert.equal(thread.status, payoffIndex !== undefined ? 'paid-off' : setupIndex !== undefined ? 'open' : 'payoff-only');
      assert.equal(thread.setupCount, setups.length); assert.equal(thread.payoffCount, payoffs.length);
      assert.equal(thread.repeatedSetupCount, Math.max(0, setups.length - 1));
      assert.equal(thread.payoffBeforeSetupCount, payoffs.filter(row => setupIndex === undefined || row.index < setupIndex).length);
      assert.equal(thread.repeatedPayoffCount, payoffs.filter(row => payoffIndex !== undefined && row.index > payoffIndex).length);
      for (const record of records) {
        const code = record.kind === 'setup' ? record.index !== setupIndex ? 'REPEATED_SETUP' : null : setupIndex === undefined || record.index < setupIndex ? 'PAYOFF_BEFORE_SETUP' : record.index !== payoffIndex ? 'REPEATED_PAYOFF' : null;
        if (code) expectedFindings.push({ index: record.index, threadIndex, code });
      }
    }
    expectedFindings.sort((a, b) => a.index - b.index);
    assert.deepEqual(result.issues.map(row => [row.code, row.threadIndex, row.path]), expectedFindings.map(row => [row.code, row.threadIndex, `$.chapters[${Math.floor(row.index / 10)}].events[${row.index % 10}]`]));
    assert.equal(result.totalIssues, expectedFindings.length);
  }
});

test('ID schemas reject reserved names, invalid forms, final line breaks and oversized strings', () => {
  for (const value of ['__proto__', 'prototype', 'constructor', 'bad/id', 'bad\\id', 'a b', ' x', 'x ', 'x\n', 'x\r', 'x\r\n', 'x\u2028', 'x\u2029', 'x\0', 'é', '伏笔', '.root', '-x', '+x', '\u200bx']) {
    invalid({ chapters: [chapter(value)] }, 'E_SCHEMA', '$.chapters[0].id', [value]);
    invalid(input([event('setup', value)]), 'E_SCHEMA', '$.chapters[0].events[0].threadId', [value]);
  }
  invalid({ chapters: [chapter('')] }, 'E_LIMIT', '$.chapters[0].id');
  invalid(input([event('setup', '')]), 'E_LIMIT', '$.chapters[0].events[0].threadId');
  invalid({ chapters: [chapter('x'.repeat(101))] }, 'E_LIMIT', '$.chapters[0].id');
  invalid(input([event('setup', 'x'.repeat(101))]), 'E_LIMIT', '$.chapters[0].events[0].threadId');
  assert.equal(run({ chapters: [chapter('c'.repeat(100), [event('setup', 't'.repeat(100))])] }).threadCount, 1);
});

test('missing fields, wrong types and unsupported event kinds fail the shared closed schema', () => {
  invalid({}, 'E_SCHEMA', '$.chapters');
  invalid({ chapters: [{ events: [] }] }, 'E_SCHEMA', '$.chapters[0].id');
  invalid({ chapters: [{ id: 'c' }] }, 'E_SCHEMA', '$.chapters[0].events');
  invalid(input([{ kind: 'setup' }]), 'E_SCHEMA', '$.chapters[0].events[0].threadId');
  invalid(input([{ threadId: 't' }]), 'E_SCHEMA', '$.chapters[0].events[0].kind');
  for (const value of [null, [], 1, true, 'text']) invalid(value, 'E_SCHEMA', '$');
  invalid({ chapters: {} }, 'E_SCHEMA', '$.chapters');
  invalid({ chapters: [null] }, 'E_SCHEMA', '$.chapters[0]');
  invalid({ chapters: [chapter('c', {})] }, 'E_SCHEMA', '$.chapters[0].events');
  invalid(input([null]), 'E_SCHEMA', '$.chapters[0].events[0]');
  for (const value of [0, NaN, Infinity, false, null, {}]) {
    invalid({ chapters: [chapter(value)] }, 'E_SCHEMA', '$.chapters[0].id');
    invalid(input([event('setup', value)]), 'E_SCHEMA', '$.chapters[0].events[0].threadId');
  }
  for (const kind of ['SETUP', 'resolve', 'payoff\n', ' setup', 'setup ', '', 1, null, false]) invalid(input([event(kind)]), 'E_SCHEMA', '$.chapters[0].events[0].kind');
});

test('unknown and reserved object keys are rejected without reflecting caller data at any depth', () => {
  for (const key of ['private-unknown-field-sentinel', 'https://example.invalid/private', '__proto__', 'constructor', 'prototype', 'text', 'branch', 'time']) {
    const extra = JSON.parse(`{"${key}":"private-value-sentinel"}`);
    invalid({ ...input(), ...extra }, 'E_SCHEMA', '$', [key, 'private-value-sentinel']);
    invalid({ chapters: [{ ...chapter('c'), ...extra }] }, 'E_SCHEMA', '$.chapters[0]', [key, 'private-value-sentinel']);
    invalid(input([{ ...event('setup'), ...extra }]), 'E_SCHEMA', '$.chapters[0].events[0]', [key, 'private-value-sentinel']);
  }
});

test('direct calls reject proxies/getters/custom prototypes without invoking callbacks', () => {
  let calls = 0;
  const trap = () => { calls++; throw new Error('private-callback-marker'); };
  for (const bad of [new Proxy(input(), { ownKeys: trap, getPrototypeOf: trap, get: trap }), new Proxy([], { ownKeys: trap, get: trap }), new Proxy(() => {}, { get: trap })]) error(() => execute(bad), 'E_SCHEMA', '$', ['private-callback-marker']);
  const revoked = Proxy.revocable(input(), {}); revoked.revoke(); error(() => execute(revoked.proxy), 'E_SCHEMA', '$');
  const getRoot = {}; Object.defineProperty(getRoot, 'chapters', { enumerable: true, get: trap }); error(() => execute(getRoot), 'E_SCHEMA', '$.chapters');
  const nested = input([event('setup')]); Object.defineProperty(nested.chapters[0].events[0], 'threadId', { enumerable: true, get: trap }); error(() => execute(nested), 'E_SCHEMA', '$.chapters[0].events[0].threadId');
  const getIndex = input(); getIndex.chapters[0].events.length = 1; Object.defineProperty(getIndex.chapters[0].events, 0, { enumerable: true, get: trap }); error(() => execute(getIndex), 'E_SCHEMA', '$.chapters[0].events[0]');
  const custom = Object.create({ hidden: 'private-value' }); custom.chapters = []; error(() => execute(custom), 'E_SCHEMA', '$');
  error(() => execute(input([event('setup', { toString: trap, valueOf: trap })])), 'E_SCHEMA', '$.chapters[0].events[0].threadId');
  assert.equal(calls, 0);
  const nullPrototype = Object.assign(Object.create(null), input([event('setup')]));
  assert.deepEqual(execute(nullPrototype), run(input([event('setup')])));
});

test('direct calls reject sparse/extended arrays, symbols, hidden fields and functions', () => {
  const holes = input(); holes.chapters[0].events = Array(1); error(() => execute(holes), 'E_SCHEMA', '$.chapters[0].events');
  const disguisedHole = input(); disguisedHole.chapters[0].events = Array(1); disguisedHole.chapters[0].events.extra = true; error(() => execute(disguisedHole), 'E_SCHEMA', '$.chapters[0].events[0]');
  const extra = input(); extra.chapters.extra = 'private-extra-marker'; error(() => execute(extra), 'E_SCHEMA', '$.chapters', ['private-extra-marker']);
  const symbol = input(); symbol[Symbol('private-symbol-marker')] = true; error(() => execute(symbol), 'E_SCHEMA', '$', ['private-symbol-marker']);
  const hidden = input(); Object.defineProperty(hidden, 'chapters', { value: [], enumerable: false }); error(() => execute(hidden), 'E_SCHEMA', '$.chapters');
  const customArray = input(); Object.setPrototypeOf(customArray.chapters, null); error(() => execute(customArray), 'E_SCHEMA', '$.chapters');
  error(() => execute({ chapters: () => [] }), 'E_SCHEMA', '$.chapters');
});

test('chapter and per-chapter event limits accept the bound and reject one beyond', () => {
  assert.equal(run({ chapters: Array.from({ length: 500 }, (_, i) => chapter(`c${i}`)) }).chapterCount, 500);
  invalid({ chapters: Array.from({ length: 501 }, (_, i) => chapter(`c${i}`)) }, 'E_LIMIT', '$.chapters');
  const thousand = Array.from({ length: 1000 }, () => event('setup'));
  assert.equal(run(input(thousand)).eventCount, 1000);
  invalid(input([...thousand, event('setup')]), 'E_LIMIT', '$.chapters[0].events');
});

test('aggregate event limit is independent of each chapter limit and is enforced before the next array is traversed', () => {
  const chapters = Array.from({ length: 10 }, (_, i) => chapter(`c${i}`, Array.from({ length: 1000 }, () => event('setup'))));
  const excessive = { chapters: [...chapters, chapter('last', [event('setup')])] };
  assert.doesNotThrow(() => validate(schema, excessive));
  error(() => run(excessive), 'E_LIMIT', '$.chapters[10].events');
  let calls = 0; const unsafe = {}; Object.defineProperty(unsafe, 'threadId', { enumerable: true, get() { calls++; return 't'; } });
  error(() => execute({ chapters: [...chapters, chapter('last', [unsafe])] }), 'E_LIMIT', '$.chapters[10].events');
  assert.equal(calls, 0);
});

test('maximum distinct threads fit bounded JSON output and do not turn open threads into errors', () => {
  const value = { chapters: Array.from({ length: 500 }, (_, c) => chapter(`c${c}`, Array.from({ length: 20 }, (_, e) => event('setup', `thread${c * 20 + e}`)))) };
  const result = run(value);
  assert.equal(result.eventCount, 10000); assert.equal(result.threadCount, 10000);
  assert.deepEqual(result.statusCounts, { open: 10000, 'paid-off': 0, 'payoff-only': 0 });
  assert.equal(result.needsReview, false); assert.equal(result.totalIssues, 0);
  assert.deepEqual(result.threads.at(-1).firstOccurrence, position(499, 19));
  assert.ok(Buffer.byteLength(JSON.stringify(result, null, 2)) < 8 * 1024 * 1024);
});

test('findings retain first 500 chronological examples but count every family through all 10000 events', () => {
  const sequence = [...Array(1000).fill('payoff'), 'setup', ...Array(2999).fill('setup'), 'payoff', ...Array(5999).fill('payoff')];
  const value = { chapters: Array.from({ length: 10 }, (_, c) => chapter(`c${c}`, sequence.slice(c * 1000, c * 1000 + 1000).map(kind => event(kind)))) };
  const result = run(value), thread = result.threads[0];
  assert.equal(result.eventCount, 10000); assert.equal(result.totalIssues, 9998);
  assert.equal(result.issues.length, 500); assert.equal(result.truncated, true);
  assert.deepEqual(result.issueCounts, { PAYOFF_BEFORE_SETUP: 1000, REPEATED_SETUP: 2999, REPEATED_PAYOFF: 5999 });
  assert.ok(result.issues.every(row => row.code === 'PAYOFF_BEFORE_SETUP'));
  assert.equal(result.issues[0].path, '$.chapters[0].events[0]'); assert.equal(result.issues.at(-1).path, '$.chapters[0].events[499]');
  assert.equal(thread.status, 'paid-off'); assert.deepEqual(thread.firstSetup, position(1, 0)); assert.deepEqual(thread.firstMatchedPayoff, position(4, 0));
  assert.equal(thread.setupCount, 3000); assert.equal(thread.payoffCount, 7000);
  assert.equal(thread.payoffCount, thread.payoffBeforeSetupCount + thread.repeatedPayoffCount + 1);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 200000);
});

test('the 500-example boundary is exact and finding truncation never truncates thread summaries', () => {
  const atCap = run(input(Array.from({ length: 500 }, (_, i) => event('payoff', `t${i}`))));
  assert.equal(atCap.issues.length, 500); assert.equal(atCap.totalIssues, 500); assert.equal(atCap.truncated, false);
  const above = run(input(Array.from({ length: 501 }, (_, i) => event('payoff', `t${i}`))));
  assert.equal(above.issues.length, 500); assert.equal(above.totalIssues, 501); assert.equal(above.truncated, true);
  assert.equal(above.threads.length, 501); assert.equal(above.threads[500].status, 'payoff-only');
});

test('all messages are static bilingual review diagnostics, without echoing chapter/thread IDs', () => {
  const result = run(input([event('payoff'), event('setup'), event('setup'), event('payoff'), event('payoff')]));
  const encoded = JSON.stringify(result);
  assert.ok(!encoded.includes('private-thread-marker')); assert.ok(!encoded.includes('private-chapter-marker'));
  for (const issue of result.issues) {
    assert.match(issue.message, /\p{Script=Han}.* \/ [A-Z]/u); assert.equal(issue.severity, 'review');
    assert.match(issue.path, /^\$\.chapters\[[0-9]+\]\.events\[[0-9]+\]$/);
    assert.deepEqual(Object.keys(issue).sort(), ['code', 'message', 'path', 'severity', 'threadIndex']);
  }
  const other = run({ chapters: [chapter('another-private-chapter', ['payoff', 'setup', 'setup', 'payoff', 'payoff'].map(kind => event(kind, 'another-private-thread')))] });
  assert.deepEqual(other, result);
});

test('frozen input is unchanged, repeat calls deterministic, output has no aliases to input or earlier results', () => {
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const value = freeze(input([event('payoff'), event('setup'), event('payoff')]));
  const before = JSON.stringify(value), first = run(value), second = run(value);
  assert.equal(JSON.stringify(value), before); assert.deepEqual(first, second);
  first.threads[0].firstOccurrence.chapterIndex = 99;
  first.threads[0].firstSetup.eventIndex = 99;
  first.issueCounts.PAYOFF_BEFORE_SETUP = 99; first.issues.reverse();
  assert.deepEqual(run(value), second); assert.equal(JSON.stringify(value), before);
  const simple = run(input([event('setup')]));
  simple.threads[0].firstOccurrence.eventIndex = 99;
  assert.deepEqual(simple.threads[0].firstSetup, position(0, 0));
  assert.deepEqual(JSON.parse(JSON.stringify(second)), second);
  const inspect = item => {
    assert.notEqual(typeof item, 'bigint'); assert.notEqual(typeof item, 'undefined');
    if (typeof item === 'number') assert.ok(Number.isSafeInteger(item) && item >= 0);
    if (item && typeof item === 'object') Object.values(item).forEach(inspect);
  };
  inspect(second);
});
