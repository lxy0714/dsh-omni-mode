import { A, E, O, S, fail, validate } from './schema.mjs';

// Data-only analysis. No filesystem, network, language parser or test execution.
const MAX_ISSUES = 500;
const MAX_PATH_RULES = 4096;
const MAX_COVERAGE_LINKS = 20000;
const MAX_INPUT_NODES = 100000;
const reservedIds = new Set(['__proto__', 'prototype', 'constructor']);
const idSchema = {
  ...S(100), pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$',
  description: 'Case-sensitive identifier; reserved prototype names are rejected.'
};
const pathSchema = {
  ...S(512),
  description: 'Canonical relative POSIX path, no leading/trailing slash, dot segments, backslashes, controls or glob syntax. No normalization or expansion.'
};
const impactSchema = {
  ...O({
    scope: S(1000),
    modules: A(O({ id: idSchema, paths: A(O({ kind: E('file', 'directory'), path: pathSchema }), 32, 1) }), 500),
    dependencies: A(O({ from: idSchema, to: idSchema }), 5000),
    tests: A(O({ id: idSchema, covers: A(idSchema, 500) }), 2000),
    changedPaths: A(pathSchema, 1000),
    unknowns: A(S(1000), 100)
  }, ['scope', 'modules', 'dependencies', 'tests', 'changedPaths']),
  description: 'from depends on to; impact traverses to -> from. At most 4096 total path rules, 20000 total coverage links and 100000 JSON nodes. Empty covers is unknown test coverage and causes conservative full-suite advice when changes exist.'
};

export const engineeringSchemas = Object.freeze({ 'engineering.impact': impactSchema });

const ordered = values => [...values].sort();
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

// Validate descriptors before reading values: only dense, plain JSON data is
// accepted, including on direct implementation calls. Never invoke accessors.
function plainJSON(schema, value, path = '$', budget = { remaining: MAX_INPUT_NODES }) {
  if (--budget.remaining < 0) fail('E_LIMIT', 'JSON节点过多 / Too many JSON nodes', path);
  if (!value || typeof value !== 'object') return;
  const array = Array.isArray(value);
  if ((array && schema.type !== 'array') || (!array && schema.type !== 'object')) fail('E_SCHEMA', '容器类型不符 / Unexpected container type', path);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  const keys = Reflect.ownKeys(value);
  if (array) {
    if (value.length < (schema.minItems || 0) || value.length > schema.maxItems) fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
    if (keys.length !== value.length + 1) fail('E_SCHEMA', '数组必须稠密且无额外属性 / Arrays must be dense without extra properties', path);
  }
  for (const key of keys) {
    if (array && key === 'length') continue;
    if (typeof key !== 'string' || (array ? !/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= value.length : !Object.hasOwn(schema.properties, key))) fail('E_SCHEMA', '未知或非法字段 / Unknown or invalid field', path);
    if (reservedIds.has(key)) fail('E_SCHEMA', '保留字段 / Reserved field', `${path}.${key}`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail('E_SCHEMA', '不接受访问器或隐藏字段 / Accessors and hidden fields are not JSON data', `${path}.${key}`);
    plainJSON(array ? schema.items : schema.properties[key], descriptor.value, array ? `${path}[${key}]` : `${path}.${key}`, budget);
  }
}

function distinct(values, label, path) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail('E_DUPLICATE', `重复${label} / Duplicate ${label}: ${value}`, path);
    seen.add(value);
  }
}

function identifier(value, path) {
  if (reservedIds.has(value)) fail('E_ID', '保留ID / Reserved identifier', path);
}

function canonicalPath(value, path) {
  // Deliberately reject, rather than silently normalize, ambiguous spelling.
  if (value !== value.trim() || value.startsWith('/') || /^[A-Za-z]:/.test(value) || /[\\\p{Cc}\p{Cf}*?\[\]{}()]/u.test(value) || value.split('/').some(part => !part || part === '.' || part === '..')) {
    fail('E_PATH', '需要无通配的规范POSIX相对路径 / Expected canonical, literal relative POSIX path', path);
  }
}

function issueCollector() {
  const issues = [], counts = new Map();
  let total = 0;
  return {
    add(code, path, message) {
      total++;
      counts.set(code, (counts.get(code) || 0) + 1);
      if (issues.length < MAX_ISSUES) issues.push({ code, path, message });
    },
    report() {
      return { issues, totalIssues: total, issueCounts: Object.fromEntries([...counts].sort(([a], [b]) => compare(a, b))), truncated: total > issues.length };
    }
  };
}

