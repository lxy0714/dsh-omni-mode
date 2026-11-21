import { types } from 'node:util';
import { A, E, O, S, fail, validate } from './schema.mjs';

// Pure declarations for one supplied narrative; no manuscript or timeline reads.
const MAX_CHAPTERS = 500;
const MAX_EVENTS_PER_CHAPTER = 1000;
const MAX_EVENTS = 10000;
const MAX_ISSUES = 500;
const END = '(?![\\s\\S])';
const identifier = {
  ...S(100),
  pattern: `^(?!(?:__proto__|prototype|constructor)${END})[A-Za-z0-9][A-Za-z0-9._:-]*${END}`,
  description: '区分大小写的规范ASCII标识，不接受保留原型名称 / Case-sensitive canonical ASCII ID; reserved prototype names are rejected.'
};
const eventsSchema = A(O({ threadId: identifier, kind: E('setup', 'payoff') }), MAX_EVENTS_PER_CHAPTER);
function freezeSchema(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeSchema(child);
  return Object.freeze(value);
}
const threadCheckSchema = freezeSchema({
  ...O({ chapters: A(O({ id: identifier, events: eventsSchema }), MAX_CHAPTERS) }),
  description: '仅供给的单叙述线；章ID唯一，按章/事件数组顺序，最多10000个事件。开放伏笔不算错误，提前或重复事件只提示复核 / Supplied single narrative only; unique chapter IDs, chapter/event array order, at most 10000 total events. Open threads are not errors; premature/repeated events request review only.'
});
export const fictionThreadSchemas = Object.freeze({ 'fiction.thread-check': threadCheckSchema });

// Direct implementation callers must also supply data, not getters/proxies or
// custom containers. Coordinates contain only schema names and numeric indices.
// Count the aggregate event budget before traversing each next event array.
function plainJSON(schema, value, path = '$', budget = { events: 0 }) {
  if (types.isProxy(value) || typeof value === 'function') fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  if (value === null || typeof value !== 'object') return;
  const array = Array.isArray(value);
  if (schema.type !== (array ? 'array' : 'object')) fail('E_SCHEMA', '容器类型不符 / Unexpected container type', path);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) fail('E_SCHEMA', '仅接受普通JSON容器 / Plain JSON container required', path);
  if (array) {
    const length = value.length;
    if (length < schema.minItems || length > schema.maxItems) fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
    if (schema === eventsSchema) {
      budget.events += length;
      if (budget.events > MAX_EVENTS) fail('E_LIMIT', '事件总数超过10000 / More than 10000 total events', path);
    }
    if (Reflect.ownKeys(value).length !== length + 1) fail('E_SCHEMA', '需要无额外属性的稠密数组 / Expected dense array without extra properties', path);
    for (let i = 0; i < length; i++) dataEntry(schema.items, value, i, `${path}[${i}]`, budget);
    return;
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !Object.hasOwn(schema.properties, key)) fail('E_SCHEMA', '未知或非法字段 / Unknown or invalid field', path);
    dataEntry(schema.properties[key], value, key, `${path}.${key}`, budget);
  }
}
function dataEntry(schema, value, key, path, budget) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('E_SCHEMA', '需要可枚举的数据项 / Expected enumerable data entry', path);
  plainJSON(schema, descriptor.value, path, budget);
}

const messages = Object.freeze({
  PAYOFF_BEFORE_SETUP: '此前未声明setup；本次payoff单列复核，后来的setup不倒填 / No earlier setup declared; review this payoff separately, without retroactive matching.',
  REPEATED_SETUP: '同一伏笔再次setup；保留首次setup，不重置或重新开放，需复核 / Repeated setup for the same thread; retain the first setup without resetting or reopening; review.',
  REPEATED_PAYOFF: '同一伏笔已回收；保留首次匹配payoff，不覆盖，需复核 / Thread already paid off; retain the first matched payoff without replacement; review.'
});
const model = '按chapters及events数组顺序；每threadId仅一个生命周期。首次setup后的首次payoff回收；此前payoff始终单列复核。重复setup不重置/重开；匹配后的payoff计为重复。按首次出现顺序输出线程，用零基索引关联输入，不回显ID / Chapter/event array order; one lifecycle per threadId. The first payoff after the first setup closes it; earlier payoffs always remain separate review findings. Repeated setups do not reset/reopen; payoffs after the match are repeats. Threads use first-occurrence order and zero-based input coordinates, without echoing IDs.';

