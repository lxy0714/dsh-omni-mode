import { types } from 'node:util';
import { A, E, O, S, fail, validate } from './schema.mjs';

// Pure declared-data check. No project/artifact inspection or execution.
const MAX_TARGETS = 32;
const MAX_TESTS_PER_TARGET = 64;
const MAX_BUILDS = 256;
const MAX_TEST_RUNS = 4096;
const MAX_ISSUES = 500;

const identifier = {
  ...S(64),
  // A strict end-of-input assertion, unlike JS `$` before a trailing newline.
  pattern: '^(?!(?:constructor|prototype)(?![\\s\\S]))[A-Za-z0-9][A-Za-z0-9._:-]*(?![\\s\\S])',
  description: '区分大小写的规范 ASCII ID；拒绝保留原型名称 / Case-sensitive canonical ASCII ID; reserved prototype names are rejected.'
};
const digest = {
  ...S(64, 64), pattern: '^[0-9A-Fa-f]{64}(?![\\s\\S])',
  description: '64 位十六进制文本，比较时不区分大小写 / 64 hexadecimal characters; compared case-insensitively.'
};

function freezeSchema(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeSchema(child);
  }
  return Object.freeze(value);
}

const buildCheckSchema = freezeSchema({
  ...O({
    buildId: identifier,
    targets: A(O({ id: identifier, requiredTests: A(identifier, MAX_TESTS_PER_TARGET, 1) }), MAX_TARGETS, 1),
    builds: A(O({ targetId: identifier, buildId: identifier, artifactSha256: digest }), MAX_BUILDS),
    testRuns: A(O({ targetId: identifier, testId: identifier, buildId: identifier, artifactSha256: digest, outcome: E('pass', 'fail', 'not-run') }), MAX_TEST_RUNS)
  }),
  description: '目标 ID、目标内必测 ID、(目标, 构建) 及 (目标, 构建, 用例) 记录各自唯一。仅申报 buildId 的构建/用例记录可满足清单。 / Unique target IDs, required IDs within each target, (target, build) and (target, build, test) records. Only records for the requested buildId can satisfy the checklist.'
});

export const gameBuildSchemas = Object.freeze({ 'game.build-check': buildCheckSchema });

// The shared validator assumes parsed JSON. Guard direct implementation calls
// too: reject holes, accessors, proxies and non-JSON properties without reading
// them; never include an unknown field name in errors from this entry point.
function requirePlainData(schema, value, path = '$') {
  if (value === null || typeof value !== 'object') return;
  const invalid = () => fail('E_SCHEMA', '仅接受闭合的普通 JSON 数据 / Expected closed, plain JSON data', path);
  if (types.isProxy(value)) invalid();
  const array = Array.isArray(value);
  if (schema.type !== (array ? 'array' : 'object')) invalid();
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) invalid();
  if (array && (value.length < schema.minItems || value.length > schema.maxItems)) {
    fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
  }
  const keys = Reflect.ownKeys(value);
  if (array && keys.length !== value.length + 1) invalid();
  for (const key of keys) {
    if (array && key === 'length') continue;
    if (typeof key !== 'string' || (array ? !/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length : !Object.hasOwn(schema.properties, key))) invalid();
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (!property.enumerable || !Object.hasOwn(property, 'value')) invalid();
    requirePlainData(array ? schema.items : schema.properties[key], property.value, array ? `${path}[${key}]` : `${path}.${key}`);
  }
}

const buildIssues = {
  'missing-build': ['BUILD_MISSING', '缺少目标构建记录 / No build declared for target'],
  'wrong-build': ['BUILD_ID_MISMATCH', '目标构建 ID 不匹配 / No target build with the requested ID']
};
const testIssues = {
  untested: ['TEST_MISSING', '缺少该目标的用例记录 / No run declared for this target and test'],
  'wrong-build': ['TEST_BUILD_ID_MISMATCH', '用例构建 ID 不匹配 / No test run with the requested build ID'],
  'unbound-build': ['TEST_BUILD_UNAVAILABLE', '用例缺少当前构建记录，无法绑定 / Run has no current build record to bind to'],
  'artifact-mismatch': ['TEST_ARTIFACT_MISMATCH', '用例制品摘要不匹配 / Test artifact digest differs from the declared build'],
  fail: ['TEST_FAILED', '用例声明失败 / Test declared failed'],
  'not-run': ['TEST_NOT_RUN', '用例声明未运行 / Test declared not run']
};

