import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './schema.mjs';
import { documentSchemas, documentImplementations, decodeDocumentWorkerResult } from './documents-audit.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const audit = input => { validate(documentSchemas['documents.audit'], input); return documentImplementations['documents.audit'](input); };
const one = markdown => ({ documents: [{ path: 'README.md', markdown }] });
const codes = report => report.issues.map(i => i.code);

test('audit checks supplied cross-document anchors, assets and standard reference links', () => {
  const r = audit({ documents: [
    { path: 'README.md', markdown: '# Root\n[Guide](docs/guide.md#你好-world)\n![chart](art/chart.png)\n[Evidence][spec]\n\n[spec]: https://example.org/spec' },
    { path: 'docs/guide.md', markdown: '# 你好 World\n[Back](../README.md#root)' }
  ], assets: ['art/chart.png'] });
  assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 3); assert.equal(r.externalLinks, 1);
  assert.equal(r.detectedReferenceDefinitions, 1); assert.equal(r.parser.footnoteExtensionsValidated, false);
  assert.equal(r.actualFilesystemChecked, false); assert.equal(r.externalContentFetched, false);
});
test('missing files/anchors and unresolved reference or footnote candidates are never called clean', () => {
  const r = audit(one('# Title\n[missing](absent.md)\n[anchor](#nope)\n[x][no-def]\n[^no-note]'));
  for (const c of ['MISSING_TARGET', 'MISSING_ANCHOR', 'MISSING_REFERENCE', 'UNEXAMINED_FOOTNOTE']) assert.ok(codes(r).includes(c));
  assert.equal(r.issues.find(i => i.code === 'MISSING_TARGET').line, 2);
  assert.equal(r.issues.find(i => i.code === 'MISSING_TARGET').path, 'README.md');
  assert.equal(r.valid, false);
});
test('ordinary undefined shortcut brackets are plain text, but defined shortcuts resolve', () => {
  // A definition cannot interrupt an existing paragraph; the blank is semantic.
  const r = audit(one('# A\n[not a link] [known]\n\n[known]: #a'));
  assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 1); assert.equal(r.detectedReferenceDefinitions, 1);
});
test('repeated heading slugs and collisions follow stable suffixes', () => {
  const r = audit(one('# A\n## A\n## A-1\n[one](#a) [two](#a-1) [three](#a-1-1)'));
  assert.equal(r.valid, true); assert.deepEqual(r.documents[0].headings.map(h => h.anchor), ['a', 'a-1', 'a-1-1']);
});
test('fences, inline code, escaped links and HTML comments do not invent live references', () => {
  const md = '# Real\n```md <!-- not a comment here\n[bad](missing.md)\n```\n`[bad](missing.md)`\n\\[bad](missing.md)\n<!--\n[bad](missing.md)\n-->\n[yes](#real)';
  // Escaped literal link-shaped text is not a live link. Explicitly exclude
  // optional intent heuristics for this literal-focused case, not real links.
  const r = audit({ ...one(md), checkUnparsedSyntax: false }); assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 1); assert.equal(r.skippedCodeLines, 3);
});
test('different exact backtick delimiter lengths do not close one another', () => {
  assert.equal(audit(one('# A\n`` [bad](missing) ` still code ``\n[x](#a)')).valid, true);
  assert.equal(audit(one('# A\n` unmatched [bad](missing)')).valid, false);
});
test('nested linked images and angle/spaced destinations are checked separately', () => {
  const r = audit({ documents: [{ path: 'README.md', markdown: '# A\n[![pic](pic.png)](<design docs/guide.md> "guide")' }, { path: 'design docs/guide.md', markdown: '# Guide' }], assets: ['pic.png'] });
  assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 2);
});
test('brackets inside link destinations or titles are not reference syntax', () => {
  const r = audit(one('# A\n[x](https://example.org/[a][missing] "[b][no]")'));
  assert.equal(r.valid, true); assert.equal(r.externalLinks, 1);
});
test('escaped parentheses and balanced parentheses in paths are supported', () => {
  const r = audit({ documents: [{ path: 'README.md', markdown: '# A\n[x](a(b).md)\n[y](a\\(b\\).md)' }, { path: 'a(b).md', markdown: '# B' }] });
  assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 2);
});
test('percent encoded Chinese anchors/spaces resolve without case guessing', () => {
  const r = audit({ documents: [{ path: 'README.md', markdown: '# A\n[x](a%20b.md#%E4%BD%A0%E5%A5%BD)' }, { path: 'a b.md', markdown: '# 你好' }] });
  assert.equal(r.valid, true);
  // CommonMark normalizes a literal malformed percent into %25; it is then an
  // absent literal anchor, not raw URI validation. Invalid UTF-8 still rejects.
  assert.ok(codes(audit(one('# A\n[x](#%ZZ)'))).includes('MISSING_ANCHOR'));
  assert.ok(codes(audit(one('# A\n[x](#%E0%A4)'))).includes('INVALID_ENCODING'));
});
test('decoded traversal, absolute targets, backslashes and active protocols fail closed', () => {
  const r = audit(one('# A\n[a](../outside.md)\n[b](%2e%2e/outside.md)\n[c](/root/private.md)\n[d](javascript:alert(1))\n[e](a%5Cb.md)'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('OUTSIDE_BUNDLE')); assert.ok(codes(r).includes('UNSAFE_SCHEME')); assert.ok(codes(r).includes('UNSAFE_TARGET'));
});
test('URL credentials are rejected without echoing secrets into diagnostics', () => {
  const r = audit(one('# A\n[x](https://owner:SECRET@example.org/path)'));
  assert.ok(codes(r).includes('CREDENTIAL_IN_URL')); assert.ok(!JSON.stringify(r).includes('SECRET'));
});
test('explicit named anchors work while unexamined raw HTML cannot get a clean audit', () => {
  assert.equal(audit(one('# A\n<a id="custom"></a>\n[x](#custom)')).valid, true);
  const r = audit(one('# A\n<div><a href="missing.md">x</a></div>')); assert.equal(r.valid, false); assert.ok(codes(r).includes('UNEXAMINED_HTML'));
});
test('heading code text, emphasis and intraword underscores produce useful anchors', () => {
  const r = audit(one('# `<T>` and *bold* a_b_c\n[x](#t-and-bold-a_b_c)'));
  assert.equal(r.valid, true); assert.equal(r.documents[0].headings[0].anchor, 't-and-bold-a_b_c');
});
test('Setext and ordinary quoted headings are resolved', () => {
  const r = audit(one('Title\n=====\n> ## Quoted\n[x](#title) [y](#quoted)'));
  assert.equal(r.valid, true); assert.deepEqual(r.documents[0].headings.map(h => h.level), [1, 2]);
});
test('heading jumps and explicitly required headings are distinct checks', () => {
  const r = audit({ ...one('# Title\n### Skip'), requiredHeadings: ['Sources'] });
  assert.ok(codes(r).includes('HEADING_LEVEL_SKIP')); assert.ok(codes(r).includes('MISSING_REQUIRED_HEADING'));
  assert.equal(audit({ ...one('# Title\n### Skip'), checkHeadingLevels: false }).valid, true);
});
test('duplicate definitions and explicit anchors are visible instead of silently overwritten', () => {
  // A blank ends the HTML block before subsequent Markdown definitions.
  const r = audit(one('# A\n<a id="a"></a>\n\n[x]: #a\n[X]: #a'));
  for (const c of ['DUPLICATE_ANCHOR', 'DUPLICATE_REFERENCE']) assert.ok(codes(r).includes(c));
});
test('asset inventory does not certify asset fragments or the real filesystem', () => {
  const r = audit({ ...one('# A\n[x](report.pdf#page=2)'), assets: ['report.pdf'] });
  assert.ok(codes(r).includes('UNEXAMINED_ASSET_FRAGMENT')); assert.equal(r.actualFilesystemChecked, false);
});
test('empty destinations and query strings do not invent missing files', () => {
  const r = audit(one('# A\n[x]()\n[y](?download=1#a)')); assert.equal(r.valid, true); assert.equal(r.resolvedLinks, 2);
});
test('malformed definitions, malformed links and unclosed comments require review', () => {
  // Without this blank, CommonMark can use the next line as a valid destination.
  assert.ok(codes(audit(one('# A\n[x]:\n\n[x][x]'))).includes('UNSUPPORTED_REFERENCE_DEFINITION'));
  assert.ok(codes(audit(one('# A\n[x](<no close)'))).includes('UNSUPPORTED_LINK_SYNTAX'));
  assert.ok(codes(audit(one('# A\n<!-- unfinished'))).includes('UNCLOSED_HTML_COMMENT'));
});
test('schema and inventory enforce closed bounded typed inputs', () => {
  assert.throws(() => audit({ ...one('# A'), unknown: true }), { code: 'E_SCHEMA' });
  assert.throws(() => audit({ documents: [{ path: '../escape.md', markdown: '# A' }] }), { code: 'E_PATH' });
  assert.throws(() => audit({ documents: [{ path: 'A.md', markdown: '# A' }, { path: 'A.md', markdown: '# B' }] }), { code: 'E_DUPLICATE' });
  assert.throws(() => audit({ ...one('# A'), assets: ['README.md'] }), { code: 'E_DUPLICATE' });
  assert.throws(() => audit({ documents: [] }), { code: 'E_LIMIT' });
  assert.throws(() => audit(JSON.parse('{"documents":[{"path":"a.md","markdown":"# A","__proto__":{}}]}')), { code: 'E_SCHEMA' });
});
test('issues remain bounded with exact counts, and input remains unchanged', () => {
  const input = one('# A\n' + Array.from({ length: 250 }, (_, n) => `[x](missing-${n}.md)`).join('\n'));
  const before = JSON.stringify(input), r = audit(input);
  assert.equal(r.totalIssues, 250); assert.equal(r.issues.length, 200); assert.equal(r.issueCounts.MISSING_TARGET, 250); assert.equal(r.truncated, true);
  assert.equal(JSON.stringify(input), before);
});
test('oversized line and hostile markup density fail with a structured resource limit', () => {
  assert.throws(() => audit(one('a'.repeat(20001))), { code: 'E_LIMIT' });
  assert.throws(() => audit(one('[x] '.repeat(501))), { code: 'E_LIMIT' });
});

test('standard metadata frontmatter is skipped but is not itself certified as valid YAML', () => {
  const r = audit(one('---\nname: example\ndescription: data [not](missing.md)\n---\n# Real\n[x](#real)'));
  assert.equal(r.valid, true); assert.equal(r.skippedMetadataLines, 4); assert.equal(r.documents[0].headings[0].line, 5);
  assert.ok(codes(audit(one('---\nname: x\n# Body'))).includes('UNEXAMINED_FRONTMATTER'));
});
test('multi-line Setext headings and numeric entities use their rendered text', () => {
  const r = audit(one('A long\ntitle\n=====\n\n## &#x4F60;&#22909;\n[x](#a-long-title) [y](#你好)'));
  assert.equal(r.valid, true); assert.equal(r.documents[0].headings[0].text, 'A long title');
});
test('standard named entities are rendered before the pinned GitHub slug calculation', () => {
  const r = audit(one('# &copy; Notice\n[x](#-notice)'));
  assert.equal(r.valid, true); assert.equal(r.documents[0].headings[0].text, '© Notice');
});
test('standard multi-line link labels are parsed and missing targets are real errors', () => {
  const r = audit(one('# A\n[long\nlabel](missing.md)'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
  assert.equal(r.issues[0].locationPrecision, 'block');
  assert.equal(r.issues[0].line, 2); assert.equal(r.issues[0].endLine, 3);
});
test('deep list continuation cannot be silently ignored as an indented code block', () => {
  const r = audit(one('# A\n- Item\n    [missing](absent.md)'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('email autolinks are structural external links, not raw HTML or verified mailboxes', () => {
  const r = audit(one('# A\n<owner@example.org>'));
  assert.equal(r.valid, true); assert.equal(r.externalLinks, 1); assert.equal(r.externalContentFetched, false);
});

// Independent review found these false-clean counterexamples in the rejected
// prototype. Its byte-identical source/tests are archived, not re-labelled pass.
test('a named anchor in an inline code span cannot satisfy a real link', () => {
  const r = audit(one('# Top\n`<a id="ghost"></a>`\n[x](#ghost)'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_ANCHOR'));
});
test('comment markers in code spans cannot swallow a live missing link', () => {
  const r = audit(one('# Top\n`<!--` [bad](missing.md) `-->`'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('an escaped comment opener does not start an HTML comment', () => {
  const r = audit(one('# Top\n\\<!-- [bad](missing.md) -->'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('indented text cannot silently interrupt an existing paragraph as code', () => {
  const r = audit(one('Paragraph\n    [bad](missing.md)'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('incomplete multiline HTML-shaped text requires review, not a clean claim', () => {
  const r = audit(one('# Top\n<img\n  src="missing.png"\n>'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('UNEXAMINED_HTML'));
});
test('reference-form heading links contribute their displayed label to anchors', () => {
  const r = audit(one('# [Guide][ref]\n[ref]: https://example.org/\n[x](#guide)'));
  assert.equal(r.valid, true); assert.equal(r.documents[0].headings[0].anchor, 'guide');
  const wrong = audit(one('# [Guide][ref]\n[ref]: https://example.org/\n[x](#guideref)'));
  assert.equal(wrong.valid, false); assert.ok(codes(wrong).includes('MISSING_ANCHOR'));
});
test('reference definitions in blockquotes participate in standard global resolution', () => {
  const r = audit(one('# Top\n[r]\n\n> [r]: missing.md'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('backslashes inside code spans do not escape the closing backtick', () => {
  const r = audit(one('# Top\n`a\\` [bad](missing.md) `c`'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('MISSING_TARGET'));
});
test('HTML entities in destinations resolve to rendered filenames, not raw spelling', () => {
  const input = one('# Top\n[x](a&amp;b.md)');
  assert.equal(audit({ ...input, assets: ['a&b.md'] }).valid, true);
  const wrong = audit({ ...input, assets: ['a&amp;b.md'] });
  assert.equal(wrong.valid, false); assert.ok(codes(wrong).includes('MISSING_TARGET'));
});
test('multiline code spans remain literal and do not generate missing-file claims', () => {
  const r = audit(one('# Top\n`across\n[not-live](missing.md)\nlines`'));
  assert.equal(r.valid, true); assert.equal(r.parsedLinks, 0); assert.equal(r.inlineCodeSpans, 1);
});
test('balanced destinations in headings and empty link titles are standard syntax', () => {
  const r = audit({ ...one('# [Guide](a(b).md)\n[x](#guide "")'), assets: ['a(b).md'] });
  assert.equal(r.valid, true); assert.equal(r.documents[0].headings[0].anchor, 'guide');
  assert.equal(audit(one('# Top\n[r]: #top ""\n[r]')).valid, true);
});
test('Unicode reference case folding is delegated to the pinned standard parser', () => {
  assert.equal(audit(one('# Top\n[STRASSE]\n\n[straße]: #top')).valid, true);
});
test('frontmatter cannot bypass physical line limits or be counted as live references', () => {
  assert.throws(() => audit(one('---\nname: '+ 'x'.repeat(20001) +'\n---\n# Body')), { code: 'E_LIMIT' });
  const r = audit(one('---\nname: x\n[x]: missing.md\n---\n# Body'));
  assert.equal(r.valid, true); assert.equal(r.detectedReferenceDefinitions, 0);
});
test('GFM footnotes are explicitly unvalidated rather than claimed correct by core CommonMark', () => {
  const r = audit(one('# Top\n[^n]\n\n[^n]: https://example.org/'));
  assert.equal(r.valid, false); assert.ok(codes(r).includes('UNEXAMINED_FOOTNOTE')); assert.equal(r.parser.footnoteExtensionsValidated, false);
});
test('literal intent candidates can be explicitly excluded, with that scope visible', () => {
  const input = one('# Top\n\\[literal](not-a-live-link)');
  assert.equal(audit(input).valid, false);
  const r = audit({ ...input, checkUnparsedSyntax: false });
  assert.equal(r.valid, true); assert.equal(r.parsedLinks, 0); assert.equal(r.unparsedSyntaxChecked, false);
});
test('worker source hashes and original license texts are pinned and parser is not loaded in the caller', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./vendor/provenance.json', import.meta.url)));
  for (const entry of manifest.files) {
    const b = fs.readFileSync(new URL('./vendor/' + entry.path, import.meta.url));
    assert.equal(createHash('sha256').update(b).digest('hex'), entry.sha256);
  }
  assert.equal(manifest.npmInstallOrBuildScriptsExecuted, false);
  assert.ok(!Object.keys(createRequire(import.meta.url).cache).some(p => /vendor.*(?:commonmark|github-slugger)/.test(p)));
});
test('explicit mock worker failures cannot be mistaken for an accepted audit', () => {
  for (const child of [{ error: { code: 'ETIMEDOUT' } }, { error: { code: 'ENOBUFS' } }, { signal: 'SIGABRT' }]) assert.throws(() => decodeDocumentWorkerResult(child), { code: 'E_LIMIT' });
  assert.throws(() => decodeDocumentWorkerResult({ error: { code: 'ENOENT' } }), { code: 'E_RUNTIME' });
  assert.throws(() => decodeDocumentWorkerResult({ status: 0, stdout: '{}' }), { code: 'E_PARSE' });
  assert.throws(() => decodeDocumentWorkerResult({ status: 0, stdout: '{"result":{"valid":true}}' }), { code: 'E_PARSE' });
  assert.throws(() => decodeDocumentWorkerResult({ status: 1, stdout: '{"error":{"code":"E_PATH","message":"fixture"}}' }), { code: 'E_PATH' });
});
test('parser-consumed standalone footnote definitions cannot disappear before review', () => {
  for (const body of ['[^n]: https://example.org/', '> [^n]: https://example.org/', '- [^n]: https://example.org/']) {
    const r = audit(one('# A\n\n' + body));
    assert.equal(r.valid, false); assert.equal(r.detectedReferenceDefinitions, 1); assert.ok(codes(r).includes('UNEXAMINED_FOOTNOTE'));
    assert.ok(r.issues.some(i => i.locationScope === 'document'));
  }
});
test('multiline unresolved candidates require review without inventing real links', () => {
  for (const [body, code] of [['[x\ny][undefined]', 'MISSING_REFERENCE'], ['[x][multi\nline]', 'MISSING_REFERENCE'], ['[x\ny](<bad)', 'UNSUPPORTED_LINK_SYNTAX']]) {
    const r = audit(one('# A\n' + body)); assert.equal(r.valid, false); assert.ok(codes(r).includes(code)); assert.equal(r.parsedLinks, 0);
  }
});
test('duplicate definitions use the pinned parser grammar and lower-then-upper folding', () => {
  for (const body of ['[a\\]b]: #a\n[A\\]B]: #a\n\n[a\\]b]', '- Text\n\n    [r]: #a\n    [R]: #a\n\n[r]', '[multi\nline]: #a\n[multi line]: #a\n\n[multi line]', '[ẞ]: #a\n[ß]: #a\n\n[SS]']) {
    const r = audit(one('# A\n\n' + body));
    assert.equal(r.valid, false); assert.equal(r.detectedReferenceDefinitions, 2); assert.ok(codes(r).includes('DUPLICATE_REFERENCE'));
  }
});
test('duplicate invalid inventory paths cannot echo synthetic URL credentials', () => {
  const secret = 'SYNTHETIC_SECRET', invalid = 'https://owner:' + secret + '@example.org/p';
  for (const input of [{ documents: [{ path: invalid, markdown: '' }, { path: invalid, markdown: '' }] }, { ...one('# A'), assets: [invalid, invalid] }]) {
    assert.throws(() => audit(input), error => error.code === 'E_PATH' && !String(error.message).includes(secret));
  }
});
