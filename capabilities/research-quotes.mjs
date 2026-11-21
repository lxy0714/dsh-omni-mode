import { types } from 'node:util';
import { A, O, S, fail, validate } from './schema.mjs';

// Supplied line arrays only. No origin reads, fetching, parsing or code execution.
const MAX_SOURCES = 100;
const MAX_QUOTES = 1000;
const MAX_LINES_PER_ITEM = 10000;
const MAX_LINE_UNITS = 10000;
const MAX_TOTAL_LINES = 20000;
const MAX_TOTAL_UNITS = 1000000;
const MAX_ISSUES = 500;
const END = '(?![\\s\\S])';
const identifier = {
  ...S(100),
  pattern: `^(?!(?:__proto__|prototype|constructor)${END})[A-Za-z0-9][A-Za-z0-9._:-]*${END}`,
  description: '大小写敏感ASCII ID，拒绝保留原型名称 / Case-sensitive ASCII ID, excluding reserved prototype names.'
};
const line = {
  ...S(MAX_LINE_UNITS, 0),
  pattern: `^[^\\u000a-\\u000d\\u0085\\u2028\\u2029]*${END}`,
  description: '原样单行；允许空行，不允许LF/CR/VT/FF/NEL/LS/PS；长度以UTF-16单位计 / Literal line, including empty; no embedded line breaks. Length is in UTF-16 code units.'
};
const coordinate = {
  type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER,
  description: '所供lines内从1开始、两端包含的位置，不是已验证的原书行号 / One-based inclusive coordinate within supplied lines, not a verified original-document line number.'
};

function freezeSchema(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeSchema(child);
  }
  return Object.freeze(value);
}

const quoteCheckSchema = freezeSchema({
  ...O({
    sources: A(O({ id: identifier, lines: A(line, MAX_LINES_PER_ITEM) }), MAX_SOURCES),
    quotes: A(O({
      id: identifier, sourceId: identifier, startLine: coordinate, endLine: coordinate,
      quotedLines: A(line, MAX_LINES_PER_ITEM)
    }), MAX_QUOTES)
  }),
  description: '仅逐行核对明确区间，不搜索别处或改写Unicode。两类ID各自唯一。所有来源行与引文行共至多20000行、1000000 UTF-16单位，包含重复引用、未引用来源和缺源引文。输出只给输入索引、固定状态与计数，不回显文本或ID。 / Exact declared-location equality only; no search or normalization. IDs unique within each list. Aggregate line/text budgets include every supplied line. Results and errors do not echo source/quote text, IDs or unknown fields.'
});

export const researchQuoteSchemas = Object.freeze({ 'research.quote-check': quoteCheckSchema });

// Guard direct JS callers before the shared JSON validator can invoke getters
// or array methods. Only whitelisted schema names and generated numeric indices
// enter diagnostic paths; never include an unknown field name or its value.
function plainData(schema, value, path, work) {
  if (types.isProxy(value) || typeof value === 'function') fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  if (schema === line) {
    validate(line, value, path);
    work.textCodeUnits += value.length;
    if (work.textCodeUnits > MAX_TOTAL_UNITS) fail('E_LIMIT', '文本总量超过上限 / Aggregate text exceeds limit', path);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const array = Array.isArray(value);
  if (schema.type !== (array ? 'array' : 'object')) fail('E_SCHEMA', '容器类型不符 / Unexpected container type', path);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    fail('E_SCHEMA', '仅接受普通JSON数据 / Plain JSON data required', path);
  }
  if (array) {
    if (value.length < schema.minItems || value.length > schema.maxItems) fail('E_LIMIT', '数组长度越界 / Array size outside bounds', path);
    if (Reflect.ownKeys(value).length !== value.length + 1) fail('E_SCHEMA', '需要普通稠密数组 / Expected plain dense array', path);
    if (schema.items === line) {
      work.lineCount += value.length;
      if (work.lineCount > MAX_TOTAL_LINES) fail('E_LIMIT', '供给总行数超过上限 / Aggregate line count exceeds limit', path);
    }
    for (let i = 0; i < value.length; i++) dataProperty(schema.items, value, i, `${path}[${i}]`, work);
    return;
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !Object.hasOwn(schema.properties, key)) fail('E_SCHEMA', '未知或非法字段 / Unknown or invalid field', path);
    dataProperty(schema.properties[key], value, key, `${path}.${key}`, work);
  }
}

function dataProperty(schema, value, key, path, work) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('E_SCHEMA', '需要普通数据字段 / Plain data field required', path);
  plainData(schema, descriptor.value, path, work);
}

