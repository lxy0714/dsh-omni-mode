import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { engineeringSchemas, engineeringImplementations } from './engineering-impact.mjs';

const id = 'engineering.impact';
const schema = engineeringSchemas[id];
// Deliberately independent of the central registry/catalog, which is integrated
// separately. Every normal test first validates this module's declared schema.
const run = input => { validate(schema, input); return engineeringImplementations[id](input); };
const reject = (input, code) => assert.throws(() => run(input), error => error.code === code);
const module = (id, path = `src/${id}`, kind = 'directory') => ({ id, paths: [{ kind, path }] });
const fixture = () => ({
  scope: 'Fixture graph only, not a repository inventory',
  modules: [module('app'), module('lib'), module('core', 'src/core.js', 'file'), module('spare')],
  dependencies: [{ from: 'app', to: 'lib' }, { from: 'lib', to: 'core' }],
  tests: ['app', 'lib', 'core', 'spare'].map(value => ({ id: `test-${value}`, covers: [value] })),
  changedPaths: ['src/core.js']
});
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

test('exports one operation with recursively closed, finite input schemas', () => {
  assert.deepEqual(Object.keys(engineeringSchemas), [id]);
  assert.deepEqual(Object.keys(engineeringImplementations), [id]);
  assert.equal(typeof engineeringImplementations[id], 'function');
  const inspect = value => {
    if (value.type === 'object') {
      assert.equal(value.additionalProperties, false);
      Object.values(value.properties).forEach(inspect);
    } else if (value.type === 'array') {
      assert.ok(Number.isSafeInteger(value.maxItems) && value.maxItems > 0);
      inspect(value.items);
    } else if (value.type === 'string' && !value.enum) assert.ok(Number.isFinite(value.maxLength));
  };
  inspect(schema);
});

test('from depends on to: a leaf change reaches all reverse dependents, not the opposite direction', () => {
  const input = fixture(), result = run(input);
  assert.deepEqual(result.changedModules, ['core']);
  assert.deepEqual(result.affectedModules, ['app', 'core', 'lib']);
  assert.deepEqual(result.relatedTests, ['test-app', 'test-core', 'test-lib']);
  assert.deepEqual(result.selectedTests, result.relatedTests);
  assert.equal(result.recommendation.mode, 'targeted');
  assert.match(result.dependencyDirection, /from depends on to.*to -> from/);
  assert.deepEqual(run({ ...input, changedPaths: ['src/app/main.js'] }).affectedModules, ['app']);
  assert.deepEqual(run({ ...input, changedPaths: ['src/lib/index.js'] }).affectedModules, ['app', 'lib']);
});

test('diamond closure is complete and does not duplicate modules or tests', () => {
  const input = {
    scope: 'Declared diamond', modules: ['a', 'b', 'c', 'd', 'unused'].map(value => module(value)),
    dependencies: [{ from: 'd', to: 'b' }, { from: 'd', to: 'c' }, { from: 'b', to: 'a' }, { from: 'c', to: 'a' }],
    tests: [{ id: 'all', covers: ['a', 'b', 'c', 'd'] }, { id: 'left', covers: ['a', 'b'] }, { id: 'unused', covers: ['unused'] }],
    changedPaths: ['src/a/a.js', 'src/c/c.js']
  };
  const result = run(input);
  assert.deepEqual(result.changedModules, ['a', 'c']);
  assert.deepEqual(result.affectedModules, ['a', 'b', 'c', 'd']);
  assert.deepEqual(result.selectedTests, ['all', 'left']);
  assert.deepEqual(result.cycles, []);
});

test('cycles and self-loops terminate, report SCCs, and retain inbound dependents', () => {
  const input = {
    scope: 'Two cyclic components', modules: ['a', 'b', 'c', 'client', 'self'].map(value => module(value)),
    dependencies: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }, { from: 'client', to: 'a' }, { from: 'self', to: 'self' }],
    tests: [{ id: 'all', covers: ['a', 'b', 'c', 'client', 'self'] }], changedPaths: ['src/b/file.js']
  };
  const result = run(input);
  assert.deepEqual(result.affectedModules, ['a', 'b', 'c', 'client']);
  assert.deepEqual(result.cycles, [{ moduleIds: ['a', 'b', 'c'], affected: true }, { moduleIds: ['self'], affected: false }]);
  assert.equal(result.issueCounts.DEPENDENCY_CYCLE, 2);
  assert.equal(result.recommendation.mode, 'targeted');
  const self = run({ ...input, changedPaths: ['src/self/file.js'] });
  assert.deepEqual(self.affectedModules, ['self']);
  assert.deepEqual(self.cycles, [{ moduleIds: ['a', 'b', 'c'], affected: false }, { moduleIds: ['self'], affected: true }]);
});