function threadCheck(input) {
  plainJSON(threadCheckSchema, input);
  validate(threadCheckSchema, input);
  const chapterIds = new Set();
  for (const [i, chapter] of input.chapters.entries()) {
    if (chapterIds.has(chapter.id)) fail('E_DUPLICATE', '重复章ID / Duplicate chapter ID', `$.chapters[${i}].id`);
    chapterIds.add(chapter.id);
  }

  const byId = new Map(), threads = [], issues = [];
  const issueCounts = { PAYOFF_BEFORE_SETUP: 0, REPEATED_SETUP: 0, REPEATED_PAYOFF: 0 };
  let eventCount = 0, totalIssues = 0;
  function review(code, threadIndex, chapterIndex, eventIndex) {
    totalIssues++; issueCounts[code]++;
    if (issues.length < MAX_ISSUES) issues.push({ code, severity: 'review', threadIndex, path: `$.chapters[${chapterIndex}].events[${eventIndex}]`, message: messages[code] });
  }
  for (const [chapterIndex, chapter] of input.chapters.entries()) {
    for (const [eventIndex, event] of chapter.events.entries()) {
      eventCount++;
      let thread = byId.get(event.threadId);
      if (!thread) {
        thread = {
          threadIndex: threads.length, firstOccurrence: { chapterIndex, eventIndex },
          firstSetup: null, firstMatchedPayoff: null,
          setupCount: 0, payoffCount: 0, payoffBeforeSetupCount: 0,
          repeatedSetupCount: 0, repeatedPayoffCount: 0
        };
        byId.set(event.threadId, thread); threads.push(thread);
      }
      if (event.kind === 'setup') {
        thread.setupCount++;
        if (thread.firstSetup === null) thread.firstSetup = { chapterIndex, eventIndex };
        else {
          thread.repeatedSetupCount++;
          review('REPEATED_SETUP', thread.threadIndex, chapterIndex, eventIndex);
        }
      } else {
        thread.payoffCount++;
        if (thread.firstSetup === null) {
          thread.payoffBeforeSetupCount++;
          review('PAYOFF_BEFORE_SETUP', thread.threadIndex, chapterIndex, eventIndex);
        } else if (thread.firstMatchedPayoff === null) thread.firstMatchedPayoff = { chapterIndex, eventIndex };
        else {
          thread.repeatedPayoffCount++;
          review('REPEATED_PAYOFF', thread.threadIndex, chapterIndex, eventIndex);
        }
      }
    }
  }
  const statusCounts = { open: 0, 'paid-off': 0, 'payoff-only': 0 };
  for (const thread of threads) {
    thread.status = thread.firstMatchedPayoff !== null ? 'paid-off' : thread.firstSetup !== null ? 'open' : 'payoff-only';
    thread.needsReview = thread.payoffBeforeSetupCount + thread.repeatedSetupCount + thread.repeatedPayoffCount > 0;
    statusCounts[thread.status]++;
  }
  return {
    scope: 'supplied-single-narrative-only', order: 'chapter-and-event-array-order',
    chapterCount: input.chapters.length, eventCount, threadCount: threads.length, statusCounts,
    needsReview: totalIssues > 0, threads, issues, totalIssues, issueCounts, truncated: totalIssues > issues.length,
    proseRead: false, storyEvaluated: false, memoryWritten: false, model,
    limitation: '仅核对供给的单叙述线声明；数组顺序不是故事时间。不读写正文、推断隐喻、合并分支或评价剧情；需复核不代表故事错误，开放伏笔并非错误 / Supplied single-narrative declarations only; array order is not story time. No prose I/O, metaphor inference, branch merging or literary judgment; review does not prove a story error, and open threads are not errors.'
  };
}

export const fictionThreadImplementations = Object.freeze({ 'fiction.thread-check': threadCheck });
