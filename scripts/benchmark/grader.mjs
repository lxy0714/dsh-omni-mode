// Trusted, bounded fixture evaluator. Never evaluates generated JavaScript or shell.
import { isDeepStrictEqual } from 'node:util';

export const TOOL_NAMES = Object.freeze(['fixture_read', 'fixture_write', 'fixture_search', 'fixture_check', 'ask_user_question', 'skill', 'fixture_capabilities']);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o ?? {}, k);
export const validPath = p => typeof p === 'string' && p.length > 0 && !p.startsWith('/') && !p.includes('\\') && !p.split('/').some(x => !x || x === '.' || x === '..') && !p.includes('\0');
const parse = (s) => { if (typeof s !== 'string' || s.length > 200000) throw Error('Missing or oversized UTF-8 artifact'); return JSON.parse(s); };
const pointer = (o, p = '') => p === '' ? o : p.split('/').slice(1).reduce((a, k) => a?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], o);
const subset = (actual, expected) => {
  if (expected === null || typeof expected !== 'object') return isDeepStrictEqual(actual, expected);
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((v, i) => subset(actual[i], v));
  return actual !== null && typeof actual === 'object' && Object.entries(expected).every(([k, v]) => own(actual, k) && subset(actual[k], v));
};

/** RFC4180-style CSV parser, supports quoted commas/newlines/escaped quotes. */
export function parseCSV(text) {
  if (typeof text !== 'string' || text.length > 200000) throw Error('Missing or oversized CSV');
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') { quoted = false; closed = true; } else cell += c; continue; }
    if (c === '"') { if (cell || closed) throw Error('Unexpected quote'); quoted = true; }
    else if (c === ',') { row.push(cell); cell = ''; closed = false; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; closed = false; }
    else { if (closed) throw Error('Content after closing quote'); cell += c; }
  }
  if (quoted) throw Error('Unterminated CSV quote');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows;
}

function expression(x, input, depth = 0) {
  if (depth > 16) throw Error('Expression too deep');
  if (x === null || typeof x !== 'object') return x;
  if (Array.isArray(x)) return x.map(v => expression(v, input, depth + 1));
  if (own(x, 'field')) return input[x.field];
  if (!own(x, 'op')) return x;
  const a = (x.args ?? []).map(v => expression(v, input, depth + 1));
  if (!a.length || a.some(v => typeof v !== 'number' || !Number.isFinite(v))) throw Error('Finite numeric operands required');
  switch (x.op) {
    case 'add': return a.reduce((s, v) => s + v, 0);
    case 'subtract': if (a.length !== 2) throw Error('Two operands required'); return a[0] - a[1];
    case 'multiply': return a.reduce((s, v) => s * v, 1);
    case 'min': return Math.min(...a);
    case 'max': return Math.max(...a);
    case 'round': if (a.length !== 1) throw Error('One operand required'); return Math.round(a[0]);
    default: throw Error('Unsupported expression');
  }
}
function condition(test, v) {
  if (test === null || typeof test !== 'object' || Array.isArray(test)) return isDeepStrictEqual(v, test);
  return Object.entries(test).every(([op, n]) => {
    switch (op) {
      case 'eq': return isDeepStrictEqual(v, n);
      case 'ne': return !isDeepStrictEqual(v, n);
      case 'lt': return typeof v === 'number' && v < n;
      case 'lte': return typeof v === 'number' && v <= n;
      case 'gt': return typeof v === 'number' && v > n;
      case 'gte': return typeof v === 'number' && v >= n;
      case 'in': return Array.isArray(n) && n.some(x => isDeepStrictEqual(v, x));
      default: throw Error('Unsupported predicate');
    }
  });
}
/** First matching rule wins. This is a data-only decision language, not a JS runtime. */
export function evaluateProgram(program, input) {
  if (!program || !Array.isArray(program.rules) || program.rules.length > 64 || !own(program, 'default')) throw Error('Invalid bounded decision program');
  for (const rule of program.rules) {
    if (!rule.when || typeof rule.when !== 'object' || Array.isArray(rule.when) || !own(rule, 'then')) throw Error('Invalid rule');
    if (Object.entries(rule.when).every(([field, test]) => condition(test, input[field]))) return expression(rule.then, input);
  }
  return expression(program.default, input);
}