test('all three-module directed graphs agree with an independent fixed-point reachability oracle', () => {
  const ids = ['a', 'b', 'c'];
  const possible = ids.flatMap(from => ids.map(to => ({ from, to })));
  for (let mask = 0; mask < 1 << possible.length; mask++) {
    const dependencies = possible.filter((_, i) => mask & (1 << i));
    const reach = new Map(ids.map(value => [value, new Set([value])]));
    // Deliberately not Tarjan or the implementation's reverse-adjacency BFS.
    for (let round = 0; round < ids.length; round++) for (const edge of dependencies) {
      for (const reachable of reach.get(edge.to)) reach.get(edge.from).add(reachable);
    }
    const groups = [], assigned = new Set();
    for (const value of ids) {
      if (assigned.has(value)) continue;
      const group = ids.filter(other => reach.get(value).has(other) && reach.get(other).has(value));
      group.forEach(other => assigned.add(other));
      if (group.length > 1 || dependencies.some(edge => edge.from === value && edge.to === value)) groups.push(group);
    }
    for (const changed of ids) {
      const expected = ids.filter(value => reach.get(value).has(changed));
      const result = run({
        scope: 'Exhaustive three-node fixture, not repository evidence', modules: ids.map(value => module(value)),
        dependencies, tests: [{ id: 'all', covers: ids }], changedPaths: [`src/${changed}/file.js`]
      });
      assert.deepEqual(result.affectedModules, expected, `mask=${mask}, changed=${changed}`);
      assert.deepEqual(result.cycles, groups.map(moduleIds => ({ moduleIds, affected: moduleIds.some(value => expected.includes(value)) })));
      assert.equal(result.recommendation.mode, 'targeted');
    }
  }
});

test('overlapping file/directory ownership keeps every owner and every reverse dependent', () => {
  const input = {
    scope: 'Nested declarations, no longest-prefix winner',
    modules: [module('parent', 'src'), module('nested', 'src/deep'), module('file', 'src/deep/item.js', 'file'), module('lookalike', 'src/deeper'), module('consumer')],
    dependencies: [{ from: 'consumer', to: 'parent' }],
    tests: [{ id: 'all', covers: ['parent', 'nested', 'file', 'lookalike', 'consumer'] }],
    changedPaths: ['src/deep/item.js']
  };
  const result = run(input);
  assert.deepEqual(result.changedModules, ['file', 'nested', 'parent']);
  assert.deepEqual(result.affectedModules, ['consumer', 'file', 'nested', 'parent']);
  assert.deepEqual(result.overlappingPaths, [{ path: 'src/deep/item.js', moduleCount: 3 }]);
  assert.equal(result.issueCounts.OVERLAPPING_OWNERSHIP, 1);
  assert.equal(result.recommendation.mode, 'targeted');
});

test('file rules are exact, directory rules respect segment boundaries and match their root', () => {
  const input = fixture();
  for (const path of ['src/core.js/child', 'src/core.jsx', 'src/application/file.js', 'src/lib-extra/file.js']) {
    const result = run({ ...input, changedPaths: [path] });
    assert.deepEqual(result.changedModules, []);
    assert.deepEqual(result.unmappedPaths, [path]);
    assert.equal(result.recommendation.mode, 'full-suite');
  }
  assert.deepEqual(run({ ...input, changedPaths: ['src/lib'] }).changedModules, ['lib']);
});

test('unknown changes cannot be silently ignored and select all declared tests', () => {
  const input = fixture(), result = run({ ...input, changedPaths: ['package.json', 'src/core.js'] });
  assert.deepEqual(result.changedModules, ['core']);
  assert.deepEqual(result.affectedModules, ['app', 'core', 'lib']);
  assert.deepEqual(result.unmappedPaths, ['package.json']);
  assert.deepEqual(result.relatedTests, ['test-app', 'test-core', 'test-lib']);
  assert.deepEqual(result.selectedTests, ['test-app', 'test-core', 'test-lib', 'test-spare']);
  assert.equal(result.recommendation.mode, 'full-suite');
  assert.equal(result.recommendation.requiresWholeSuiteDiscovery, true);
  assert.equal(result.recommendation.selectionScope, 'declared-test-ids-only');
});