const problem = Object.freeze({
  'missing-source': ['MISSING_SOURCE', '未供给所指来源 / Referenced source was not supplied'],
  'out-of-range': ['OUT_OF_RANGE', '区间反向或超出所供行 / Range reversed or outside supplied lines'],
  'line-count-mismatch': ['LINE_COUNT_MISMATCH', '引文行数与闭区间不同 / Quote line count differs from inclusive range'],
  'text-mismatch': ['TEXT_MISMATCH', '指定位置的行不逐字相等 / Lines differ at the declared location']
});

function quoteCheck(input) {
  const work = { lineCount: 0, textCodeUnits: 0 };
  plainData(quoteCheckSchema, input, '$', work);
  validate(quoteCheckSchema, input);

  const sources = new Map();
  let sourceLineCount = 0, quotedLineCount = 0;
  for (const [i, source] of input.sources.entries()) {
    if (sources.has(source.id)) fail('E_DUPLICATE', '重复来源ID / Duplicate source ID', `$.sources[${i}].id`);
    sources.set(source.id, source.lines);
    sourceLineCount += source.lines.length;
  }
  const quoteIds = new Set();
  for (const [i, quote] of input.quotes.entries()) {
    if (quoteIds.has(quote.id)) fail('E_DUPLICATE', '重复引文ID / Duplicate quote ID', `$.quotes[${i}].id`);
    quoteIds.add(quote.id);
    quotedLineCount += quote.quotedLines.length;
  }

  const issues = [];
  const issueCounts = { MISSING_SOURCE: 0, OUT_OF_RANGE: 0, LINE_COUNT_MISMATCH: 0, TEXT_MISMATCH: 0 };
  let totalIssues = 0, matchedQuoteCount = 0, comparedQuoteCount = 0, comparedLineCount = 0, mismatchedLineCount = 0;
  const results = input.quotes.map((quote, quoteIndex) => {
    const supplied = sources.get(quote.sourceId);
    let status, compared = 0, mismatched = null, firstMismatchLine = null;
    if (supplied === undefined) status = 'missing-source';
    // Test bounds before computing or iterating a caller-specified span. A huge
    // safe-integer coordinate never causes allocation or a text search.
    else if (quote.startLine > quote.endLine || quote.startLine > supplied.length || quote.endLine > supplied.length) status = 'out-of-range';
    else if (quote.quotedLines.length !== quote.endLine - quote.startLine + 1) status = 'line-count-mismatch';
    else {
      comparedQuoteCount++;
      compared = quote.quotedLines.length;
      mismatched = 0;
      for (let i = 0; i < compared; i++) {
        if (supplied[quote.startLine - 1 + i] !== quote.quotedLines[i]) {
          mismatched++;
          if (firstMismatchLine === null) firstMismatchLine = quote.startLine + i;
        }
      }
      comparedLineCount += compared;
      mismatchedLineCount += mismatched;
      status = mismatched ? 'text-mismatch' : 'matched';
    }
    if (status === 'matched') matchedQuoteCount++;
    else {
      const [code, message] = problem[status];
      totalIssues++;
      issueCounts[code]++;
      const path = `$.quotes[${quoteIndex}]` + (status === 'missing-source' ? '.sourceId'
        : status === 'line-count-mismatch' ? '.quotedLines'
          : status === 'text-mismatch' ? `.quotedLines[${firstMismatchLine - quote.startLine}]` : '');
      if (issues.length < MAX_ISSUES) issues.push({ code, path, message });
    }
    return { quoteIndex, status, comparedLineCount: compared, mismatchedLineCount: mismatched, firstMismatchLine };
  });
  return {
    valid: totalIssues === 0,
    scope: 'supplied-source-lines-only',
    lineCoordinates: '1-based-inclusive-within-supplied-source', quoteIndexBase: 0,
    matchingMethod: 'exact-line-equality-no-normalization',
    sourceCount: input.sources.length, quoteCount: input.quotes.length,
    sourceLineCount, quotedLineCount, suppliedLineCount: work.lineCount, textCodeUnits: work.textCodeUnits,
    matchedQuoteCount, comparedQuoteCount, comparedLineCount, mismatchedLineCount,
    results, issues, totalIssues, issueCounts, truncated: totalIssues > issues.length,
    sourceFilesRead: false, externalContentFetched: false,
    sourceAuthenticityVerified: false, sourceCompletenessVerified: false,
    originalSourceLineNumbersVerified: false, claimSupportEvaluated: false,
    limitation: '只核对所供片段内指定位置的逐行等值，不改写Unicode或回显输入文本/ID。空引文清单只表示核对0项；不证明来源真实完整、原始行号或结论支持。未读源文件、联网或解析PDF / Declared-location equality within supplied lines only; no normalization or input text/ID echo. An empty quote list checks zero items, not authenticity, completeness, original coordinates or claim support. No source-file reads, network or PDF parsing.'
  };
}

export const researchQuoteImplementations = Object.freeze({ 'research.quote-check': quoteCheck });