function artifactCheck(rule, files) {
  try {
    const text = files[rule.path]; let ok = false;
    if (rule.kind === 'json') {
      const actual = pointer(parse(text), rule.pointer);
      if (rule.mode === 'subset') ok = subset(actual, rule.value);
      else if (rule.mode === 'set') ok = Array.isArray(actual) && actual.length === rule.value.length && rule.value.every(v => actual.some(a => isDeepStrictEqual(a, v)));
      else if (rule.mode === 'approx') ok = typeof actual === 'number' && Math.abs(actual - rule.value) <= (rule.tolerance ?? 1e-9);
      else ok = isDeepStrictEqual(actual, rule.value);
    } else if (rule.kind === 'program') {
      const program = parse(text);
      ok = rule.probes.every(p => { const actual = evaluateProgram(program, p.input); return typeof actual === 'number' && typeof p.output === 'number' ? Math.abs(actual - p.output) <= 1e-9 : isDeepStrictEqual(actual, p.output); });
    } else if (rule.kind === 'csv') ok = isDeepStrictEqual(parseCSV(text), rule.rows.map(r => r.map(String)));
    else if (rule.kind === 'text') {
      if (typeof text !== 'string') throw Error('Missing text artifact');
      const words = text.trim().split(/\s+/u).filter(Boolean).length;
      ok = words >= (rule.minWords ?? 0) && words <= (rule.maxWords ?? Infinity)
        && (rule.required ?? []).every(alts => alts.some(s => text.toLowerCase().includes(s.toLowerCase())))
        && !(rule.forbidden ?? []).some(s => text.toLowerCase().includes(s.toLowerCase()));
    } else throw Error(`Unknown artifact kind: ${rule.kind}`);
    return { id: rule.id, passed: ok, detail: ok ? 'Artifact satisfies the independent outcome predicate.' : 'Artifact does not satisfy the outcome predicate.' };
  } catch (e) { return { id: rule.id, passed: false, detail: String(e.message) }; }
}

/** Tool-safe feedback: only checks the named result, never exposes expected values or process checks. */
export function checkTarget(testCase, files, target) {
  const rules = (testCase.expected?.rules ?? []).filter(r => r.path === target);
  if (!rules.length) return { passed: false, checks: [{ id: 'known-target', passed: false, detail: 'No validator for this target.' }] };
  const checks = rules.map(r => artifactCheck(r, files));
  return { passed: checks.every(c => c.passed), checks };
}