test('partial declared module coverage forces full-suite advice even when some related tests exist', () => {
  const input = fixture(); input.tests = input.tests.filter(item => item.id !== 'test-app');
  const result = run(input);
  assert.deepEqual(result.uncoveredModules, ['app']);
  assert.deepEqual(result.relatedTests, ['test-core', 'test-lib']);
  assert.deepEqual(result.selectedTests, ['test-core', 'test-lib', 'test-spare']);
  assert.equal(result.issueCounts.UNCOVERED_MODULE, 1);
  assert.deepEqual(result.recommendation.reasons, ['UNCOVERED_MODULE']);
});

test('no declared tests and an empty graph remain explicit conservative gaps', () => {
  const result = run({ ...fixture(), tests: [] });
  assert.deepEqual(result.uncoveredModules, ['app', 'core', 'lib']);
  assert.equal(result.issueCounts.NO_DECLARED_TESTS, 1);
  assert.equal(result.issueCounts.UNCOVERED_MODULE, 3);
  assert.equal(result.recommendation.mode, 'full-suite');
  assert.deepEqual(result.selectedTests, []);
  const empty = run({ scope: 'No modules inventoried', modules: [], dependencies: [], tests: [], changedPaths: ['unknown.js'] });
  assert.deepEqual(empty.unmappedPaths, ['unknown.js']);
  assert.equal(empty.recommendation.mode, 'full-suite');
  assert.equal(empty.scope.wholeRepositoryVerified, false);
});

test('explicit unknowns and tests with no coverage cannot silently narrow selection', () => {
  const input = fixture(); input.tests.push({ id: 'unmapped-test', covers: [] });
  input.unknowns = ['Dynamic import targets not established', 'External service wiring not modeled'];
  const result = run(input);
  assert.deepEqual(result.unscopedTests, ['unmapped-test']);
  assert.equal(result.issueCounts.UNSCOPED_TEST, 1);
  assert.equal(result.issueCounts.DECLARED_UNKNOWN, 2);
  assert.equal(result.recommendation.mode, 'full-suite');
  assert.ok(result.selectedTests.includes('unmapped-test'));
  assert.deepEqual(result.recommendation.reasons, ['DECLARED_UNKNOWN', 'UNSCOPED_TEST']);
});

test('empty changed input has no inferred impact, even with declared uncertainty', () => {
  const input = { ...fixture(), changedPaths: [], unknowns: ['Not a complete repository graph'] };
  const result = run(input);
  assert.deepEqual(result.changedModules, []);
  assert.deepEqual(result.affectedModules, []);
  assert.deepEqual(result.selectedTests, []);
  assert.equal(result.recommendation.mode, 'none');
  assert.deepEqual(result.recommendation.reasons, ['NO_CHANGED_PATHS']);
  assert.equal(result.issueCounts.DECLARED_UNKNOWN, 1);
  const empty = run({ scope: 'Empty declaration', modules: [], dependencies: [], tests: [], changedPaths: [] });
  assert.equal(empty.totalIssues, 0);
  assert.equal(empty.recommendation.mode, 'none');
});

test('all covering tests are selected, not a greedy subset or a test-to-module reverse mapping', () => {
  const input = fixture();
  input.tests = [
    { id: 'core-only', covers: ['core'] }, { id: 'multi', covers: ['core', 'lib'] },
    { id: 'app-only', covers: ['app'] }, { id: 'spare-only', covers: ['spare'] }
  ];
  assert.deepEqual(run(input).selectedTests, ['app-only', 'core-only', 'multi']);
  assert.deepEqual(run({ ...input, changedPaths: ['src/lib/index.js'] }).selectedTests, ['app-only', 'multi']);
  input.tests[0].covers = ['core', 'app'];
  assert.deepEqual(run({ ...input, changedPaths: ['src/lib/index.js'] }).selectedTests, ['app-only', 'core-only', 'multi']);
});

test('output order is stable across reordered declarations, paths, coverage and repeated calls', () => {
  const input = fixture();
  input.modules[0].paths.push({ kind: 'file', path: 'app-config.json' });
  input.dependencies.push({ from: 'core', to: 'core' });
  input.tests[0].covers.push('core');
  input.tests.push({ id: 'unknown-test', covers: [] });
  input.changedPaths.push('z-unknown', 'a-unknown');
  input.unknowns = ['Z gap', 'A gap'];
  const shuffled = structuredClone(input);
  shuffled.modules.reverse().forEach(value => value.paths.reverse());
  shuffled.dependencies.reverse(); shuffled.tests.reverse().forEach(value => value.covers.reverse());
  shuffled.changedPaths.reverse(); shuffled.unknowns.reverse();
  assert.deepEqual(run(shuffled), run(input));
  assert.equal(JSON.stringify(run(input)), JSON.stringify(run(input)));
});