function checkBuild(input) {
  requirePlainData(buildCheckSchema, input);
  validate(buildCheckSchema, input);

  const byTarget = new Map();
  for (const [i, { id, requiredTests }] of input.targets.entries()) {
    const path = `$.targets[${i}]`;
    if (byTarget.has(id)) fail('E_DUPLICATE', '重复目标 ID / Duplicate target ID', `${path}.id`);
    const runs = new Map();
    for (const [j, testId] of requiredTests.entries()) {
      if (runs.has(testId)) fail('E_DUPLICATE', '目标内必测 ID 重复 / Duplicate required test ID within target', `${path}.requiredTests[${j}]`);
      runs.set(testId, new Map());
    }
    byTarget.set(id, { builds: new Map(), runs });
  }

  // Use nested keys: ':' is a legal ID character, and digest/outcome never
  // separate duplicates of the same target/build or target/build/test tuple.
  for (const [i, { targetId, buildId, artifactSha256 }] of input.builds.entries()) {
    const path = `$.builds[${i}]`;
    const builds = byTarget.get(targetId)?.builds;
    if (!builds) fail('E_REFERENCE', '构建目标未声明 / Undeclared build target', `${path}.targetId`);
    if (builds.has(buildId)) fail('E_DUPLICATE', '目标构建记录重复 / Duplicate target/build record', path);
    builds.set(buildId, artifactSha256.toLowerCase());
  }
  for (const [i, row] of input.testRuns.entries()) {
    const path = `$.testRuns[${i}]`;
    const runs = byTarget.get(row.targetId)?.runs;
    if (!runs) fail('E_REFERENCE', '用例目标未声明 / Undeclared test target', `${path}.targetId`);
    const versions = runs.get(row.testId);
    if (!versions) fail('E_REFERENCE', '该目标的用例未声明 / Test not declared for target', `${path}.testId`);
    if (versions.has(row.buildId)) fail('E_DUPLICATE', '目标构建用例记录重复 / Duplicate target/build/test record', path);
    versions.set(row.buildId, row);
  }

  const issues = [], issueCounts = {};
  let totalIssues = 0;
  const addIssue = ([code, message], path) => {
    totalIssues++;
    issueCounts[code] = (issueCounts[code] ?? 0) + 1;
    if (issues.length < MAX_ISSUES) issues.push({ code, path, message });
  };

  const { buildId } = input;
  const targets = input.targets.map(({ id, requiredTests }, i) => {
    const path = `$.targets[${i}]`;
    const { builds, runs } = byTarget.get(id);
    const artifact = builds.get(buildId);
    const buildStatus = artifact !== undefined ? 'declared' : builds.size ? 'wrong-build' : 'missing-build';
    if (buildStatus !== 'declared') addIssue(buildIssues[buildStatus], path);
    const tests = requiredTests.map((testId, j) => {
      const versions = runs.get(testId);
      const current = versions.get(buildId);
      let status;
      if (!current) status = versions.size ? 'wrong-build' : 'untested';
      else if (artifact === undefined) status = 'unbound-build';
      else if (current.artifactSha256.toLowerCase() !== artifact) status = 'artifact-mismatch';
      else status = current.outcome;
      if (status !== 'pass') addIssue(testIssues[status], `${path}.requiredTests[${j}]`);
      // The declared outcome of an unbound or mismatched run is not credited.
      return { testId, status, recordedOutcome: current?.outcome ?? null };
    });
    return { id, buildStatus, valid: buildStatus === 'declared' && tests.every(test => test.status === 'pass'), tests };
  });

  return {
    valid: totalIssues === 0, buildId, targets, issues, totalIssues, issueCounts, truncated: totalIssues > issues.length,
    scope: 'declared-build-checklist-only', artifactsVerified: false, buildsExecuted: false, testsExecuted: false,
    limitation: '仅核对声明；未读取工程或制品、未查证真实摘要、未运行引擎或实机，未构建、测试或上架，不代表可以发布。 / Declarations only; no project or artifact reads, digest verification, engine/device use, build, test or store submission; not release approval.'
  };
}

export const gameBuildImplementations = Object.freeze({ 'game.build-check': checkBuild });