/** Canonical trace: [{name,args,result}], in actual chronological order. */
export function gradeCase(testCase, { files = {}, toolCalls = [], finalText = '', questions = [] } = {}) {
  const expected = testCase.expected ?? {}, process = expected.process ?? {};
  const rawCalls = Array.isArray(toolCalls) ? toolCalls : [];
  const calls = rawCalls.map(c => c && typeof c === 'object' ? { ...c, args: c.args && typeof c.args === 'object' ? c.args : {} } : { name: '', args: {} });
  const checks = (expected.rules ?? []).map(r => artifactCheck(r, files));
  const add = (id, passed, detail) => checks.push({ id, passed: !!passed, detail });
  const writes = calls.filter(c => c.name === 'fixture_write');
  const answers = calls.filter(c => c.name === 'ask_user_question');
  const allowed = testCase.tools ?? TOOL_NAMES;
  const callOK = c => {
    if (!allowed.includes(c.name) || !c.args || typeof c.args !== 'object') return false;
    if (['fixture_read', 'fixture_write'].includes(c.name)) {
      if (!validPath(c.args.path)) return false;
      if (c.name === 'fixture_read') return own(testCase.files, c.args.path) || (process.writePaths ?? []).includes(c.args.path);
      return (process.writePaths ?? []).includes(c.args.path) && typeof c.args.content === 'string';
    }
    if (c.name === 'fixture_check') return validPath(c.args.target) && (expected.rules ?? []).some(r => r.path === c.args.target);
    if (c.name === 'skill') return ['grilling', 'omni-method'].includes(c.args.name);
    return true;
  };
  add('tool-scope', Array.isArray(toolCalls) && rawCalls.every(c => c && typeof c === 'object' && c.args && typeof c.args === 'object') && calls.every(callOK), 'Only declared fixture tools and allowed virtual paths may be attempted.');
  const replay = { ...testCase.files }, verifiedChecks = new Map();
  let feedbackValid = true, evidenceValid = true, answerIndex = 0, answerValid = true;
  calls.forEach((c, i) => {
    if (c.name === 'fixture_read' && own(replay, c.args.path) && c.result?.content !== replay[c.args.path]) evidenceValid = false;
    if (c.name === 'fixture_search' && !isDeepStrictEqual(c.result?.sources, testCase.sources ?? [])) evidenceValid = false;
    if (c.name === 'fixture_write' && callOK(c) && c.result?.written === true) replay[c.args.path] = c.args.content;
    if (c.name === 'fixture_check') {
      const actual = checkTarget(testCase, replay, c.args.target);
      verifiedChecks.set(i, actual.passed);
      if (c.result?.passed !== actual.passed) feedbackValid = false;
    }
    if (c.name === 'ask_user_question') {
      const expectedAnswer = testCase.userAnswers?.[answerIndex++] ?? null;
      if (c.result?.answer !== expectedAnswer || typeof c.args.question !== 'string' || !c.args.question.trim()) answerValid = false;
    }
  });
  add('trace-consistency', isDeepStrictEqual(files, replay), 'Final files match successful writes replayed over initial evidence.');
  add('check-feedback-integrity', feedbackValid, 'Independent feedback agrees with rechecking the exact historical file snapshot.');
  add('answer-integrity', answerValid, 'Question replies come only from the finite fixture answer queue.');
  add('evidence-feedback-integrity', evidenceValid, 'Read and search results match frozen evidence or the exact historical file snapshot.');
  const changed = Object.keys(files).filter(p => files[p] !== testCase.files?.[p]);
  add('file-scope', changed.every(p => (process.writePaths ?? []).includes(p)) && Object.entries(testCase.files ?? {}).every(([p, s]) => (process.writePaths ?? []).includes(p) || files[p] === s), 'Inputs and unrelated virtual files stay unchanged.');
  add('observed-artifacts', (expected.rules ?? []).every(r => writes.some(c => c.args.path === r.path && c.args.content === files[r.path])) || process.noWrite === true, 'Scored outputs must be observed writes, not model claims.');
  const firstWrite = calls.findIndex(c => c.name === 'fixture_write');
  add('read-evidence', (process.reads ?? []).every(p => calls.some((c, i) => c.name === 'fixture_read' && c.args.path === p && (firstWrite < 0 || i < firstWrite))), 'Required primary evidence is read before changing artifacts.');
  if (process.search) add('source-discovery', calls.some(c => c.name === 'fixture_search' && typeof c.args.query === 'string' && c.args.query.trim()), 'Frozen sources are actually retrieved.');
  const q = process.questions ?? { min: 0, max: 0 };
  add('question-policy', answers.length >= (q.min ?? 0) && answers.length <= (q.max ?? Infinity), 'Only genuinely required questions are asked.');
  if (q.beforeWrite) add('answer-before-write', firstWrite < 0 || calls.slice(0, firstWrite).some(c => c.name === 'ask_user_question' && c.result?.answer != null), 'Resolve the material ambiguity before writing.');
  if (process.noWrite) add('no-unauthorized-write', writes.length === 0 && changed.length === 0, 'Stop for the missing user choice; do not mutate.');
  if (process.requireCapabilities) add('capability-discovery', calls.some(c => c.name === 'fixture_capabilities'), 'Check the available capability directory rather than inventing access.');
  for (const target of process.checks ?? []) {
    const lastWrite = calls.findLastIndex(c => c.name === 'fixture_write' && c.args.path === target);
    add(`validated:${target}`, calls.some((c, i) => i > lastWrite && c.name === 'fixture_check' && c.args.target === target && verifiedChecks.get(i) === true && c.result?.passed === true), 'Independent validator succeeds after the final write.');
  }
  for (const target of process.repairTargets ?? []) {
    const fail = calls.findIndex((c, i) => c.name === 'fixture_check' && c.args.target === target && verifiedChecks.get(i) === false && c.result?.passed === false);
    const firstTargetWrite = calls.findIndex(c => c.name === 'fixture_write' && c.args.path === target);
    const write = calls.findIndex((c, i) => i > fail && c.name === 'fixture_write' && c.args.path === target);
    const pass = calls.findIndex((c, i) => i > write && c.name === 'fixture_check' && c.args.target === target && verifiedChecks.get(i) === true && c.result?.passed === true);
    add(`repair-cycle:${target}`, fail >= 0 && firstTargetWrite > fail && write > fail && pass > write, 'Observe the seeded failure before editing, then a repair, then successful validation.');
  }
  // Questions/finalText are recorded by the runner, never accepted as proof of completion.
  void finalText; void questions;
  const criticalIds = new Set(['tool-scope', 'file-scope', 'trace-consistency', 'check-feedback-integrity', 'answer-integrity', 'evidence-feedback-integrity', ...(expected.critical ?? [])]);
  const criticalPassed = [...criticalIds].every(id => checks.some(c => c.id === id && c.passed));
  const outcomeIds = new Set((expected.rules ?? []).map(r => r.id));
  const outcomes = checks.filter(c => outcomeIds.has(c.id));
  const processes = checks.filter(c => !outcomeIds.has(c.id));
  const ratio = list => list.length ? list.filter(c => c.passed).length / list.length : 0;
  // Keep the artifact outcome dominant. Two deliberate stop-for-user tasks have no artifact.
  const score = outcomes.length ? 0.8 * ratio(outcomes) + 0.2 * ratio(processes) : ratio(processes);
  return { score, passed: checks.length > 0 && checks.every(c => c.passed), criticalPassed, checks };
}
