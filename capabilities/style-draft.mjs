import { types } from 'node:util';
import { B, E, O, fail, validate } from './schema.mjs';

const scope = E('current-task', 'current-draft');
const rule = O({
  length: E('default', 'concise', 'detailed'),
  tone: E('default', 'neutral', 'warm', 'direct'),
  structure: E('default', 'paragraphs', 'bullets', 'steps')
});
const undo = O({ scope, expectedCurrent: rule, restore: rule });
const schema = O({
  action: E('draft', 'revert'), scope, current: rule,
  consent: B, proposed: rule, undo
}, ['action', 'scope', 'current']);
const keys = Object.keys(rule.properties);
const rows = Object.freeze({
  length: Object.freeze({ default: ['不另设篇幅偏好。', 'No additional length preference.'], concise: ['先给结论，删掉重复说明。', 'Lead with the conclusion and remove repetition.'], detailed: ['补充必要步骤和边界。', 'Include necessary steps and limitations.'] }),
  tone: Object.freeze({ default: ['不另设语气偏好。', 'No additional tone preference.'], neutral: ['用平实、中性的语气。', 'Use a plain, neutral tone.'], warm: ['用友善语气，不冒充关系或身份。', 'Use a warm tone without inventing a relationship or identity.'], direct: ['用直白的措辞，避免不必要的铺垫。', 'Use direct language without unnecessary lead-in.'] }),
  structure: Object.freeze({ default: ['不另设排版偏好。', 'No additional formatting preference.'], paragraphs: ['优先组织为短段落。', 'Prefer short paragraphs.'], bullets: ['优先用项目符号组织并列要点。', 'Prefer bullets for parallel points.'], steps: ['有明确顺序时优先用编号步骤。', 'Prefer numbered steps when the material has an order.'] })
});
const copy = obj => Object.fromEntries(keys.map(key => [key, obj[key]]));

// The executable API accepts closed JSON data, not JS objects with getters,
// functions, custom prototypes or proxies. Unknown names are never reflected.
function plain(schema, value, path = '$') {
  if (types.isProxy(value) || typeof value === 'function') fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  if (value === null || typeof value !== 'object') return;
  const proto = Object.getPrototypeOf(value);
  if (schema.type !== 'object' || (proto !== Object.prototype && proto !== null)) fail('E_SCHEMA', '需要普通对象 / Plain object required', path);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !Object.hasOwn(schema.properties, key)) fail('E_SCHEMA', '未知字段 / Unknown field', path);
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d.enumerable || !Object.hasOwn(d, 'value')) fail('E_SCHEMA', '需要普通数据字段 / Plain data field required', `${path}.${key}`);
    plain(schema.properties[key], d.value, `${path}.${key}`);
  }
}
function exactFields(input, fields) {
  const expected = new Set(['action', 'scope', 'current', ...fields]);
  if (Object.keys(input).some(k => !expected.has(k)) || [...expected].some(k => !Object.hasOwn(input, k))) {
    fail('E_SCHEMA', '字段不符合所选动作 / Fields do not match the selected action');
  }
}
const simplify = value => keys.map(dimension => ({ dimension, value: value[dimension], zh: rows[dimension][value[dimension]][0], en: rows[dimension][value[dimension]][1] }));
function base(scope, status) {
  return {
    scope, status, rules: [], proposedState: null, undo: null,
    memoryWritten: false, profileChanged: false, rulesApplied: false,
    limitation: '只处理显式选项，不推断长期偏好；结果是当前范围建议，不改事实、引用或安全边界 / Explicit choices only; no inference of long-term preferences. A scoped proposal does not change facts, citations or safety boundaries.'
  };
}
function styleDraft(input) {
  plain(schema, input);
  validate(schema, input);
  if (input.action === 'draft') {
    exactFields(input, ['consent', 'proposed']);
    if (input.consent !== true) return base(input.scope, 'consent-required');
    const proposedState = copy(input.proposed);
    const current = copy(input.current);
    return { ...base(input.scope, 'draft'), rules: simplify(proposedState), proposedState,
      undo: { scope: input.scope, expectedCurrent: copy(proposedState), restore: current } };
  }
  exactFields(input, ['undo']);
  if (input.scope !== input.undo.scope || !keys.every(key => input.current[key] === input.undo.expectedCurrent[key])) {
    return base(input.scope, 'undo-conflict');
  }
  const restored = copy(input.undo.restore);
  return { ...base(input.scope, 'revert-draft'), rules: simplify(restored), proposedState: restored };
}

export const styleDraftSchemas = Object.freeze({ 'personalization.style-draft': schema });
export const styleDraftImplementations = Object.freeze({ 'personalization.style-draft': styleDraft });
