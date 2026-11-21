// Trusted worker implementation: parse data to AST, never render HTML or fetch.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fail } from './schema.mjs';
const require = createRequire(import.meta.url);
let libraries;
function parserLibraries() {
  // These are fixed, SSRI-pinned, license-preserved local files, not user paths.
  libraries ||= { Parser: require('./vendor/commonmark-0.31.2.cjs').Parser,
    Slugger: require('./vendor/github-slugger-2.0.0/index.js').default };
  return libraries;
}
function canonicalFile(value) {
  if (value !== value.trim() || /[\u0000-\u001f\u007f\\?#]/u.test(value) || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value) || value.split('/').some(p => !p || p === '.' || p === '..')) fail('E_PATH', '需要规范POSIX相对文件路径 / Expected canonical POSIX relative file path');
  return value;
}
function location(node) {
  while (node && !node.sourcepos) node = node.parent;
  const p = node?.sourcepos || [[1, 1], [1, 1]];
  return { line: p[0][0], column: p[0][1], endLine: p[1][0], endColumn: p[1][1], locationPrecision: 'block' };
}
function inlineText(node, auditCandidates = false) {
  let out = ''; const walker = node.walker(); let event;
  while ((event = walker.next())) {
    const n = event.node; if (!event.entering || n === node) continue;
    if (auditCandidates && ['code', 'link', 'image', 'html_inline'].includes(n.type)) {
      out += ' '; walker.resumeAt(n, false); continue;
    }
    if (n.type === 'text' || n.type === 'code') out += n.literal || '';
    else if (n.type === 'softbreak' || n.type === 'linebreak') out += auditCandidates ? '\n' : ' ';
  }
  return out;
}
const distinct = (values, label) => { if (new Set(values).size !== values.length) fail('E_DUPLICATE', '清单重复 / Duplicate ' + label); };

function parseWithDefinitionEvents(Parser, markdown) {
  const parser = new Parser({ smart: false }), original = parser.inlineParser?.parseReference, definitions = [];
  // Version-pinned adapter, verified against the actual 0.31.2 source at
  // vendor/commonmark-0.31.2.cjs:8444-8522 and 8843-8863. Do not guess a new API
  // on upgrade: fail closed and re-review the pinned implementation instead.
  // The upstream function resets subject/pos, returns consumed length, and only
  // changes the supplied map. A scratch observation uses its own exact label
  // grammar/case folding, including escaped ] / multiline and list definitions.
  if (typeof original !== 'function') fail('E_PARSE', '固定解析器适配契约缺失 / Pinned parser adapter unavailable');
  parser.inlineParser.parseReference = function (text, map) {
    const scratch = Object.create(null), observed = original.call(this, text, scratch);
    const consumed = original.call(this, text, map);
    if (consumed !== observed) fail('E_PARSE', '固定解析器适配结果不一致 / Pinned parser adapter mismatch');
    if (consumed > 0) {
      const keys = Object.keys(scratch);
      if (keys.length !== 1) fail('E_PARSE', '固定引用定义观察契约失配 / Reference observation contract mismatch');
      if (definitions.length >= 10000) fail('E_LIMIT', '引用定义超过10000 / More than 10000 reference definitions');
      definitions.push(keys[0]);
    }
    return consumed;
  };
  return { root: parser.parse(markdown), definitions };
}

export function auditDocumentsCore(input) {
  const inventory = new Map();
  for (const d of input.documents) inventory.set(canonicalFile(d.path), 'document');
  for (const a of input.assets || []) canonicalFile(a);
  // Validate paths before deduplication, and never echo duplicate input values.
  distinct(input.documents.map(d => d.path), 'document path'); distinct(input.assets || [], 'asset path'); distinct(input.requiredHeadings || [], 'required heading');
  for (const a of input.assets || []) { if (inventory.has(a)) fail('E_DUPLICATE', '文档/资源路径重复 / Document/asset path collision'); inventory.set(a, 'asset'); }
  if (input.documents.reduce((n, d) => n + d.markdown.length, 0) > 1000000) fail('E_LIMIT', '正文超过100万字符 / Bodies exceed one million characters');
  const prepared = []; let totalLines = 0, brackets = 0, skippedMetadataLines = 0;
  for (const doc of input.documents) {
    const lines = doc.markdown.split(/\r\n|\n|\r/); totalLines += lines.length;
    if (totalLines > 30000) fail('E_LIMIT', '文档超过30000行 / Bundle exceeds 30000 lines');
    for (const line of lines) {
      if (line.length > 20000) fail('E_LIMIT', '单行超过20000字符 / A line exceeds 20000 characters');
      const count = (line.match(/\[/g) || []).length; brackets += count;
      if (count > 500 || brackets > 10000) fail('E_LIMIT', '方括号工作量超过每行500/全包10000 / Bracket budget exceeds 500 per line or 10000 per bundle');
    }
    let metadataEnd = -1, unclosedMetadata = false;
    if (lines[0] === '---') {
      const closing = lines.findIndex((line, i) => i > 0 && i <= 100 && /^(?:---|\.\.\.)$/.test(line));
      if (lines.slice(1, closing > 0 ? closing : 100).some(line => /^[a-z_][\w-]*[ \t]*:/i.test(line))) {
        if (closing > 0) { metadataEnd = closing; skippedMetadataLines += closing + 1; }
        else unclosedMetadata = true;
      }
    }
    prepared.push({ ...doc, lines, metadataEnd, unclosedMetadata, markdown: lines.map((line, i) => i <= metadataEnd ? '' : line).join('\n') });
  }
  const { Parser, Slugger } = parserLibraries(), issues = [], issueCounts = Object.create(null), parsed = new Map();
  let totalIssues = 0, astNodes = 0, parsedLinks = 0, referenceDefinitions = 0, unparsedCandidates = 0, skippedCodeLines = 0, inlineCodeSpans = 0;
  const problem = (file, code, loc, message) => { totalIssues++; issueCounts[code] = (issueCounts[code] || 0) + 1; if (issues.length < 200) issues.push({ code, path: file, ...loc, message }); };
  for (const doc of prepared) {
    const { root, definitions } = parseWithDefinitionEvents(Parser, doc.markdown), headings = [], anchors = new Set(), links = [], slugger = new Slugger(); let previousHeading = 0;
    const issue = (code, node, message) => problem(doc.path, code, node ? location(node) : { line: 1, column: 1, endLine: 1, endColumn: 1, locationPrecision: 'block' }, message);
    const anchor = (name, node) => { if (anchors.has(name)) issue('DUPLICATE_ANCHOR', node, '锚点重复，需要核查定位意图 / Duplicate anchor requires review'); anchors.add(name); };
    if (doc.unclosedMetadata) issue('UNEXAMINED_FRONTMATTER', null, '元数据未在前100行闭合 / Frontmatter not closed within 100 lines');
    const html = node => {
      const text = node.literal || ''; let at = 0, any = false;
      const tokens = /<!--[\s\S]*?-->|<a\s+(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)')\s*>|<\/a\s*>/gi;
      let token;
      while ((token = tokens.exec(text))) {
        if (text.slice(at, token.index).trim()) { issue('UNEXAMINED_HTML', node, '原生HTML需另行核查 / Raw HTML requires separate review'); return; }
        any = true; at = tokens.lastIndex;
        const id = token[1] || token[2];
        if (id) { if (/&(?:#\w+|[a-z][a-z\d]+);/i.test(id)) issue('UNEXAMINED_ANCHOR_ENTITY', node, 'HTML锚点实体需另行核查 / HTML anchor entity requires review'); else anchor(id, node); }
      }
      if (text.slice(at).trim() || !any) issue(text.trim().startsWith('<!--') && !text.includes('-->') ? 'UNCLOSED_HTML_COMMENT' : 'UNEXAMINED_HTML', node, 'HTML/未闭合注释未获核验 / HTML or unclosed comment not accepted');
    };
    const walker = root.walker(); let event;
    while ((event = walker.next())) {
      if (!event.entering) continue; const node = event.node;
      if (++astNodes > 150000) fail('E_LIMIT', 'AST超过150000节点 / AST exceeds 150000 nodes');
      if (node.type === 'code_block') { skippedCodeLines += node.sourcepos[1][0] - node.sourcepos[0][0] + 1; continue; }
      if (node.type === 'code') { inlineCodeSpans++; continue; }
      if (node.type === 'heading') {
        const text = inlineText(node).trim(), id = slugger.slug(text);
        if (!text) issue('EMPTY_HEADING', node, '标题为空 / Empty heading');
        if (input.checkHeadingLevels !== false && previousHeading && node.level > previousHeading + 1) issue('HEADING_LEVEL_SKIP', node, '标题层级跳跃 / Heading level skipped');
        previousHeading = node.level; anchor(id, node); headings.push({ level: node.level, text, anchor: id, ...location(node) });
      }
      if (node.type === 'link' || node.type === 'image') {
        if (++parsedLinks > 10000) fail('E_LIMIT', '链接超过10000 / More than 10000 parsed links');
        if (input.checkUnparsedSyntax !== false && inlineText(node).startsWith('^')) { issue('UNEXAMINED_FOOTNOTE', node, '脚注扩展/插入符引用有歧义，需人工核查 / Footnote extension or caret-reference ambiguity requires review'); continue; }
        links.push({ target: node.destination, ...location(node) });
      }
      if (node.type === 'html_inline' || node.type === 'html_block') html(node);
      if (input.checkUnparsedSyntax !== false && ['paragraph', 'heading'].includes(node.type)) {
        const text = inlineText(node, true);
        if (/\[\^[^\]]+\]/.test(text)) { unparsedCandidates++; issue('UNEXAMINED_FOOTNOTE', node, '脚注形状的文本不属于已核验CommonMark核心 / Footnote-shaped text is outside validated CommonMark core'); }
        if (/\[[^\]]+\]\s*\[[^\]]*\]/.test(text)) { unparsedCandidates++; issue('MISSING_REFERENCE', node, '未解析引用候选，可能为字面文本，需核实意图 / Unresolved reference candidate may be literal text; review intent'); }
        if (/\[[^\]]*\]\(/.test(text)) { unparsedCandidates++; issue('UNSUPPORTED_LINK_SYNTAX', node, '未解析链接候选需核实意图 / Unparsed link candidate requires intent review'); }
        if (/<\/?[a-z][a-z\d-]*(?:\s|>)/i.test(text)) { unparsedCandidates++; issue('UNEXAMINED_HTML', node, '未解析HTML候选需核查 / Unparsed HTML-shaped text requires review'); }
        if (/^\s*\[[^\]\n]+\]:/.test(text) && !/^\s*\[\^/.test(text)) { unparsedCandidates++; issue('UNSUPPORTED_REFERENCE_DEFINITION', node, '未解析定义候选需核查 / Unparsed reference-definition candidate requires review'); }
      }
    }
    const definitionIds = new Set(), definitionLocation = { ...location(root), locationScope: 'document' };
    // Upstream has already removed definitions before emitting inline AST. Its
    // exact definition events prevent both silent loss and a second regex parser.
    // No invented individual source offset: these events carry document range.
    for (const id of definitions) {
      referenceDefinitions++;
      if (definitionIds.has(id)) problem(doc.path, 'DUPLICATE_REFERENCE', definitionLocation, '引用定义重复；位置为整个文档块范围 / Duplicate reference definition; location is whole document block');
      definitionIds.add(id);
      if (input.checkUnparsedSyntax !== false && id.startsWith('^')) problem(doc.path, 'UNEXAMINED_FOOTNOTE', definitionLocation, '脚注形状定义未获GFM核验；位置为整个文档块 / Footnote-shaped definition not GFM-validated; document-wide block location');
    }
    for (const text of input.requiredHeadings || []) if (!headings.some(h => h.text === text)) issue('MISSING_REQUIRED_HEADING', null, '缺少声明的必要标题 / Missing caller-declared required heading');
    parsed.set(doc.path, { headings, anchors, links });
  }
  let resolvedLinks = 0, externalLinks = 0;
  for (const [file, doc] of parsed) for (const link of doc.links) {
    const target = link.target;
    // Never echo destinations: a malformed URL may contain a credential.
    const loc = { line: link.line, column: link.column, endLine: link.endLine, endColumn: link.endColumn, locationPrecision: link.locationPrecision };
    const report = (code, message) => problem(file, code, loc, message);
    if (/[\u0000-\u001f\u007f\\]/u.test(target)) { report('UNSAFE_TARGET', '目标含非法字符 / Target contains unsafe characters'); continue; }
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) {
      try {
        const u = new URL(target.startsWith('//') ? 'https:' + target : target);
        if (!['http:', 'https:', 'mailto:'].includes(u.protocol)) { report('UNSAFE_SCHEME', '协议不获允许 / Scheme not allowed'); continue; }
        if (u.username || u.password) { report('CREDENTIAL_IN_URL', 'URL包含凭据；未在诊断回显 / URL contains credentials; omitted from diagnostics'); continue; }
        if (['http:', 'https:'].includes(u.protocol) && !u.hostname) throw Error('hostname'); externalLinks++; continue;
      } catch { report('MALFORMED_URL', 'URL结构无效 / Invalid URL structure'); continue; }
    }
    let targetPath, fragment;
    try { const hash = target.indexOf('#'), before = hash < 0 ? target : target.slice(0, hash), query = before.indexOf('?'); targetPath = decodeURIComponent(query < 0 ? before : before.slice(0, query)); fragment = hash < 0 ? '' : decodeURIComponent(target.slice(hash + 1)); }
    catch { report('INVALID_ENCODING', '百分号编码无效 / Invalid percent encoding'); continue; }
    if (/[\u0000-\u001f\u007f\\]/u.test(targetPath + fragment)) { report('UNSAFE_TARGET', '解码目标含非法字符 / Decoded target contains unsafe characters'); continue; }
    if (targetPath.startsWith('/')) { report('OUTSIDE_BUNDLE', '绝对路径超出文档包范围 / Absolute path outside document bundle'); continue; }
    if (targetPath.endsWith('/')) { report('UNEXAMINED_DIRECTORY_TARGET', '目录路由不等于明确文件清单 / Directory route needs separate review'); continue; }
    const resolved = targetPath ? path.posix.normalize(path.posix.join(path.posix.dirname(file), targetPath)) : file;
    if (resolved === '..' || resolved.startsWith('../')) { report('OUTSIDE_BUNDLE', '目标越出文档根 / Target escapes document root'); continue; }
    if (!inventory.has(resolved)) { report('MISSING_TARGET', '提供的清单缺少目标 / Target absent from supplied inventory'); continue; }
    if (fragment && inventory.get(resolved) !== 'document') { report('UNEXAMINED_ASSET_FRAGMENT', '资源片段未获核验 / Asset fragment not checked'); continue; }
    if (fragment && !parsed.get(resolved).anchors.has(fragment)) { report('MISSING_ANCHOR', '目标文档缺少锚点 / Target document lacks anchor'); continue; }
    resolvedLinks++;
  }
  return { valid: totalIssues === 0, issues, totalIssues, issueCounts: { ...issueCounts }, truncated: totalIssues > issues.length,
    documentCount: parsed.size, assetCount: (input.assets || []).length, parsedLinks, resolvedLinks, externalLinks,
    detectedReferenceDefinitions: referenceDefinitions, unparsedCandidates, skippedCodeLines, inlineCodeSpans, skippedMetadataLines,
    documents: [...parsed].map(([file, d]) => ({ path: file, headings: d.headings })),
    parser: { commonmark: '0.31.2', githubSlugger: '2.0.0', referenceDefinitionAdapter: 'pinned-0.31.2-parseReference', rawHTMLRendered: false, footnoteExtensionsValidated: false },
    unparsedSyntaxChecked: input.checkUnparsedSyntax !== false, scope: 'supplied-document-bundle-only', externalContentFetched: false, actualFilesystemChecked: false,
    limitation: '仅供给文档/资源清单和CommonMark AST；GFM脚注/其他HTML需复核；位置为准确块范围而非伪精确行内偏移；不读取目标文件、不联网/渲染或证明引用真伪 / Supplied bundle/CommonMark AST only; GFM footnotes/other HTML need review; block ranges, not fabricated inline offsets; no target reads/network/rendering/source-truth acceptance' };
}
