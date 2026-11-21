import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { researchQuoteSchemas, researchQuoteImplementations } from './research-quotes.mjs';

const operation = 'research.quote-check';
const schema = researchQuoteSchemas[operation];
const execute = researchQuoteImplementations[operation];
// Independent of registration/catalog integration. Normal data first exercises
// the shared closed schema, then calls this implementation directly.
const run = input => execute(validate(schema, input));
const quote = (id, sourceId, startLine, endLine, quotedLines) => ({ id, sourceId, startLine, endLine, quotedLines });
const one = (text = 'Literal line', quoted = text) => ({ sources: [{ id: 'source', lines: [text] }], quotes: [quote('quote', 'source', 1, 1, [quoted])] });
const emptyCounts = () => ({ MISSING_SOURCE: 0, OUT_OF_RANGE: 0, LINE_COUNT_MISMATCH: 0, TEXT_MISMATCH: 0 });
function expectError(action, code, path, hidden = []) {
  assert.throws(action, error => {
    assert.equal(error.name, 'CapabilityError'); assert.equal(error.code, code);
    if (path !== undefined) assert.equal(error.path, path);
    assert.match(error.message, /\p{Script=Han}.* \/ [A-Z]/u);
    assert.ok(error.message.length < 100);
    for (const value of hidden) assert.ok(!`${error.message} ${error.path}`.includes(value));
    return true;
  });
}
function invalid(input, code, path, hidden = []) {
  expectError(() => validate(schema, input), code, path, hidden);
  expectError(() => execute(input), code, path, hidden);
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

// Public project text copied from capabilities/schema.mjs:1-4 and
// skills/omni-research/SKILL.md:6-8 after reading those actual files. Deliberate
// fixed fixtures, not filesystem access, original-line authentication or eval.
const realSchemaExcerpt = [
  '// Native, bounded JSON-schema subset. No coercion, evaluation or remote references.',
  'export class CapabilityError extends Error {',
  "  constructor(code, message, path = '$') { super(message); this.name = 'CapabilityError'; this.code = code; this.path = path; }",
  '}'
];
const realResearchExcerpt = ['# 研究、阅读与学习 / Research, reading and learning', '', '## 研究契约 / Research contract'];
function fixture() {
  return {
    sources: [{ id: 'schema-excerpt', lines: [...realSchemaExcerpt] }, { id: 'research-excerpt', lines: [...realResearchExcerpt] }],
    quotes: [quote('constructor-lines', 'schema-excerpt', 2, 3, realSchemaExcerpt.slice(1, 3)),
      quote('heading-and-blank', 'research-excerpt', 1, 3, [...realResearchExcerpt]), quote('last-line', 'schema-excerpt', 4, 4, ['}'])]
  };
}

test('exports exactly one operation with recursively frozen, closed and finite schemas', () => {
  assert.deepEqual(Object.keys(researchQuoteSchemas), [operation]);
  assert.deepEqual(Object.keys(researchQuoteImplementations), [operation]);
  assert.equal(typeof execute, 'function');
  assert.deepEqual(schema.required, ['sources', 'quotes']);
  const seen = new Set();
  function inspect(value) {
    if (seen.has(value)) return; seen.add(value);
    assert.equal(Object.isFrozen(value), true);
    if (value.type === 'object') {
      assert.equal(value.additionalProperties, false);
      Object.values(value.properties).forEach(inspect);
    } else if (value.type === 'array') {
      assert.ok(Number.isSafeInteger(value.maxItems) && value.maxItems > 0); inspect(value.items);
    } else if (value.type === 'string') assert.ok(Number.isSafeInteger(value.maxLength));
    else { assert.equal(value.type, 'integer'); assert.equal(value.minimum, 1); assert.equal(value.maximum, Number.MAX_SAFE_INTEGER); }
  }
  inspect(schema);
  assert.throws(() => { schema.properties.sources.maxItems = Infinity; }, TypeError);
});

test('actual fixed source excerpts match inclusive positions including blank lines and indentation', () => {
  const input = fixture(), result = run(input);
  assert.equal(result.valid, true);
  assert.equal(result.sourceCount, 2); assert.equal(result.quoteCount, 3);
  assert.equal(result.sourceLineCount, 7); assert.equal(result.quotedLineCount, 6); assert.equal(result.suppliedLineCount, 13);
  const expectedUnits = [...input.sources.flatMap(item => item.lines), ...input.quotes.flatMap(item => item.quotedLines)].reduce((sum, value) => sum + value.length, 0);
  assert.equal(result.textCodeUnits, expectedUnits);
  assert.equal(result.matchedQuoteCount, 3); assert.equal(result.comparedQuoteCount, 3);
  assert.equal(result.comparedLineCount, 6); assert.equal(result.mismatchedLineCount, 0);
  assert.deepEqual(result.results, [2, 3, 1].map((count, quoteIndex) => ({ quoteIndex, status: 'matched', comparedLineCount: count, mismatchedLineCount: 0, firstMismatchLine: null })));
  assert.deepEqual(result.issues, []); assert.equal(result.totalIssues, 0);
  assert.deepEqual(result.issueCounts, emptyCounts()); assert.equal(result.truncated, false);
});

test('source and quote indices are explicit and a pass is not source authenticity or entailment', () => {
  const result = run(fixture());
  assert.equal(result.scope, 'supplied-source-lines-only');
  assert.equal(result.lineCoordinates, '1-based-inclusive-within-supplied-source');
  assert.equal(result.quoteIndexBase, 0); assert.equal(result.matchingMethod, 'exact-line-equality-no-normalization');
  for (const field of ['sourceFilesRead', 'externalContentFetched', 'sourceAuthenticityVerified', 'sourceCompletenessVerified', 'originalSourceLineNumbersVerified', 'claimSupportEvaluated']) assert.equal(result[field], false);
  assert.match(result.limitation, /No source-file reads, network or PDF parsing/);
  assert.match(result.limitation, /not authenticity, completeness, original coordinates or claim support/);
});

test('missing sources, source bounds, wrong line counts and wrong text have distinct stable results', () => {
  const input = { sources: [{ id: 's', lines: ['A', 'B', 'C', 'B'] }], quotes: [
    quote('missing', 'absent', 1, 1, ['A']), quote('reversed', 's', 3, 2, ['B']),
    quote('outside', 's', 5, 5, ['B']), quote('short', 's', 1, 2, ['A']),
    quote('different', 's', 1, 2, ['A', 'x']), quote('right', 's', 2, 2, ['B']),
    quote('wrong-location', 's', 1, 1, ['B'])
  ] };
  const result = run(input);
  assert.equal(result.valid, false); assert.equal(result.totalIssues, 6);
  assert.deepEqual(result.issueCounts, { MISSING_SOURCE: 1, OUT_OF_RANGE: 2, LINE_COUNT_MISMATCH: 1, TEXT_MISMATCH: 2 });
  assert.deepEqual(result.results.map(row => row.status), ['missing-source', 'out-of-range', 'out-of-range', 'line-count-mismatch', 'text-mismatch', 'matched', 'text-mismatch']);
  assert.deepEqual(result.issues.map(row => row.path), ['$.quotes[0].sourceId', '$.quotes[1]', '$.quotes[2]', '$.quotes[3].quotedLines', '$.quotes[4].quotedLines[1]', '$.quotes[6].quotedLines[0]']);
  assert.equal(result.matchedQuoteCount, 1); assert.equal(result.comparedQuoteCount, 3);
  assert.equal(result.comparedLineCount, 4); assert.equal(result.mismatchedLineCount, 2);
  assert.deepEqual(result.results.map(row => row.mismatchedLineCount), [null, null, null, null, 1, 0, 1]);
  assert.deepEqual(result.results.map(row => row.firstMismatchLine), [null, null, null, null, 2, null, 1]);
});

test('a quote elsewhere in the same or another supplied source cannot repair its wrong position', () => {
  const input = { sources: [{ id: 's', lines: ['wrong', 'quoted', 'wrong', 'quoted'] }, { id: 'other', lines: ['quoted'] }],
    quotes: [quote('q0', 's', 1, 1, ['quoted']), quote('q1', 's', 3, 3, ['quoted']), quote('q2', 'missing', 1, 1, ['quoted'])] };
  const result = run(input);
  assert.deepEqual(result.results.map(row => row.status), ['text-mismatch', 'text-mismatch', 'missing-source']);
  assert.deepEqual(result.results.map(row => row.firstMismatchLine), [1, 3, null]);
  assert.equal(result.matchedQuoteCount, 0);
});

test('both range endpoints are inclusive and arrays are not compared by concatenating lines', () => {
  const result = run({ sources: [{ id: 's', lines: ['A', 'B', ''] }], quotes: [
    quote('full', 's', 1, 3, ['A', 'B', '']), quote('last', 's', 3, 3, ['']),
    quote('joined', 's', 1, 2, ['AB']), quote('none', 's', 3, 3, []), quote('extra', 's', 1, 1, ['A', ''])
  ] });
  assert.deepEqual(result.results.map(row => row.status), ['matched', 'matched', 'line-count-mismatch', 'line-count-mismatch', 'line-count-mismatch']);
  assert.equal(result.comparedLineCount, 4); assert.equal(result.issueCounts.LINE_COUNT_MISMATCH, 3);
});

test('all comparable mismatched lines are counted, without echoing them or stopping at the first', () => {
  const result = run({ sources: [{ id: 's', lines: ['alpha', 'beta', 'gamma', 'delta'] }], quotes: [
    quote('q0', 's', 1, 4, ['different', 'beta', 'different', 'different']), quote('q1', 's', 2, 4, ['different', 'gamma', 'different'])
  ] });
  assert.equal(result.totalIssues, 2); assert.equal(result.issueCounts.TEXT_MISMATCH, 2);
  assert.equal(result.mismatchedLineCount, 5); assert.equal(result.comparedLineCount, 7);
  assert.deepEqual(result.results.map(row => [row.mismatchedLineCount, row.firstMismatchLine]), [[3, 1], [2, 2]]);
});

test('huge safe-integer and reversed coordinates are bounded failures rather than allocation requests', () => {
  const max = Number.MAX_SAFE_INTEGER;
  const result = run({ sources: [{ id: 's', lines: ['A'] }, { id: 'empty', lines: [] }], quotes: [
    quote('huge', 's', max, max, []), quote('reversed', 's', max, 1, []), quote('end-huge', 's', 1, max, ['A']),
    quote('empty', 'empty', 1, 1, ['']), quote('missing', 'missing', max, 1, [])
  ] });
  assert.deepEqual(result.results.map(row => row.status), ['out-of-range', 'out-of-range', 'out-of-range', 'out-of-range', 'missing-source']);
  assert.equal(result.comparedLineCount, 0); assert.equal(result.mismatchedLineCount, 0);
});

test('empty arrays and blank lines distinguish zero work, empty supplied sources and literal empty text', () => {
  const empty = run({ sources: [], quotes: [] });
  assert.equal(empty.valid, true); assert.equal(empty.quoteCount, 0); assert.equal(empty.sourceCount, 0);
  assert.equal(empty.suppliedLineCount, 0); assert.equal(empty.textCodeUnits, 0); assert.deepEqual(empty.results, []);
  assert.deepEqual(empty.issueCounts, emptyCounts());
  assert.equal(run(one('')).results[0].status, 'matched');
  assert.equal(run(one('', ' ')).results[0].status, 'text-mismatch');
  assert.equal(run({ sources: [{ id: 'source', lines: [] }], quotes: one().quotes }).results[0].status, 'out-of-range');
});

test('lookup is case-sensitive, safe for object-like names and does not conflate ID namespaces', () => {
  const input = { sources: [{ id: 'Source', lines: ['A'] }, { id: 'toString', lines: ['B'] }], quotes: [
    quote('Source', 'Source', 1, 1, ['A']), quote('same-namespace-allowed', 'toString', 1, 1, ['B']),
    quote('case', 'source', 1, 1, ['A']), quote('prototype-member', 'hasOwnProperty', 1, 1, ['B'])
  ] };
  assert.deepEqual(run(input).results.map(row => row.status), ['matched', 'matched', 'missing-source', 'missing-source']);
});

test('Unicode, whitespace, BOM, invisible marks and even lone code units are never normalized', () => {
  const pairs = [['é', 'e\u0301'], ['Hello', 'hello'], ['line ', 'line'], ['\tline', ' line'], ['\u00a0line', ' line'],
    ['\ufeffline', 'line'], ['👩‍🔬', '👩🔬'], ['✈️', '✈'], ['', ' '], ['\ud800', '\ufffd'], ['\udc00', '\ufffd'], ['a\0b', 'ab']];
  for (const [actual, different] of pairs) {
    assert.equal(run(one(actual)).results[0].status, 'matched');
    assert.equal(run(one(actual, different)).results[0].status, 'text-mismatch');
  }
});

test('embedded line-break families are rejected in both source and quoted lines, including at the end', () => {
  for (const separator of ['\n', '\r', '\r\n', '\v', '\f', '\u0085', '\u2028', '\u2029']) {
    for (const value of [`before${separator}after`, `before${separator}`]) {
      const source = one(); source.sources[0].lines = [value];
      invalid(source, 'E_SCHEMA', '$.sources[0].lines[0]');
      const quoted = one(); quoted.quotes[0].quotedLines = [value];
      invalid(quoted, 'E_SCHEMA', '$.quotes[0].quotedLines[0]');
    }
  }
});

test('source order and consistent opaque-ID renaming do not affect output; quote order stays supplied order', () => {
  const input = fixture(); input.quotes[1].quotedLines[0] = 'different';
  const original = run(input);
  assert.deepEqual(run({ ...input, sources: [...input.sources].reverse() }), original);
  const renamed = structuredClone(input);
  renamed.sources.forEach((value, i) => { const old = value.id; value.id = `renamed-${i}`; renamed.quotes.filter(row => row.sourceId === old).forEach(row => { row.sourceId = value.id; }); });
  renamed.quotes.forEach((value, i) => { value.id = `new-quote-${i}`; });
  assert.deepEqual(run(renamed), original);
  assert.deepEqual(run({ ...input, quotes: [input.quotes[1], input.quotes[0], input.quotes[2]] }).results.map(row => row.status), ['text-mismatch', 'matched', 'matched']);
  assert.equal(JSON.stringify(run(input)), JSON.stringify(run(input)));
});

test('result privacy includes IDs and raw text even in missing, out-of-range and mismatch reports', () => {
  const secretSource = 'private-source-9dd4', secretQuote = 'private-quote-c14e', secretText = 'PRIVATE_SOURCE_BODY_8704', secretCitation = 'PRIVATE_QUOTED_BODY_6592';
  const input = { sources: [{ id: secretSource, lines: [secretText] }], quotes: [
    quote(secretQuote, secretSource, 1, 1, [secretText]), quote('q1', secretSource, 1, 1, [secretCitation]),
    quote('q2', 'private-missing-593b', 1, 1, [secretCitation]), quote('q3', secretSource, 2, 2, [secretCitation])
  ] };
  const result = run(input), encoded = JSON.stringify(result);
  for (const value of [secretSource, secretQuote, secretText, secretCitation, 'private-missing-593b']) assert.equal(encoded.includes(value), false);
  for (const row of result.results) assert.deepEqual(Object.keys(row), ['quoteIndex', 'status', 'comparedLineCount', 'mismatchedLineCount', 'firstMismatchLine']);
  assert.equal(result.totalIssues, 3);
});

test('input instructions, paths and URLs remain inert line data; no echo or opt-in execution field exists', () => {
  const instruction = 'globalThis.__quote_data_must_not_execute_8f31 = true; https://example.invalid/never-fetch file:///never-read';
  assert.equal(Object.hasOwn(globalThis, '__quote_data_must_not_execute_8f31'), false);
  const result = run(one(instruction));
  assert.equal(result.valid, true); assert.equal(JSON.stringify(result).includes(instruction), false);
  assert.equal(Object.hasOwn(globalThis, '__quote_data_must_not_execute_8f31'), false);
  invalid({ ...one(), echo: true }, 'E_SCHEMA', '$');
  invalid({ ...one(), execute: instruction }, 'E_SCHEMA', '$', [instruction]);
});

test('duplicate source/quote IDs fail without echo, even when their data or coordinates differ', () => {
  const secret = 'private-duplicate-id-42';
  expectError(() => run({ sources: [{ id: secret, lines: ['A'] }, { id: secret, lines: ['B'] }], quotes: [] }), 'E_DUPLICATE', '$.sources[1].id', [secret]);
  expectError(() => run({ sources: [], quotes: [quote(secret, 'missing', 1, 1, ['A']), quote(secret, 'other', 2, 1, ['B'])] }), 'E_DUPLICATE', '$.quotes[1].id', [secret]);
  const input = one(); input.sources.push({ id: 'Source', lines: ['different'] }); input.quotes.push(quote('Quote', 'Source', 1, 1, ['different']));
  assert.equal(run(input).matchedQuoteCount, 2);
});

test('IDs reject reserved names, whitespace, line endings and noncanonical text without coercion', () => {
  for (const value of ['__proto__', 'constructor', 'prototype', 'x/y', 'x\\y', 'x y', ' x', 'x ', 'x\n', 'x\r', 'x\u2028', 'x\0', 'é', '.x', 42, null, false]) {
    for (const [where, path] of [['source', '$.sources[0].id'], ['quote', '$.quotes[0].id'], ['reference', '$.quotes[0].sourceId']]) {
      const input = one();
      if (where === 'source') input.sources[0].id = value;
      else input.quotes[0][where === 'quote' ? 'id' : 'sourceId'] = value;
      invalid(input, 'E_SCHEMA', path);
    }
  }
  const sourceId = 's' + 'x'.repeat(99), quoteId = 'q' + 'x'.repeat(99);
  assert.equal(run({ sources: [{ id: sourceId, lines: ['A'] }], quotes: [quote(quoteId, sourceId, 1, 1, ['A'])] }).valid, true);
});

test('coordinates reject zero, negatives, unsafe/nonfinite values, wrong types and missing fields', () => {
  for (const value of [0, -0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -Infinity, '1', null, true, {}]) {
    for (const field of ['startLine', 'endLine']) {
      const input = one(); input.quotes[0][field] = value;
      invalid(input, 'E_SCHEMA', `$.quotes[0].${field}`);
    }
  }
  for (const key of schema.required) { const input = one(); delete input[key]; invalid(input, 'E_SCHEMA', `$.${key}`); }
  for (const key of schema.properties.sources.items.required) { const input = one(); delete input.sources[0][key]; invalid(input, 'E_SCHEMA', `$.sources[0].${key}`); }
  for (const key of schema.properties.quotes.items.required) { const input = one(); delete input.quotes[0][key]; invalid(input, 'E_SCHEMA', `$.quotes[0].${key}`); }
});

test('line and container types are strict and failures never contain supplied text', () => {
  for (const value of [null, [], {}, 42, NaN, Infinity, false, undefined, 1n, Symbol('private-symbol')]) {
    const source = one(); source.sources[0].lines = [value]; invalid(source, 'E_SCHEMA', '$.sources[0].lines[0]');
    const quoted = one(); quoted.quotes[0].quotedLines = [value]; invalid(quoted, 'E_SCHEMA', '$.quotes[0].quotedLines[0]');
  }
  for (const value of [null, [], 42, 'private-root-text']) invalid(value, 'E_SCHEMA', '$');
  invalid({ ...one(), sources: {} }, 'E_SCHEMA', '$.sources');
  invalid({ ...one(), quotes: 'private-quotes-text' }, 'E_SCHEMA', '$.quotes', ['private-quotes-text']);
  const input = one(); input.sources[0].lines = 'not an array'; invalid(input, 'E_SCHEMA', '$.sources[0].lines');
});

test('unknown keys and free values are rejected at every object depth without reflection', () => {
  for (const key of ['private-key-71c2', 'private-key-'.repeat(1000), '__proto__', 'constructor', 'prototype', 'url', 'title', 'notes']) {
    const secret = 'PRIVATE_FREE_FIELD_VALUE_032a';
    const root = { ...one(), [key]: secret };
    const source = one(); source.sources[0] = { ...source.sources[0], [key]: secret };
    const quoted = one(); quoted.quotes[0] = { ...quoted.quotes[0], [key]: secret };
    for (const [input, path] of [[root, '$'], [source, '$.sources[0]'], [quoted, '$.quotes[0]']]) invalid(input, 'E_SCHEMA', path, [key, secret]);
  }
});

test('source/quote/item/line and ID limits accept their boundaries and reject the next value', () => {
  const sources = Array.from({ length: 100 }, (_, i) => ({ id: `s${i}`, lines: [] }));
  assert.equal(run({ sources, quotes: [] }).sourceCount, 100);
  invalid({ sources: [...sources, { id: 'extra', lines: [] }], quotes: [] }, 'E_LIMIT', '$.sources');
  const quotes = Array.from({ length: 1000 }, (_, i) => quote(`q${i}`, 'source', 1, 1, ['A']));
  assert.equal(run({ sources: [{ id: 'source', lines: ['A'] }], quotes }).matchedQuoteCount, 1000);
  invalid({ sources: [], quotes: [...quotes, quote('extra', 'source', 1, 1, ['A'])] }, 'E_LIMIT', '$.quotes');
  const full = { sources: [{ id: 's', lines: Array(10000).fill('') }], quotes: [quote('q', 's', 1, 10000, Array(10000).fill(''))] };
  assert.equal(run(full).comparedLineCount, 10000); assert.equal(run(full).suppliedLineCount, 20000);
  invalid({ sources: [{ id: 's', lines: Array(10001).fill('') }], quotes: [] }, 'E_LIMIT', '$.sources[0].lines');
  invalid({ sources: [], quotes: [quote('q', 's', 1, 1, Array(10001).fill(''))] }, 'E_LIMIT', '$.quotes[0].quotedLines');
  assert.equal(run(one('字'.repeat(10000))).valid, true);
  const longSource = one(); longSource.sources[0].lines = ['a'.repeat(10001)]; invalid(longSource, 'E_LIMIT', '$.sources[0].lines[0]');
  const longQuote = one(); longQuote.quotes[0].quotedLines = ['a'.repeat(10001)]; invalid(longQuote, 'E_LIMIT', '$.quotes[0].quotedLines[0]');
  for (const field of ['id', 'sourceId']) { const input = one(); input.quotes[0][field] = 'x'.repeat(101); invalid(input, 'E_LIMIT', `$.quotes[0].${field}`); }
  const sourceId = one(); sourceId.sources[0].id = 'x'.repeat(101); invalid(sourceId, 'E_LIMIT', '$.sources[0].id');
  const blankId = one(); blankId.sources[0].id = ''; invalid(blankId, 'E_LIMIT', '$.sources[0].id');
});

test('aggregate lines include unused source lines and missing-source quote lines', () => {
  const sources = [{ id: 'a', lines: Array(10000).fill('') }, { id: 'b', lines: Array(10000).fill('') }];
  assert.equal(run({ sources, quotes: [] }).suppliedLineCount, 20000);
  expectError(() => run({ sources: [...sources, { id: 'c', lines: [''] }], quotes: [] }), 'E_LIMIT');
  const quotes = [quote('a', 'missing', 1, 1, Array(10000).fill('')), quote('b', 'missing', 1, 1, Array(10000).fill(''))];
  assert.equal(run({ sources: [], quotes }).issueCounts.MISSING_SOURCE, 2);
  expectError(() => run({ sources: [], quotes: [...quotes, quote('c', 'missing', 1, 1, [''])] }), 'E_LIMIT');
});

test('aggregate UTF-16 text units count repeated citations and non-BMP text without approximation', () => {
  for (const text of ['a'.repeat(5000), '🧪'.repeat(2500)]) {
    const lines = Array(100).fill(text);
    const input = { sources: [{ id: 's', lines }], quotes: [quote('q', 's', 1, 100, [...lines])] };
    const result = run(input);
    assert.equal(result.textCodeUnits, 1000000); assert.equal(result.valid, true);
    expectError(() => run({ ...input, sources: [...input.sources, { id: 'unused', lines: ['x'] }] }), 'E_LIMIT');
  }
  const missing = { sources: [], quotes: [quote('q', 'absent', 1, 1, Array(1000).fill('x'.repeat(1000)))] };
  assert.equal(run(missing).textCodeUnits, 1000000);
  expectError(() => run({ ...missing, quotes: [...missing.quotes, quote('q2', 'absent', 1, 1, ['x'])] }), 'E_LIMIT');
});

test('issue samples and output size are bounded while result rows and aggregate counts stay complete', () => {
  const secret = 'PRIVATE_TEXT_NOT_TO_ECHO_42cb';
  const quotes = Array.from({ length: 1000 }, (_, i) => quote(`private-quote-${i}`, 'private-missing-source-54f2', 1, 1, [secret]));
  const result = run({ sources: [], quotes });
  assert.equal(result.valid, false); assert.equal(result.totalIssues, 1000); assert.equal(result.issues.length, 500); assert.equal(result.truncated, true);
  assert.deepEqual(result.issueCounts, { ...emptyCounts(), MISSING_SOURCE: 1000 });
  assert.equal(result.results.length, 1000);
  assert.deepEqual(result.results.map(row => row.quoteIndex), quotes.map((_, i) => i));
  assert.equal(result.issues[499].path, '$.quotes[499].sourceId');
  const encoded = JSON.stringify(result);
  assert.ok(Buffer.byteLength(encoded) < 300000);
  for (const value of [secret, 'private-quote-', 'private-missing-source-54f2']) assert.equal(encoded.includes(value), false);
});

test('inputs are frozen-safe and unchanged; result mutation cannot change a future check', () => {
  const input = freeze(fixture()), before = JSON.stringify(input);
  const first = run(input), expected = run(input);
  first.results[0].status = 'changed-output'; first.issues.push({ code: 'OUTPUT_ONLY' }); first.issueCounts.MISSING_SOURCE = 999;
  assert.deepEqual(run(input), expected); assert.equal(JSON.stringify(input), before);
  assert.deepEqual(JSON.parse(JSON.stringify(expected)), expected);
});

test('direct implementation rejects accessors without invoking any caller callback', () => {
  let effects = 0;
  const trap = () => { effects++; throw new Error('private callback should not execute'); };
  const root = one(); Object.defineProperty(root, 'sources', { enumerable: true, get: trap });
  expectError(() => execute(root), 'E_SCHEMA', '$.sources');
  const source = one(); Object.defineProperty(source.sources[0], 'lines', { enumerable: true, get: trap });
  expectError(() => execute(source), 'E_SCHEMA', '$.sources[0].lines');
  const quoted = one(); Object.defineProperty(quoted.quotes[0], 'quotedLines', { enumerable: true, get: trap });
  expectError(() => execute(quoted), 'E_SCHEMA', '$.quotes[0].quotedLines');
  const item = one(); Object.defineProperty(item.quotes[0].quotedLines, '0', { enumerable: true, get: trap });
  expectError(() => execute(item), 'E_SCHEMA', '$.quotes[0].quotedLines[0]');
  const unknown = one(); Object.defineProperty(unknown, 'private-accessor-name', { enumerable: true, get: trap });
  expectError(() => execute(unknown), 'E_SCHEMA', '$', ['private-accessor-name']);
  assert.equal(effects, 0);
});

test('direct implementation rejects proxies, revoked proxies and functions before running traps', () => {
  let effects = 0;
  const trap = () => { effects++; throw new Error('private proxy must not run'); };
  const traps = { get: trap, ownKeys: trap, getPrototypeOf: trap, getOwnPropertyDescriptor: trap };
  expectError(() => execute(new Proxy(one(), traps)), 'E_SCHEMA', '$');
  const nested = one(); nested.sources[0] = new Proxy(nested.sources[0], traps); expectError(() => execute(nested), 'E_SCHEMA', '$.sources[0]');
  const array = one(); array.quotes[0].quotedLines = new Proxy(array.quotes[0].quotedLines, traps); expectError(() => execute(array), 'E_SCHEMA', '$.quotes[0].quotedLines');
  const lineProxy = one(); lineProxy.sources[0].lines[0] = new Proxy({}, traps); expectError(() => execute(lineProxy), 'E_SCHEMA', '$.sources[0].lines[0]');
  const revoked = Proxy.revocable([], traps); revoked.revoke();
  expectError(() => execute({ ...one(), quotes: revoked.proxy }), 'E_SCHEMA', '$.quotes');
  expectError(() => execute(trap), 'E_SCHEMA', '$');
  assert.equal(effects, 0);
});

test('direct implementation rejects non-JSON containers, sparse arrays, symbols and hidden properties', () => {
  const sparse = one(); sparse.sources[0].lines = Array(1); expectError(() => execute(sparse), 'E_SCHEMA', '$.sources[0].lines');
  const extra = one(); extra.quotes.extra = 'private-extra'; expectError(() => execute(extra), 'E_SCHEMA', '$.quotes', ['private-extra']);
  expectError(() => execute({ ...one(), [Symbol('private-symbol')]: 'private-value' }), 'E_SCHEMA', '$', ['private-symbol', 'private-value']);
  expectError(() => execute(Object.defineProperty(one(), 'hidden', { value: true })), 'E_SCHEMA', '$');
  expectError(() => execute(Object.assign(Object.create({ inherited: true }), one())), 'E_SCHEMA', '$');
  const nullArray = one(); Object.setPrototypeOf(nullArray.sources, null); expectError(() => execute(nullArray), 'E_SCHEMA', '$.sources');
  const boxed = one(); boxed.quotes[0].quotedLines[0] = new String('private-boxed'); expectError(() => execute(boxed), 'E_SCHEMA', '$.quotes[0].quotedLines[0]', ['private-boxed']);
  const normal = one();
  const nullObject = Object.assign(Object.create(null), normal);
  nullObject.sources[0] = Object.assign(Object.create(null), normal.sources[0]);
  assert.deepEqual(run(nullObject), run(one()));
});

test('small exhaustive supplied-line oracle checks position, count, text and missing-source precedence', () => {
  const sequences = [[]];
  for (let length = 1; length <= 3; length++) for (let mask = 0; mask < 2 ** length; mask++) sequences.push(Array.from({ length }, (_, i) => mask & (1 << i) ? 'X' : ''));
  const quoted = [[], [''], ['X'], ['', 'X']];
  for (const lines of sequences) for (let start = 1; start <= 4; start++) for (let end = 1; end <= 4; end++) for (const text of quoted) for (const missing of [false, true]) {
    const result = run({ sources: [{ id: 's', lines }], quotes: [quote('q', missing ? 'missing' : 's', start, end, text)] });
    let status, mismatch = null, first = null, compared = 0;
    if (missing) status = 'missing-source';
    else if (start > end || end > lines.length || start > lines.length) status = 'out-of-range';
    else {
      const selection = lines.slice(start - 1, end);
      if (selection.length !== text.length) status = 'line-count-mismatch';
      else {
        const different = selection.flatMap((value, i) => value === text[i] ? [] : [start + i]);
        mismatch = different.length; first = different[0] ?? null; compared = text.length;
        status = different.length ? 'text-mismatch' : 'matched';
      }
    }
    assert.deepEqual(result.results, [{ quoteIndex: 0, status, comparedLineCount: compared, mismatchedLineCount: mismatch, firstMismatchLine: first }]);
    assert.equal(result.valid, status === 'matched');
    assert.equal(result.totalIssues, status === 'matched' ? 0 : 1);
    assert.equal(result.mismatchedLineCount, mismatch ?? 0);
  }
});