test('analysis accepts deeply frozen input and returns no mutable aliases to caller data', () => {
  const input = freeze({ ...fixture(), unknowns: ['Declared gap'] }), before = JSON.stringify(input);
  const result = run(input);
  assert.equal(JSON.stringify(input), before);
  result.scope.unknowns.push('Output-only mutation');
  result.changedModules.push('fake'); result.selectedTests.reverse();
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(run(input).changedModules, ['core']);
});

test('reports declared-only scope and tests-not-run even for fully declared coverage', () => {
  const result = run(fixture());
  assert.equal(result.testsExecuted, false);
  assert.equal(result.testExecution, 'not-run');
  assert.equal(result.scope.kind, 'declared-graph-only');
  assert.equal(result.scope.wholeRepositoryVerified, false);
  assert.equal(result.scope.moduleCount, 4);
  assert.equal(result.scope.dependencyCount, 2);
  assert.equal(result.scope.pathRuleCount, 4);
  assert.equal(result.scope.testCount, 4);
  assert.equal(result.scope.coverageLinkCount, 4);
  assert.match(result.limitation, /no source reading.*tests not executed/);
});

for (const path of ['/etc/passwd', '../a', 'a/../b', 'a/./b', './a', 'a//b', 'a/', '.', '..', 'a\\b', 'C:\\x', 'C:x', 'a\u0000b', 'a\u007fb', 'a\u0085b', 'a\u202eb', 'a*b', 'a?b', 'a[0]', '{a,b}', 'a@(b)', ' a', 'a ']) {
  test(`rejects ambiguous or escaping path ${JSON.stringify(path)} in changes and module rules`, () => {
    reject({ ...fixture(), changedPaths: [path] }, 'E_PATH');
    const input = fixture(); input.modules[0].paths[0].path = path; reject(input, 'E_PATH');
  });
}

test('literal relative paths retain unicode, internal spaces and percent text without expansion', () => {
  const input = {
    scope: 'Literal path declarations', modules: [module('utf8', '源码/文件 甲.js', 'file'), module('encoded', '%2e%2e/name.js', 'file')],
    dependencies: [], tests: [{ id: 'utf8-test', covers: ['utf8'] }, { id: 'encoded-test', covers: ['encoded'] }],
    changedPaths: ['源码/文件 甲.js', '%2e%2e/name.js']
  };
  assert.deepEqual(run(input).changedModules, ['encoded', 'utf8']);
});

test('duplicate identities, edges, path rules, coverage and change declarations are rejected', () => {
  let input = fixture(); input.modules.push(structuredClone(input.modules[0])); reject(input, 'E_DUPLICATE');
  input = fixture(); input.tests.push(structuredClone(input.tests[0])); reject(input, 'E_DUPLICATE');
  input = fixture(); input.dependencies.push({ ...input.dependencies[0] }); reject(input, 'E_DUPLICATE');
  input = fixture(); input.modules[0].paths.push({ kind: 'file', path: 'src/app' }); reject(input, 'E_DUPLICATE');
  input = fixture(); input.tests[0].covers.push('app'); reject(input, 'E_DUPLICATE');
  input = fixture(); input.changedPaths.push('src/core.js'); reject(input, 'E_DUPLICATE');
  reject({ ...fixture(), unknowns: ['gap', 'gap'] }, 'E_DUPLICATE');
});

test('unknown dependency or coverage IDs are errors, including inherited object names', () => {
  for (const edge of [{ from: 'missing', to: 'app' }, { from: 'app', to: 'missing' }, { from: 'toString', to: 'app' }]) {
    reject({ ...fixture(), dependencies: [edge] }, 'E_REFERENCE');
  }
  for (const missing of ['missing', 'toString', 'hasOwnProperty']) reject({ ...fixture(), tests: [{ id: 'test', covers: [missing] }] }, 'E_REFERENCE');
});

