import { A, B, E, N, O, S, fail, unique, utc, validate } from './schema.mjs';
const scalar = { type: 'scalar' };
const field = O({ name: S(100), type: E('string', 'number', 'boolean'), required: B, unique: B }, ['name', 'type']);
const MAX_ISSUES = 500;
// Fully scan inputs, retaining only bounded examples and exact aggregate counts.
function issueList() {
  const list = []; let total = 0; const counts = Object.create(null);
  Object.defineProperties(list, {
    push: { value: (...items) => { for (const item of items) { total++; counts[item.code] = (counts[item.code] || 0) + 1; if (list.length < MAX_ISSUES) Array.prototype.push.call(list, item); } return list.length; } },
    total: { get: () => total }, counts: { get: () => ({ ...counts }) }
  }); return list;
}
const report = (issues, extra = {}) => ({ valid: (issues.total ?? issues.length) === 0, issues, totalIssues: issues.total ?? issues.length, issueCounts: issues.counts ?? {}, truncated: (issues.total ?? issues.length) > issues.length, ...extra });
function sourceURL(value) { try { const u = new URL(value); return value === value.trim() && !/[\u0000-\u0020\u007f]/u.test(value) && ['http:', 'https:'].includes(u.protocol) && Boolean(u.hostname); } catch { return false; } }
const issue = (code, path, message) => ({ code, path, message });
const finite = x => { if (!Number.isFinite(x)) fail('E_RANGE', '计算超出有限范围 / Computation exceeds finite range'); return x; };