// Tarjan SCC visits each bounded module/edge once; cycles are reported, not
// rejected. A singleton is cyclic only if it has an explicit self-edge.
function cyclicComponents(ids, forward, affected) {
  let nextIndex = 0;
  const index = new Map(), low = new Map(), stack = [], onStack = new Set(), components = [];
  function visit(id) {
    index.set(id, nextIndex); low.set(id, nextIndex++);
    stack.push(id); onStack.add(id);
    for (const dependency of forward.get(id)) {
      if (!index.has(dependency)) {
        visit(dependency);
        low.set(id, Math.min(low.get(id), low.get(dependency)));
      } else if (onStack.has(dependency)) low.set(id, Math.min(low.get(id), index.get(dependency)));
    }
    if (low.get(id) !== index.get(id)) return;
    const members = [];
    let member;
    do { member = stack.pop(); onStack.delete(member); members.push(member); } while (member !== id);
    members.sort();
    if (members.length > 1 || forward.get(id).includes(id)) components.push({ moduleIds: members, affected: members.some(value => affected.has(value)) });
  }
  for (const id of ids) if (!index.has(id)) visit(id);
  return components.sort((a, b) => compare(a.moduleIds[0], b.moduleIds[0]));
}

function impact(input) {
  plainJSON(impactSchema, input);
  validate(impactSchema, input);
  if (!input.scope.trim()) fail('E_SCOPE', '必须说明声明图范围 / Describe the declared graph scope', '$.scope');
  distinct(input.modules.map(module => module.id), 'module ID', '$.modules');
  distinct(input.tests.map(item => item.id), 'test ID', '$.tests');
  distinct(input.changedPaths, 'changed path', '$.changedPaths');
  distinct(input.unknowns || [], 'unknown', '$.unknowns');
  const modules = new Map(input.modules.map(module => [module.id, module]));
  const moduleIds = ordered(modules.keys());
  const forward = new Map(moduleIds.map(id => [id, []]));
  const reverse = new Map(moduleIds.map(id => [id, []]));
  let pathRuleCount = 0, coverageLinkCount = 0;
  for (const [i, module] of input.modules.entries()) {
    identifier(module.id, `$.modules[${i}].id`);
    distinct(module.paths.map(rule => rule.path), 'module path', `$.modules[${i}].paths`);
    for (const [j, rule] of module.paths.entries()) canonicalPath(rule.path, `$.modules[${i}].paths[${j}].path`);
    pathRuleCount += module.paths.length;
    if (pathRuleCount > MAX_PATH_RULES) fail('E_LIMIT', '路径规则总数超过4096 / More than 4096 total path rules', '$.modules');
  }
  distinct(input.dependencies.map(edge => JSON.stringify([edge.from, edge.to])), 'dependency edge', '$.dependencies');
  for (const [i, edge] of input.dependencies.entries()) {
    if (!modules.has(edge.from) || !modules.has(edge.to)) fail('E_REFERENCE', '依赖边端点模块不存在 / Unknown dependency endpoint', `$.dependencies[${i}]`);
    forward.get(edge.from).push(edge.to);
    reverse.get(edge.to).push(edge.from);
  }
  for (const dependencies of forward.values()) dependencies.sort();
  const tests = [...input.tests].sort((a, b) => compare(a.id, b.id));
  for (const [i, item] of input.tests.entries()) {
    identifier(item.id, `$.tests[${i}].id`);
    distinct(item.covers, 'test coverage module', `$.tests[${i}].covers`);
    for (const id of item.covers) if (!modules.has(id)) fail('E_REFERENCE', '测试覆盖引用未知模块 / Unknown covered module', `$.tests[${i}].covers`);
    coverageLinkCount += item.covers.length;
    if (coverageLinkCount > MAX_COVERAGE_LINKS) fail('E_LIMIT', '覆盖关系总数超过20000 / More than 20000 total coverage links', '$.tests');
  }
  for (const [i, path] of input.changedPaths.entries()) canonicalPath(path, `$.changedPaths[${i}]`);
  const unknowns = ordered(input.unknowns || []);
  if (unknowns.some(value => !value.trim())) fail('E_INPUT', '未知项说明不得为空白 / Unknown descriptions cannot be blank', '$.unknowns');

  const issues = issueCollector(), changed = new Set(), unmappedPaths = [], overlappingPaths = [];
  for (const unknown of unknowns) issues.add('DECLARED_UNKNOWN', 'scope', unknown);
  for (const path of ordered(input.changedPaths)) {
    const owners = moduleIds.filter(id => modules.get(id).paths.some(rule => rule.path === path || (rule.kind === 'directory' && path.startsWith(`${rule.path}/`))));
    if (!owners.length) {
      unmappedPaths.push(path);
      issues.add('UNMAPPED_CHANGE', path, '改动不在声明模块路径中；建议全套测试 / Unmapped change; recommend the full suite');
    } else {
      for (const id of owners) changed.add(id);
      if (owners.length > 1) {
        overlappingPaths.push({ path, moduleCount: owners.length });
        issues.add('OVERLAPPING_OWNERSHIP', path, '保留全部匹配模块，不采用最长前缀裁剪 / All matching modules retained, not just the longest prefix');
      }
    }
  }
  const affected = new Set(changed), queue = ordered(changed);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const dependent of reverse.get(queue[cursor])) if (!affected.has(dependent)) { affected.add(dependent); queue.push(dependent); }
  }
  const relatedTests = tests.filter(item => item.covers.some(id => affected.has(id))).map(item => item.id);
  const declaredCovered = new Set(tests.flatMap(item => item.covers));
  const uncoveredModules = ordered(affected).filter(id => !declaredCovered.has(id));
  for (const id of uncoveredModules) issues.add('UNCOVERED_MODULE', `modules.${id}`, '受影响模块没有声明测试覆盖；建议全套测试 / Affected module lacks declared test coverage; recommend the full suite');
  const unscopedTests = tests.filter(item => !item.covers.length).map(item => item.id);
  for (const id of unscopedTests) issues.add('UNSCOPED_TEST', `tests.${id}`, '测试覆盖未知，不能安全排除 / Test coverage unknown; cannot safely exclude it');
  if (input.changedPaths.length && !tests.length) issues.add('NO_DECLARED_TESTS', 'tests', '未声明测试；须发现真实全套测试 / No tests declared; discover the actual full suite');
  const cycles = cyclicComponents(moduleIds, forward, affected);
  for (const cycle of cycles) issues.add('DEPENDENCY_CYCLE', `cycles.${cycle.moduleIds[0]}`, '声明依赖图含环；已用访问集合有界计算 / Declared dependency cycle; closure computed with a visited set');

  const fallback = [];
  if (unmappedPaths.length) fallback.push('UNMAPPED_CHANGE');
  if (uncoveredModules.length) fallback.push('UNCOVERED_MODULE');
  if (unknowns.length) fallback.push('DECLARED_UNKNOWN');
  if (unscopedTests.length) fallback.push('UNSCOPED_TEST');
  if (!tests.length && input.changedPaths.length) fallback.push('NO_DECLARED_TESTS');
  const mode = !input.changedPaths.length ? 'none' : fallback.length ? 'full-suite' : 'targeted';
  return {
    scope: {
      kind: 'declared-graph-only', description: input.scope, wholeRepositoryVerified: false,
      moduleCount: moduleIds.length, dependencyCount: input.dependencies.length,
      pathRuleCount, testCount: tests.length, coverageLinkCount, unknowns
    },
    dependencyDirection: 'from depends on to; impact follows reverse edges to -> from / from依赖to；影响沿to到from传播',
    changedModules: ordered(changed), affectedModules: ordered(affected), relatedTests,
    selectedTests: mode === 'full-suite' ? tests.map(item => item.id) : relatedTests,
    unmappedPaths, uncoveredModules, unscopedTests, overlappingPaths, cycles,
    recommendation: {
      mode, reasons: mode === 'none' ? ['NO_CHANGED_PATHS'] : fallback.length ? ordered(fallback) : ['DECLARED_COVERAGE'],
      selectionScope: 'declared-test-ids-only', requiresWholeSuiteDiscovery: mode === 'full-suite',
      message: mode === 'full-suite'
        ? '保守建议运行真实全套测试；selectedTests仅列声明测试，不保证等于真实全套 / Run the actual full suite conservatively; selectedTests lists only declared tests, not a verified complete suite'
        : mode === 'none'
          ? '输入未声明改动；不代表已检查仓库或可以跳过项目必需检查 / No changes supplied; not a repository inspection or permission to skip required checks'
          : '仅在声明图及声明模块覆盖范围内建议所列测试 / Suggested tests only within the declared graph and module-coverage scope'
    },
    testsExecuted: false, testExecution: 'not-run',
    ...issues.report(),
    limitation: '仅检查显式声明，不读源码、不自动解析语言、配置或动态依赖，不证明覆盖质量或全仓库完整性；未执行测试 / Explicit declarations only; no source reading, language/config/dynamic-dependency parsing, coverage-quality or repository-completeness proof; tests not executed'
  };
}

export const engineeringImplementations = Object.freeze({ 'engineering.impact': impact });