test('schema rejects unknown/missing fields, malformed kinds, invalid IDs and bad coverage types', () => {
  reject({ ...fixture(), execute: 'do not execute' }, 'E_SCHEMA');
  for (const key of schema.required) { const input = fixture(); delete input[key]; reject(input, 'E_SCHEMA'); }
  let input = fixture(); input.modules[0].paths[0].kind = 'glob'; reject(input, 'E_SCHEMA');
  for (const value of ['', ' spaced', 'bad/id', '__proto__']) {
    input = fixture(); input.modules[0].id = value; assert.throws(() => run(input));
  }
  for (const value of ['constructor', 'prototype']) {
    input = fixture(); input.modules[0].id = value; reject(input, 'E_ID');
    input = fixture(); input.tests[0].id = value; reject(input, 'E_ID');
  }
  input = fixture(); input.tests[0].covers = 'app'; reject(input, 'E_SCHEMA');
  input = fixture(); input.dependencies[0].note = 'unknown field'; reject(input, 'E_SCHEMA');
  input = fixture(); input.tests[0].covers = [null]; reject(input, 'E_SCHEMA');
});

test('nonfinite numbers, wrong scalar/container types and blank scope or uncertainty are rejected', () => {
  for (const value of [NaN, Infinity, -Infinity, 0, true, null, {}, []]) {
    reject({ ...fixture(), scope: value }, 'E_SCHEMA');
    reject({ ...fixture(), changedPaths: [value] }, 'E_SCHEMA');
    const input = fixture(); input.tests[0].covers = [value]; reject(input, 'E_SCHEMA');
  }
  reject({ ...fixture(), scope: '  ' }, 'E_SCOPE');
  reject({ ...fixture(), unknowns: ['  '] }, 'E_INPUT');
  reject({ ...fixture(), modules: {} }, 'E_SCHEMA');
  reject({ ...fixture(), tests: false }, 'E_SCHEMA');
});

test('prototype keys and custom prototypes cannot change membership or inject graph fields', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const input = fixture(); input.modules[0] = JSON.parse(`{"id":"app","paths":[],"${key}":{}}`);
    reject(input, 'E_SCHEMA');
  }
  let input = fixture(); Object.setPrototypeOf(input, { unknowns: ['inherited'] }); reject(input, 'E_SCHEMA');
  input = fixture(); Object.setPrototypeOf(input.modules[0], { covers: ['spare'] }); reject(input, 'E_SCHEMA');
  const normal = fixture(), nullPrototype = Object.assign(Object.create(null), normal);
  assert.deepEqual(run(nullPrototype), run(normal));
});

test('direct implementation refuses accessors without invoking them and rejects non-JSON array shapes', () => {
  let calls = 0;
  const input = fixture(); Object.defineProperty(input, 'scope', { enumerable: true, get() { calls++; return 'accessor'; } });
  assert.throws(() => engineeringImplementations[id](input), error => error.code === 'E_SCHEMA');
  assert.equal(calls, 0);
  let invalid = fixture(); invalid.changedPaths = Array(1); reject(invalid, 'E_SCHEMA');
  invalid = fixture(); invalid.changedPaths.extra = 'unexpected'; reject(invalid, 'E_SCHEMA');
  invalid = fixture(); invalid[Symbol('hidden')] = true; reject(invalid, 'E_SCHEMA');
  invalid = fixture(); Object.defineProperty(invalid, 'hidden', { value: 'data' }); reject(invalid, 'E_SCHEMA');
  // The shared validator assumes ordinary JSON arrays and calls .forEach;
  // verify this implementation's own preflight directly for a non-JSON array.
  invalid = fixture(); Object.setPrototypeOf(invalid.changedPaths, null);
  assert.throws(() => engineeringImplementations[id](invalid), error => error.code === 'E_SCHEMA');
});

test('per-field and per-array bounds fail before analysis', () => {
  reject({ ...fixture(), modules: Array(501).fill(module('a')) }, 'E_LIMIT');
  reject({ ...fixture(), dependencies: Array(5001).fill({ from: 'app', to: 'lib' }) }, 'E_LIMIT');
  reject({ ...fixture(), tests: Array(2001).fill({ id: 'a', covers: [] }) }, 'E_LIMIT');
  reject({ ...fixture(), changedPaths: Array(1001).fill('src/a') }, 'E_LIMIT');
  reject({ ...fixture(), unknowns: Array(101).fill('gap') }, 'E_LIMIT');
  reject({ ...fixture(), changedPaths: ['a'.repeat(513)] }, 'E_LIMIT');
  reject({ ...fixture(), scope: 's'.repeat(1001) }, 'E_LIMIT');
  const input = fixture(); input.modules[0].paths = []; reject(input, 'E_LIMIT');
});

