import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, runOperation, operations } from './operations.mjs';
import { validate, O, S } from './schema.mjs';
const run = runOperation;
const err = (fn, code) => assert.throws(fn, e => e.code === code);

test('schema rejects unknown fields, wrong types, unsafe keys and nonfinite numbers', () => {
  err(() => run('molbio.fasta', { text: '>a\nGC', alphabet: 'dna', execute: 'evil' }), 'E_SCHEMA');
  err(() => run('cyber.indicators', { text: 3 }), 'E_SCHEMA');
  err(() => validate(O({ text: S() }), JSON.parse('{"__proto__":"x"}')), 'E_SCHEMA');
  err(() => run('game.balance', { units: [{ id: 'a', hp: 1, damage: Infinity, interval: 1, cost: 1 }] }), 'E_SCHEMA');
  err(() => run('not-real', {}), 'E_OPERATION');
});
test('schema rejects bounds and missing values', () => {
  err(() => run('cyber.indicators', { text: 'x'.repeat(1000001) }), 'E_LIMIT');
  err(() => run('game.balance', { units: [] }), 'E_LIMIT');
  err(() => run('molbio.fasta', { text: '>x\nAA' }), 'E_SCHEMA');
});
test('CSV handles CRLF, escaped quotes, quoted commas/newlines and trailing empty cells', () => {
  assert.deepEqual(parseCSV('a,b\r\n"x,\nq","say ""yes"""\r\nz,\r\n'), { columns: ['a', 'b'], rows: [['x,\nq', 'say "yes"'], ['z', '']] });
});
for (const csv of ['a,a\n1,2', 'a,b\n1', 'a\n"unterminated', 'a\n"x"z', 'a\nx"z', '\n', '__proto__\nx']) test(`CSV rejects malformed ${JSON.stringify(csv)}`, () => assert.throws(() => parseCSV(csv)));
test('data.validate independently checks required, type and duplicate values', () => {
  const r = run('data.validate', { format: 'csv', text: 'id,price,enabled\nA,3,true\nA,NaN,yes\n,4,false\n', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'price', type: 'number' }, { name: 'enabled', type: 'boolean' }, { name: 'missing', type: 'string' }] });
  assert.equal(r.valid, false); assert.equal(r.rowCount, 3); assert.deepEqual(r.issues.map(i => i.code).sort(), ['MISSING_COLUMN', 'REQUIRED', 'TYPE', 'TYPE', 'UNIQUE']);
});
test('JSON validation does not coerce strings into numbers', () => {
  const base = { format: 'json', table: { columns: ['n'], rows: [[2], ['2'], [null]] }, fields: [{ name: 'n', type: 'number' }] };
  assert.deepEqual(run('data.validate', base).issues.map(i => i.code), ['TYPE']);
});
test('table input source pairing, widths and duplicate headers are explicit errors', () => {
  err(() => run('data.validate', { format: 'csv', fields: [{ name: 'a', type: 'string' }] }), 'E_INPUT');
  err(() => run('data.validate', { format: 'json', table: { columns: ['a'], rows: [[]] }, fields: [{ name: 'a', type: 'string' }] }), 'E_INPUT');
  err(() => run('data.validate', { format: 'json', text: 'a', table: { columns: ['a'], rows: [] }, fields: [{ name: 'a', type: 'string' }] }), 'E_INPUT');
});
test('transform projects, renames and filters while preserving types and order', () => {
  assert.deepEqual(run('data.transform', { format: 'json', table: { columns: ['id', 'n'], rows: [['a', 1], ['b', 2], ['c', 2]] }, select: ['n', 'id'], rename: [{ from: 'id', to: 'name' }], filter: { column: 'n', equals: 2 }, outputFormat: 'json' }), { columns: ['n', 'name'], rows: [[2, 'b'], [2, 'c']] });
});
test('CSV transform roundtrip and formula safeguards', () => {
  const x = { format: 'json', table: { columns: ['label'], rows: [['x,y'], ['=1+1']] }, select: ['label'], outputFormat: 'csv' };
  err(() => run('data.transform', x), 'E_FORMULA');
  const r = run('data.transform', { ...x, formulaPolicy: 'escape' }); assert.equal(r.text, 'label\r\n"x,y"\r\n\'=1+1\r\n');
  assert.equal(parseCSV(r.text).rows[1][0], "'=1+1");
});
test('transform unknown and duplicate output columns fail', () => {
  const x = { format: 'csv', text: 'a,b\n1,2', select: ['a', 'b'], outputFormat: 'json' };
  err(() => run('data.transform', { ...x, select: ['missing'] }), 'E_COLUMN');
  err(() => run('data.transform', { ...x, rename: [{ from: 'a', to: 'b' }] }), 'E_DUPLICATE');
  err(() => run('data.transform', { ...x, filter: { column: 'missing', equals: 1 } }), 'E_COLUMN');
});
const units = [{ id: 'a', hp: 100, damage: 20, interval: 2, cost: 5 }, { id: 'b', hp: 60, damage: 30, interval: 1, cost: 5 }];
test('game balance computes real DPS, efficiency and explicit threshold violations', () => {
  const r = run('game.balance', { units, maxEfficiencyRatio: 2 }); assert.equal(r.valid, false); assert.deepEqual(r.units, [{ id: 'a', dps: 10, efficiency: 2 }, { id: 'b', dps: 30, efficiency: 6 }]); assert.equal(r.efficiencyRatio, 3); assert.equal(r.issues[0].code, 'EFFICIENCY_RATIO');
  assert.equal(run('game.balance', { units, maxEfficiencyRatio: 3 }).valid, true);
});
test('game rejects zero denominator and duplicate identities', () => {
  err(() => run('game.balance', { units: [{ ...units[0], interval: 0 }] }), 'E_SCHEMA');
  err(() => run('game.balance', { units: [units[0], units[0]] }), 'E_DUPLICATE');
  assert.equal(run('game.balance', { units: [{ ...units[0], damage: 0 }] }).efficiencyRatio, null);
});
const canon = { entities: ['Ada'], facts: [{ entity: 'Ada', key: 'city', value: 'North', from: 0, to: 10 }], scenes: [{ id: 's1', time: 5, mentions: ['Ada'], assertions: [{ entity: 'Ada', key: 'city', value: 'North' }] }] };
test('canon accepts grounded assertion and identifies mismatches and unknown mentions', () => {
  assert.equal(run('fiction.continuity', canon).valid, true);
  const r = run('fiction.continuity', { ...canon, scenes: [{ ...canon.scenes[0], mentions: ['Nobody'], assertions: [{ entity: 'Ada', key: 'city', value: 'South' }, { entity: 'Ada', key: 'age', value: 20 }] }] });
  assert.deepEqual(r.issues.map(i => i.code), ['UNKNOWN_ENTITY', 'CANON_MISMATCH', 'UNSUPPORTED_ASSERTION']);
});
test('canon closed interval overlap conflicts and reversed ranges', () => {
  const fact = { ...canon.facts[0], from: 10, to: 20, value: 'South' }; assert.equal(run('fiction.continuity', { ...canon, facts: [...canon.facts, fact] }).issues[0].code, 'CANON_CONFLICT');
  err(() => run('fiction.continuity', { ...canon, facts: [{ ...fact, from: 30 }] }), 'E_INTERVAL');
});
test('FASTA multi-record DNA IUPAC stats have explicit GC denominators', () => {
  const r = run('molbio.fasta', { text: '>a label\r\nacgtnn\r\n>b\nNN', alphabet: 'dna' });
  assert.deepEqual(r.records[0], { id: 'a', length: 6, counts: { A: 1, C: 1, G: 1, T: 1, N: 2 }, ambiguous: 2, gcFractionAll: 2 / 6, gcFractionCanonical: 0.5 }); assert.equal(r.records[1].gcFractionCanonical, null);
  assert.equal(run('molbio.fasta', { text: '>rna\nGCUU', alphabet: 'rna' }).records[0].gcFractionAll, 0.5);
});
for (const [text, code] of [['ACGT', 'E_FASTA'], ['>a\n', 'E_FASTA'], ['>\nAC', 'E_FASTA'], ['>a\nAU', 'E_FASTA'], ['>a\nA-C', 'E_FASTA'], ['>a\nAC\n>a\nTT', 'E_DUPLICATE']]) test(`FASTA rejects ${JSON.stringify(text)}`, () => err(() => run('molbio.fasta', { text, alphabet: 'dna' }), code));
const model = { entities: [{ id: 'customer', fields: [{ name: 'id', type: 'string', primary: true }] }, { id: 'order', fields: [{ name: 'id', type: 'string', primary: true }, { name: 'customerId', type: 'string' }] }], relations: [{ from: { entity: 'order', field: 'customerId' }, to: { entity: 'customer', field: 'id' }, cardinality: 'many-to-one' }] };
test('business model validates real endpoints, PK and relation type', () => {
  assert.equal(run('business.model', model).valid, true);
  const bad = structuredClone(model); bad.entities[0].fields[0] = { name: 'id', type: 'number', primary: true, nullable: true }; bad.relations.push({ ...model.relations[0], to: { entity: 'missing', field: 'id' } });
  assert.deepEqual(run('business.model', bad).issues.map(i => i.code), ['NULLABLE_PRIMARY_KEY', 'RELATION_TYPE', 'DANGLING_RELATION']);
});
test('business many-to-many and missing PK remain issues, not database execution', () => {
  const bad = structuredClone(model); bad.entities[0].fields[0].primary = false; bad.relations[0].cardinality = 'many-to-many'; assert.deepEqual(run('business.model', bad).issues.map(i => i.code), ['NO_PRIMARY_KEY', 'JUNCTION_REQUIRED']);
});
test('research citation coverage catches dangling and unsupported claims', () => {
  const r = run('research.evidence', { sources: [{ id: 'a', title: 'Primary', url: 'https://example.org' }], claims: [{ id: 'c1', text: 'Claim', sourceIds: ['a'] }, { id: 'c2', text: 'Guess', sourceIds: [] }, { id: 'c3', text: 'Other', sourceIds: ['b'] }] });
  assert.deepEqual(r.issues.map(i => i.code), ['UNSUPPORTED_CLAIM', 'MISSING_SOURCE']);
});
test('cyber extracts local deduplicated valid IPv4 and SHA256 without fetching', () => {
  const sha = 'A'.repeat(64); assert.deepEqual(run('cyber.indicators', { text: `10.0.0.1 999.1.1.1 10.0.0.1 ${sha} ${sha.toLowerCase()}` }).ipv4, ['10.0.0.1']); assert.deepEqual(run('cyber.indicators', { text: sha }).sha256, [sha.toLowerCase()]);
});
test('documents produces actual markdown and rejects unsafe/missing citations', () => {
  const x = { title: 'Report\nInjected', sections: [{ heading: 'Findings', body: 'Observed 3 results.', sourceIds: ['s'] }], sources: [{ id: 's', title: 'Study', url: 'https://example.org' }] };
  const r = run('documents.outline', x); assert.ok(r.text.startsWith('# Report Injected\n')); assert.ok(r.text.includes('Observed 3 results.')); assert.ok(r.text.includes('https://example.org'));
  err(() => run('documents.outline', { ...x, sources: [] }), 'E_REFERENCE'); err(() => run('documents.outline', { ...x, sources: [{ ...x.sources[0], url: 'javascript:alert(1)' }] }), 'E_REFERENCE');
});
const todo = { title: 'Work', items: [{ id: 'a', text: 'Read', done: false, dependsOn: [] }, { id: 'b', text: 'Write', done: true, dependsOn: ['a'], due: '2026-11-20' }] };
test('todo emits real task list and catches incomplete dependencies', () => {
  const r = run('assistant.todo', todo); assert.ok(r.text.includes('- [x] Write (b) · 2026-11-20')); assert.equal(r.issues[0].code, 'DONE_BEFORE_DEPENDENCY');
});
test('todo rejects cycles, dangling links and invalid calendar dates', () => {
  err(() => run('assistant.todo', { ...todo, items: [{ ...todo.items[0], dependsOn: ['a'] }] }), 'E_CYCLE');
  err(() => run('assistant.todo', { ...todo, items: [{ ...todo.items[0], dependsOn: ['missing'] }] }), 'E_DEPENDENCY');
  err(() => run('assistant.todo', { ...todo, items: [{ ...todo.items[0], due: '2026-02-30' }] }), 'E_DATE');
});
const event = { uid: 'a@example.org', summary: '你好;Plan, yes\nNEXT', start: '2026-11-13T01:00:00Z', end: '2026-11-13T02:00:00Z' };
test('ICS escapes content and uses deterministic UTC timestamps and CRLF', () => {
  const r = run('assistant.ics', { events: [event] }); assert.ok(r.text.includes('SUMMARY:你好\\;Plan\\, yes\\nNEXT\r\n')); assert.ok(r.text.includes('DTSTART:20261113T010000Z')); assert.ok(r.text.endsWith('END:VCALENDAR\r\n')); assert.equal(r.eventCount, 1);
});
test('ICS folds by UTF8 octets, preserving Chinese and line unfolding', () => {
  const r = run('assistant.ics', { events: [{ ...event, summary: '中文'.repeat(100) }] }); for (const l of r.text.split('\r\n')) assert.ok(Buffer.byteLength(l) <= 75); assert.ok(r.text.replace(/\r\n /g, '').includes('SUMMARY:' + '中文'.repeat(100)));
});
test('ICS rejects timezone ambiguity, impossible dates and reversed range', () => {
  for (const start of ['2026-11-13T01:00:00', '2026-02-30T01:00:00Z', '2026-11-13T03:00:00Z']) err(() => run('assistant.ics', { events: [{ ...event, start }] }), 'E_DATE');
  err(() => run('assistant.ics', { events: [event, event] }), 'E_DUPLICATE');
});
test('canon bounds issue samples while scanning every conflict with exact totals', () => {
  const facts = Array.from({ length: 500 }, (_, i) => ({ entity: 'Ada', key: 'n', value: i, from: 0, to: 1 }));
  const r = run('fiction.continuity', { entities: ['Ada'], facts, scenes: [] });
  assert.equal(r.issues.length, 500); assert.equal(r.totalIssues, 500 * 499 / 2); assert.equal(r.issueCounts.CANON_CONFLICT, 124750); assert.equal(r.truncated, true); assert.ok(Buffer.byteLength(JSON.stringify(r)) < 100000);
});
test('composite key endpoint is not independently unique unless explicitly declared', () => {
  const x = structuredClone(model); x.entities[0].fields.push({ name: 'tenant', type: 'string', primary: true });
  assert.equal(run('business.model', x).issues[0].code, 'COMPOSITE_KEY_MAPPING_REQUIRED');
  x.entities[0].fields[0].unique = true; assert.equal(run('business.model', x).valid, true);
});
test('coverage rejects malformed host URLs without fetching or claiming truth', () => {
  for (const url of ['https://', 'https:// ', 'https://example.org/\nfoo', 'file:///etc/passwd']) {
    assert.equal(run('research.evidence', { sources: [{ id: 's', title: 'x', url }], claims: [] }).issueCounts.SOURCE_URL, 1);
  }
});
test('ICS rejects C0 controls and permits escaped newline or tab text', () => {
  for (const patch of [{ uid: 'x\u0000y' }, { summary: 'a\u0001b' }, { location: 'x\u007fy' }]) err(() => run('assistant.ics', { events: [{ ...event, ...patch }] }), 'E_ICS_TEXT');
  assert.ok(run('assistant.ics', { events: [{ ...event, summary: 'tab\tline\nnext' }] }).text.includes('tab\tline\\nnext'));
});
test('IPv4 requires complete canonical decimal tokens, not dotted prefixes or leading zeros', () => {
  assert.deepEqual(run('cyber.indicators', { text: '1.2.3.4.5 01.2.3.4 x1.2.3.4 0.0.0.0 [192.0.2.1]:443' }).ipv4, ['0.0.0.0', '192.0.2.1']);
});
test('prototype operation names are not executable operations', () => err(() => run('__proto__', {}), 'E_OPERATION'));
test('every implemented operation exposes a closed input schema', () => { assert.equal(Object.keys(operations).length, 11); for (const op of Object.values(operations)) { assert.equal(op.inputSchema.additionalProperties, false); assert.equal(typeof op.run, 'function'); } });