// RFC4180-style comma/quote parser: retains strings and rejects malformed quoting.
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', state = 'plain';
  const endCell = () => { row.push(cell); cell = ''; state = 'plain'; };
  const endRow = () => { endCell(); rows.push(row); row = []; if (rows.length > 10001) fail('E_LIMIT', 'CSV超过10000数据行 / CSV exceeds 10000 data rows'); };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (state === 'quoted') { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else state = 'closed'; } else cell += c; continue; }
    if (c === ',') { endCell(); continue; }
    if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); continue; }
    if (state === 'closed') fail('E_CSV', '引号后有额外字符 / Unexpected character after closing quote');
    if (c === '"') { if (cell) fail('E_CSV', '未转义引号 / Quote inside unquoted cell'); state = 'quoted'; } else cell += c;
  }
  if (state === 'quoted') fail('E_CSV', '引号未闭合 / Unterminated quoted cell');
  if (cell || row.length || state === 'closed') endRow();
  if (!rows.length) fail('E_CSV', '缺少标题行 / Missing header row');
  const columns = rows.shift(); unique(columns, 'column');
  if (columns.some(x => !x || ['__proto__', 'constructor', 'prototype'].includes(x))) fail('E_CSV', '标题为空或保留名称 / Empty or reserved header');
  if (columns.length > 100) fail('E_LIMIT', '列数超过100 / More than 100 columns');
  rows.forEach((r, i) => { if (r.length !== columns.length) fail('E_CSV', `第${i + 2}行列数不匹配 / Column count mismatch on row ${i + 2}`); });
  return { columns, rows };
}
const tableSchema = O({ columns: A(S(100), 100, 1), rows: A(A(scalar, 100), 10000) });
function table(input) {
  if (input.format === 'csv') { if (!Object.hasOwn(input, 'text') || Object.hasOwn(input, 'table')) fail('E_INPUT', 'CSV只接受text / CSV requires text only'); return parseCSV(input.text); }
  if (!input.table || Object.hasOwn(input, 'text')) fail('E_INPUT', 'JSON只接受table / JSON requires table only');
  unique(input.table.columns, 'column');
  input.table.rows.forEach((r, i) => { if (r.length !== input.table.columns.length) fail('E_INPUT', `行${i}宽度错误 / Row ${i} width mismatch`); });
  return input.table;
}
const inputTable = { format: E('csv', 'json'), text: S(1000000, 0), table: tableSchema };
const schemas = {
  'data.validate': O({ ...inputTable, fields: A(field, 100, 1) }, ['format', 'fields']),
  'data.transform': O({ ...inputTable, select: A(S(100), 100, 1), rename: A(O({ from: S(100), to: S(100) }), 100), filter: O({ column: S(100), equals: scalar }), outputFormat: E('json', 'csv'), formulaPolicy: E('reject', 'escape') }, ['format', 'select', 'outputFormat']),
  'game.balance': O({ units: A(O({ id: S(100), hp: N(0.000001), damage: N(), interval: N(0.000001), cost: N(0.000001) }), 500, 1), maxEfficiencyRatio: N(1, 1e9) }, ['units']),
  'fiction.continuity': O({ entities: A(S(100), 500), facts: A(O({ entity: S(100), key: S(100), value: scalar, from: N(), to: N() }), 2000), scenes: A(O({ id: S(100), time: N(), mentions: A(S(100), 500), assertions: A(O({ entity: S(100), key: S(100), value: scalar }), 500) }), 1000) }),
  'molbio.fasta': O({ text: S(1000000), alphabet: E('dna', 'rna') }),
  'business.model': O({ entities: A(O({ id: S(100), fields: A(O({ name: S(100), type: E('string', 'number', 'boolean', 'date'), primary: B, nullable: B, unique: B }, ['name', 'type']), 100, 1) }), 500, 1), relations: A(O({ from: O({ entity: S(100), field: S(100) }), to: O({ entity: S(100), field: S(100) }), cardinality: E('one-to-one', 'many-to-one', 'one-to-many', 'many-to-many') }), 2000) }),
  'research.evidence': O({ sources: A(O({ id: S(100), title: S(1000), url: S(2000) }), 2000), claims: A(O({ id: S(100), text: S(5000), sourceIds: A(S(100), 100) }), 2000) }),
  'cyber.indicators': O({ text: S(1000000, 0) }),
  'documents.outline': O({ title: S(1000), sections: A(O({ heading: S(1000), body: S(100000, 0), sourceIds: A(S(100), 100) }, ['heading', 'body']), 100), sources: A(O({ id: S(100), title: S(1000), url: S(2000) }), 500) }),
  'assistant.todo': O({ title: S(1000), items: A(O({ id: S(100), text: S(5000), done: B, dependsOn: A(S(100), 100), due: S(10) }, ['id', 'text', 'done', 'dependsOn']), 1000) }),
  'assistant.ics': O({ events: A(O({ uid: S(200), summary: S(1000), start: S(20), end: S(20), description: S(10000, 0), location: S(2000, 0) }, ['uid', 'summary', 'start', 'end']), 1000, 1) })
};
const implementations = {
  'data.validate'(x) {
    const t = table(x); unique(x.fields.map(f => f.name), 'field'); const issues = issueList();
    for (const f of x.fields) {
      const col = t.columns.indexOf(f.name); if (col < 0) { issues.push(issue('MISSING_COLUMN', f.name, '缺少列 / Missing column')); continue; }
      const seen = new Set();
      t.rows.forEach((r, i) => {
        const v = r[col], path = `rows[${i}].${f.name}`, empty = v === null || v === '';
        if (empty) { if (f.required) issues.push(issue('REQUIRED', path, '必填值为空 / Required value empty')); return; }
        // CSV remains text: lexical numeric/boolean validation, never implicit transform.
        const good = x.format === 'csv' ? f.type === 'string' || (f.type === 'number' ? /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v) && Number.isFinite(Number(v)) : ['true', 'false'].includes(v)) : typeof v === f.type;
        if (!good) issues.push(issue('TYPE', path, '类型不匹配 / Type mismatch'));
        const key = JSON.stringify(v); if (f.unique && seen.has(key)) issues.push(issue('UNIQUE', path, '值重复 / Duplicate value')); seen.add(key);
      });
    }
    return report(issues, { rowCount: t.rows.length, columns: t.columns });
  },
  'data.transform'(x) {
    const t = table(x); unique(x.select, 'selection'); const renames = x.rename || []; unique(renames.map(r => r.from), 'rename');
    for (const r of renames) if (!x.select.includes(r.from)) fail('E_COLUMN', '重命名列未选中 / Rename source not selected');
    const idx = x.select.map(c => { const i = t.columns.indexOf(c); if (i < 0) fail('E_COLUMN', `未知列 / Unknown column: ${c}`); return i; });
    let rows = t.rows;
    if (x.filter) { const i = t.columns.indexOf(x.filter.column); if (i < 0) fail('E_COLUMN', '筛选列不存在 / Filter column missing'); rows = rows.filter(r => r[i] === x.filter.equals); }
    const columns = x.select.map(c => renames.find(r => r.from === c)?.to || c); unique(columns, 'output column'); rows = rows.map(r => idx.map(i => r[i]));
    if (x.outputFormat === 'json') return { columns, rows };
    const csvCell = v => { let s = v === null ? '' : String(v); if (/^[\s]*[=+@-]/u.test(s) && typeof v !== 'number') { if (x.formulaPolicy !== 'escape') fail('E_FORMULA', '潜在表格公式；需显式escape / Potential spreadsheet formula; explicitly choose escape'); s = `'${s}`; } return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; };
    return { text: [columns, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n', rowCount: rows.length };
  },
  'game.balance'(x) {
    unique(x.units.map(u => u.id), 'unit'); const units = x.units.map(u => ({ id: u.id, dps: finite(u.damage / u.interval), efficiency: finite(u.damage / u.interval / u.cost) }));
    const positive = units.map(u => u.efficiency).filter(n => n > 0); const ratio = positive.length ? finite(Math.max(...positive) / Math.min(...positive)) : null;
    const issues = issueList(); if (units.some(u => u.dps === 0)) issues.push(issue('ZERO_DAMAGE', 'units', '零输出单位需人工解释 / Zero-damage units require interpretation'));
    if (x.maxEfficiencyRatio !== undefined && ratio !== null && ratio > x.maxEfficiencyRatio) issues.push(issue('EFFICIENCY_RATIO', 'units', '超出用户阈值 / Exceeds user threshold'));
    return report(issues, { units, efficiencyRatio: ratio, model: 'dps=damage/interval; efficiency=dps/cost; no armor, RNG, movement or playtest / 不含护甲、随机、移动或实机测试' });
  },
  'fiction.continuity'(x) {
    unique(x.entities, 'entity'); unique(x.scenes.map(s => s.id), 'scene'); const known = new Set(x.entities), issues = issueList(), groups = new Map();
    x.facts.forEach((f, i) => { if (!known.has(f.entity)) issues.push(issue('UNKNOWN_ENTITY', `facts[${i}]`, f.entity)); if (f.from > f.to) fail('E_INTERVAL', '事实起止反转 / Fact interval reversed'); const key = JSON.stringify([f.entity, f.key]); const g = groups.get(key) || []; for (const prev of g) if (Math.max(prev.from, f.from) <= Math.min(prev.to, f.to) && prev.value !== f.value) issues.push(issue('CANON_CONFLICT', `facts[${i}]`, '闭区间重叠且事实不同 / Conflicting facts in overlapping closed intervals')); g.push(f); groups.set(key, g); });
    for (const s of x.scenes) { for (const m of s.mentions) if (!known.has(m)) issues.push(issue('UNKNOWN_ENTITY', `scenes.${s.id}`, m)); for (const a of s.assertions) { if (!known.has(a.entity)) issues.push(issue('UNKNOWN_ENTITY', `scenes.${s.id}`, a.entity)); const active = (groups.get(JSON.stringify([a.entity, a.key])) || []).filter(f => f.from <= s.time && f.to >= s.time); if (!active.length) issues.push(issue('UNSUPPORTED_ASSERTION', `scenes.${s.id}`, `${a.entity}.${a.key}`)); else if (active.some(f => f.value !== a.value)) issues.push(issue('CANON_MISMATCH', `scenes.${s.id}`, `${a.entity}.${a.key}`)); } }
    return report(issues, { sceneCount: x.scenes.length, limitation: '仅检查显式结构化事实，不自动理解小说正文 / Explicit structured facts only; no automatic prose understanding' });
  },
  'molbio.fasta'(x) {
    const records = []; let current; const allowed = x.alphabet === 'dna' ? /^[ACGTRYSWKMBDHVN]+$/ : /^[ACGURYSWKMBDHVN]+$/;
    for (const [i, raw] of x.text.split(/\r?\n/).entries()) { const line = raw.trim(); if (!line) continue; if (line.startsWith('>')) { const id = line.slice(1).split(/\s/)[0]; if (!id) fail('E_FASTA', '空序列标题 / Empty FASTA identifier', `line:${i + 1}`); current = { id, sequence: '' }; records.push(current); if (records.length > 10000) fail('E_LIMIT', '序列数超过10000 / Too many records'); } else { if (!current) fail('E_FASTA', '序列前缺少标题 / Sequence before header', `line:${i + 1}`); const seq = line.toUpperCase(); if (!allowed.test(seq)) fail('E_FASTA', '非法IUPAC字符或字母表 / Invalid IUPAC sequence or alphabet', `line:${i + 1}`); current.sequence += seq; } }
    if (!records.length) fail('E_FASTA', '没有FASTA记录 / No FASTA records'); unique(records.map(r => r.id), 'FASTA identifier');
    return { alphabet: x.alphabet, records: records.map(r => { if (!r.sequence.length) fail('E_FASTA', '空序列 / Empty sequence'); const counts = {}; for (const c of r.sequence) counts[c] = (counts[c] || 0) + 1; const canonical = [...(x.alphabet === 'dna' ? 'ACGT' : 'ACGU')].reduce((s, c) => s + (counts[c] || 0), 0), gc = (counts.G || 0) + (counts.C || 0); return { id: r.id, length: r.sequence.length, counts, ambiguous: r.sequence.length - canonical, gcFractionAll: gc / r.sequence.length, gcFractionCanonical: canonical ? gc / canonical : null }; }), limitation: '格式和基础统计；非临床、设计、功能或实验验证 / Format and basic statistics only, not clinical, design, functional or experimental validation' };
  },
  'business.model'(x) {
    unique(x.entities.map(e => e.id), 'entity'); const entities = new Map(x.entities.map(e => [e.id, e])); const issues = issueList();
    for (const e of x.entities) { unique(e.fields.map(f => f.name), 'field'); const pk = e.fields.filter(f => f.primary); if (!pk.length) issues.push(issue('NO_PRIMARY_KEY', e.id, '未定义主键 / No primary key')); for (const f of pk) if (f.nullable) issues.push(issue('NULLABLE_PRIMARY_KEY', `${e.id}.${f.name}`, '主键不能可空 / Primary key cannot be nullable')); }
    for (const [i, r] of x.relations.entries()) { const from = entities.get(r.from.entity)?.fields.find(f => f.name === r.from.field), to = entities.get(r.to.entity)?.fields.find(f => f.name === r.to.field); if (!from || !to) { issues.push(issue('DANGLING_RELATION', `relations[${i}]`, '端点字段不存在 / Endpoint field missing')); continue; } if (from.type !== to.type) issues.push(issue('RELATION_TYPE', `relations[${i}]`, '关联字段类型不兼容 / Incompatible endpoint types')); const fromPK = entities.get(r.from.entity).fields.filter(f => f.primary).length, toPK = entities.get(r.to.entity).fields.filter(f => f.primary).length;
      const fromUnique = from.unique || (from.primary && fromPK === 1), toUnique = to.unique || (to.primary && toPK === 1);
      if (['many-to-one', 'one-to-one'].includes(r.cardinality) && !toUnique) issues.push(issue(to.primary && toPK > 1 ? 'COMPOSITE_KEY_MAPPING_REQUIRED' : 'TARGET_NOT_UNIQUE', `relations[${i}]`, '目标字段须独立唯一；本schema不表达复合字段映射 / Target must be independently unique; composite mappings are not represented'));
      if (['one-to-many', 'one-to-one'].includes(r.cardinality) && !fromUnique) issues.push(issue(from.primary && fromPK > 1 ? 'COMPOSITE_KEY_MAPPING_REQUIRED' : 'SOURCE_NOT_UNIQUE', `relations[${i}]`, '源字段须独立唯一；本schema不表达复合字段映射 / Source must be independently unique; composite mappings are not represented'));
       if (r.cardinality === 'many-to-many') issues.push(issue('JUNCTION_REQUIRED', `relations[${i}]`, '需显式中间实体 / Explicit junction entity required')); }
    return report(issues, { entityCount: x.entities.length, relationCount: x.relations.length, limitation: '结构一致性，不执行SQL或验证真实业务共识 / Structural consistency, not SQL execution or validation of business consensus' });
  },
  'research.evidence'(x) {
    unique(x.sources.map(s => s.id), 'source'); unique(x.claims.map(c => c.id), 'claim'); const ids = new Set(x.sources.map(s => s.id)), issues = issueList();
    for (const s of x.sources) if (!sourceURL(s.url)) issues.push(issue('SOURCE_URL', s.id, '需要HTTP(S)来源URL / Expected HTTP(S) source URL'));
    for (const c of x.claims) { unique(c.sourceIds, 'claim source'); if (!c.sourceIds.length) issues.push(issue('UNSUPPORTED_CLAIM', c.id, '没有证据引用 / No evidence reference')); for (const id of c.sourceIds) if (!ids.has(id)) issues.push(issue('MISSING_SOURCE', c.id, id)); }
    return report(issues, { claimCount: x.claims.length, sourceCount: x.sources.length, limitation: '只检查引用覆盖，不联网也不判定事实真伪 / Citation coverage only; no network or truth verification' });
  },
  'cyber.indicators'(x) {
    const ipv4 = [...new Set((x.text.match(/(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g) || []).filter(ip => ip.split('.').every(n => Number(n) <= 255 && (n === '0' || !n.startsWith('0')))))].sort();
    const sha256 = [...new Set((x.text.match(/\b[a-fA-F0-9]{64}\b/g) || []).map(s => s.toLowerCase()))].sort();
    return { ipv4, sha256, limitation: '仅本地字符串提取；不是恶意判定、归因、扫描或网络连通性测试 / Local string extraction only; not maliciousness, attribution, scanning or connectivity testing' };
  },
  'documents.outline'(x) {
    const check = implementations['research.evidence']({ sources: x.sources, claims: x.sections.map((s, i) => ({ id: String(i), text: s.body, sourceIds: s.sourceIds || [] })) });
    if (check.issueCounts.MISSING_SOURCE || check.issueCounts.SOURCE_URL) fail('E_REFERENCE', '来源缺失或URL不安全 / Missing source or unsafe URL');
    const cleanHeading = s => s.replace(/[\r\n]/g, ' ').replace(/^#+\s*/, '');
    const text = `# ${cleanHeading(x.title)}\n\n` + x.sections.map(s => `## ${cleanHeading(s.heading)}\n\n${s.body}\n${s.sourceIds?.length ? `\n来源 / Sources: ${s.sourceIds.join(', ')}\n` : ''}`).join('\n') + (x.sources.length ? '\n## 来源 / Sources\n\n' + x.sources.map(s => `- ${s.id}: ${s.title.replace(/[\r\n]/g, ' ')} — ${s.url.replace(/[\r\n]/g, '')}`).join('\n') + '\n' : '');
    return { text, issues: check.issues, totalIssues: check.totalIssues, issueCounts: check.issueCounts, truncated: check.truncated, limitation: 'Markdown草稿；不是PDF/DOCX/PPTX / Markdown draft, not PDF/DOCX/PPTX' };
  },
  'assistant.todo'(x) {
    unique(x.items.map(i => i.id), 'todo'); const map = new Map(x.items.map(i => [i.id, i]));
    for (const item of x.items) { unique(item.dependsOn, 'dependency'); for (const id of item.dependsOn) if (!map.has(id)) fail('E_DEPENDENCY', '依赖任务不存在 / Missing dependency'); if (item.due) { if (!/^\d{4}-\d{2}-\d{2}$/.test(item.due)) fail('E_DATE', '截止日期格式错误 / Expected YYYY-MM-DD'); utc(`${item.due}T00:00:00Z`); } }
    const visited = new Set(), active = new Set();
    const visit = id => { if (active.has(id)) fail('E_CYCLE', '任务依赖有环 / Todo dependency cycle'); if (visited.has(id)) return; active.add(id); for (const dep of map.get(id).dependsOn) visit(dep); active.delete(id); visited.add(id); };
    for (const id of map.keys()) visit(id);
    const issues = issueList(); for (const i of x.items) if (i.done && i.dependsOn.some(d => !map.get(d).done)) issues.push(issue('DONE_BEFORE_DEPENDENCY', i.id, '任务完成但依赖未完成 / Done task has unfinished dependency'));
    const line = s => s.replace(/[\r\n]/g, ' ');
    return report(issues, { text: `# ${line(x.title)}\n\n` + x.items.map(i => `- [${i.done ? 'x' : ' '}] ${line(i.text)} (${line(i.id)})${i.due ? ` · ${i.due}` : ''}${i.dependsOn.length ? ` · 依赖 / depends: ${i.dependsOn.map(line).join(', ')}` : ''}`).join('\n') + '\n', limitation: '仅本地待办文档；不创建提醒或日程 / Local todo document only; no reminder or calendar creation' });
  },
  'assistant.ics'(x) {
    unique(x.events.map(e => e.uid), 'event uid'); const esc = s => s.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const stamp = s => s.replace(/[-:]/g, '');
    const fold = line => { const lines = []; let part = '', bytes = 0; for (const c of line) { const n = Buffer.byteLength(c); if (bytes + n > 75) { lines.push(part); part = ' '; bytes = 1; } part += c; bytes += n; } lines.push(part); return lines.join('\r\n'); };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dsh-omni-mode//Local Draft//EN', 'CALSCALE:GREGORIAN'];
    for (const e of x.events) { for (const value of Object.values(e)) if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) fail('E_ICS_TEXT', 'ICS含非法控制字符 / Invalid ICS control character'); if (utc(e.end) <= utc(e.start)) fail('E_DATE', '结束必须晚于开始 / End must be after start'); lines.push('BEGIN:VEVENT', `UID:${esc(e.uid)}`, `DTSTAMP:${stamp(e.start)}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`, `SUMMARY:${esc(e.summary)}`); for (const k of ['description', 'location']) if (e[k] !== undefined) lines.push(`${k.toUpperCase()}:${esc(e[k])}`); lines.push('END:VEVENT'); }
    lines.push('END:VCALENDAR'); return { text: lines.map(fold).join('\r\n') + '\r\n', eventCount: x.events.length, limitation: 'UTC ICS草稿；未导入/发送/预约 / UTC ICS draft; not imported, sent or booked' };
  }
};
export const operations = Object.freeze(Object.fromEntries(Object.keys(schemas).map(id => [id, { inputSchema: schemas[id], run: implementations[id] }])));
export function runOperation(id, input) { const op = Object.hasOwn(operations, id) ? operations[id] : null; if (!op) fail('E_OPERATION', '未知操作 / Unknown operation'); validate(op.inputSchema, input); return op.run(input); }