test('aggregate path and coverage budgets are enforced, not just each nested array size', () => {
  const modules = Array.from({ length: 129 }, (_, i) => ({ id: `m${i}`, paths: Array.from({ length: 32 }, (_, j) => ({ kind: 'file', path: `src/${i}/${j}.js` })) }));
  reject({ scope: 'Too many path rules', modules, dependencies: [], tests: [], changedPaths: [] }, 'E_LIMIT');
  const smallModules = Array.from({ length: 41 }, (_, i) => module(`m${i}`));
  const tests = Array.from({ length: 488 }, (_, i) => ({ id: `t${i}`, covers: smallModules.map(value => value.id) }));
  reject({ scope: 'Too many coverage links', modules: smallModules, dependencies: [], tests, changedPaths: [] }, 'E_LIMIT');
});

test('maximum 500-module chain, 4096 rules and 20000 coverage links remain bounded and correct', () => {
  const modules = Array.from({ length: 500 }, (_, i) => module(`m${String(i).padStart(3, '0')}`));
  let remaining = 4096 - modules.length;
  for (const value of modules) {
    for (let j = 1; j < 32 && remaining; j++, remaining--) value.paths.push({ kind: 'file', path: `extra/${value.id}/${j}.js` });
  }
  const dependencies = modules.slice(1).map((value, i) => ({ from: value.id, to: modules[i].id }));
  const tests = Array.from({ length: 40 }, (_, i) => ({ id: `t${i}`, covers: modules.map(value => value.id) }));
  const result = run({ scope: 'Bounded fixture only', modules, dependencies, tests, changedPaths: ['src/m000/a.js'] });
  assert.equal(result.affectedModules.length, 500);
  assert.equal(result.selectedTests.length, 40);
  assert.equal(result.scope.pathRuleCount, 4096);
  assert.equal(result.scope.coverageLinkCount, 20000);
  assert.equal(result.recommendation.mode, 'targeted');
});

test('a 500-module cycle terminates and reports one complete strongly connected component', () => {
  const modules = Array.from({ length: 500 }, (_, i) => module(`m${String(i).padStart(3, '0')}`));
  const dependencies = modules.map((value, i) => ({ from: value.id, to: modules[(i + 1) % modules.length].id }));
  const ids = modules.map(value => value.id);
  const result = run({ scope: 'Maximum cyclic fixture', modules, dependencies, tests: [{ id: 'all', covers: ids }], changedPaths: ['src/m000/file.js'] });
  assert.deepEqual(result.affectedModules, ids);
  assert.deepEqual(result.cycles, [{ moduleIds: ids, affected: true }]);
  assert.equal(result.issueCounts.DEPENDENCY_CYCLE, 1);
  assert.equal(result.recommendation.mode, 'targeted');
});

test('issue samples are bounded while every issue and code count is exact', () => {
  const modules = Array.from({ length: 500 }, (_, i) => module(`m${i}`));
  const dependencies = modules.map(value => ({ from: value.id, to: value.id }));
  const changedPaths = Array.from({ length: 1000 }, (_, i) => `unmapped/${i}.js`);
  const result = run({ scope: 'Many independent loops and unknown paths', modules, dependencies, tests: [], changedPaths });
  assert.equal(result.issues.length, 500);
  assert.equal(result.totalIssues, 1501);
  assert.deepEqual(result.issueCounts, { DEPENDENCY_CYCLE: 500, NO_DECLARED_TESTS: 1, UNMAPPED_CHANGE: 1000 });
  assert.equal(result.truncated, true);
  assert.equal(result.unmappedPaths.length, 1000);
  assert.equal(result.cycles.length, 500);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 1000000);
});

test('worst-case overlapping ownership is summarized without a Cartesian output explosion', () => {
  const modules = Array.from({ length: 500 }, (_, i) => module(`m${i}`, 'src'));
  const changedPaths = Array.from({ length: 1000 }, (_, i) => `src/${i}.js`);
  const result = run({ scope: 'All declared roots overlap', modules, dependencies: [], tests: [], changedPaths });
  assert.equal(result.changedModules.length, 500);
  assert.equal(result.affectedModules.length, 500);
  assert.equal(result.overlappingPaths.length, 1000);
  assert.equal(result.overlappingPaths[0].moduleCount, 500);
  assert.equal(result.totalIssues, 1501);
  assert.equal(result.issueCounts.OVERLAPPING_OWNERSHIP, 1000);
  assert.equal(result.issueCounts.UNCOVERED_MODULE, 500);
  assert.equal(result.recommendation.mode, 'full-suite');
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 1000000);
});
