// Maintainer-only reproducible vendoring. Downloads DATA from fixed npm archives;
// verifies SSRI, copies an explicit allowlist, and never runs install/build code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = path.join(ROOT, 'capabilities/vendor');
const sha = value => createHash('sha256').update(value).digest('hex');
const pins = [
  { name: 'commonmark', version: '0.31.2', integrity: 'sha512-2fRLTyb9r/2835k5cwcAwOj0DEc44FARnMp5veGsJ+mEAZdi52sNopLu07ZyElQUz058H43whzlERDIaaSw4rg==', license: 'BSD-2-Clause', files: { 'package/dist/commonmark.js': 'commonmark-0.31.2.cjs' }, notice: 'commonmark-LICENSE.txt' },
  { name: 'github-slugger', version: '2.0.0', integrity: 'sha512-IaOQ9puYtjrkq7Y0Ygl9KDZnrf/aiUJYUpVf89y8kyaxbRG7Y1SrX/jaumrv81vc61+kiMempujsM3Yw7w5qcw==', license: 'ISC', files: { 'package/index.js': 'github-slugger-2.0.0/index.js', 'package/regex.js': 'github-slugger-2.0.0/regex.js' }, notice: 'github-slugger-2.0.0/LICENSE.txt' },
  { name: 'mdurl', version: '1.0.1', integrity: 'sha512-/sKlQJCBYVY9Ers9hqzKou4H6V5UWc/M59TH2dvkt+84itfnq7uFOMLpOiOS4ujvHP4etln18fmIxA5R5fll0g==', license: 'MIT', files: {}, notice: 'mdurl-LICENSE.txt' },
  { name: 'entities', version: '3.0.1', integrity: 'sha512-WiyBqoomrwMdFG1e0kqvASYfnlb0lp8M5o5Fw2OFq1hNZxxcNk8Ik0Xm7LxzBhuidnZB/UtBqVCgUz3kBOP51Q==', license: 'BSD-2-Clause', files: {}, notice: 'entities-LICENSE.txt' }
];
function extract(buffer) {
  const tar = gunzipSync(buffer, { maxOutputLength: 2 * 1024 * 1024 }), files = new Map();
  for (let p = 0; p + 512 <= tar.length;) {
    const h = tar.subarray(p, p + 512); if (h.every(x => x === 0)) break;
    const str = (s, n) => h.subarray(s, s + n).toString().split('\0')[0];
    const name = [str(345, 155), str(0, 100)].filter(Boolean).join('/'), octal = str(124, 12).trim();
    if (!/^[0-7]+$/.test(octal)) throw Error('Unsupported tar size');
    const n = Number.parseInt(octal, 8), start = p + 512; if (start + n > tar.length) throw Error('Truncated tar');
    if ([0, 48].includes(h[156])) { if (files.has(name)) throw Error('Duplicate archive path'); files.set(name, tar.subarray(start, start + n)); }
    p = start + Math.ceil(n / 512) * 512;
  }
  return files;
}
const args = process.argv.slice(2), mode = args.shift();
if (mode === '--check' && args.length === 0) {
  const manifest = JSON.parse(fs.readFileSync(path.join(TARGET, 'provenance.json')));
  for (const record of manifest.files) if (sha(fs.readFileSync(path.join(TARGET, record.path))) !== record.sha256) throw Error('Vendored source drift: ' + record.path);
  console.log(JSON.stringify({ result: 'PASS', files: manifest.files.length, source: 'pinned npm SSRI and local SHA256; not a remote signature audit' }));
} else if (mode === '--write' && (args.length === 0 || args.length === 2 && args[0] === '--review-dir')) {
  const review = args.length ? path.resolve(args[1]) : null, pending = [], archives = [], reviews = [];
  for (const pin of pins) {
    const url = `https://registry.npmjs.org/${pin.name}/-/${pin.name}-${pin.version}.tgz`, response = await fetch(url);
    if (!response.ok) throw Error(`${pin.name}: HTTP ${response.status}`);
    const chunks = []; let length = 0;
    for await (const chunk of response.body) { length += chunk.length; if (length > 2 * 1024 * 1024) throw Error('Archive exceeds 2 MiB'); chunks.push(chunk); }
    const archive = Buffer.concat(chunks);
    if ('sha512-' + createHash('sha512').update(archive).digest('base64') !== pin.integrity) throw Error('SSRI mismatch: ' + pin.name);
    const files = extract(archive), pkg = JSON.parse(files.get('package/package.json')?.toString() || 'null');
    if (pkg?.name !== pin.name || pkg.version !== pin.version || pkg.license !== pin.license) throw Error('Package identity/license drift: ' + pin.name);
    const notices = [...files].filter(([p]) => /^package\/(?:licen[cs]e|copying)(?:\.[^/]*)?$/i.test(p));
    if (notices.length !== 1) throw Error('Expected one canonical package license: ' + pin.name);
    for (const [source, dest] of [...Object.entries(pin.files), [notices[0][0], pin.notice]]) {
      const body = files.get(source); if (!body) throw Error('Missing allowed source: ' + source);
      pending.push({ path: dest, body, package: pin.name, version: pin.version, archivePath: source });
    }
    const readme = [...files].find(([p]) => /^package\/readme(?:\.md)?$/i.test(p));
    if (readme) reviews.push({ name: pin.name + '-README.md', body: readme[1] });
    archives.push({ name: pin.name, version: pin.version, registry: url, integrity: pin.integrity, archiveSha256: sha(archive), license: pin.license, archiveBytes: archive.length, upstreamScriptsNotRun: true });
  }
  // Validate all inputs first. Never overwrite a previous vendored generation.
  for (const record of pending) if (fs.existsSync(path.join(TARGET, record.path))) throw Error('Refusing overwrite: ' + record.path);
  if (fs.existsSync(path.join(TARGET, 'provenance.json'))) throw Error('Refusing provenance overwrite');
  for (const record of pending) { const dest = path.join(TARGET, record.path); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, record.body, { flag: 'wx' }); }
  const files = pending.map(({ body, ...record }) => ({ ...record, bytes: body.length, sha256: sha(body) }));
  const manifest = { schemaVersion: 1, purpose: 'Pinned standard Markdown parser and GitHub-style slugger; bundled parser includes mdurl/entities, with their notices retained', archives, files, npmInstallOrBuildScriptsExecuted: false };
  fs.writeFileSync(path.join(TARGET, 'provenance.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  if (review) { fs.mkdirSync(review, { recursive: true }); for (const r of reviews) fs.writeFileSync(path.join(review, r.name), r.body, { flag: 'wx' }); }
  console.log(JSON.stringify({ result: 'COPIED-NOT-EXECUTED', files: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0), manifest: path.join(TARGET, 'provenance.json'), reviewDirectory: review }, null, 2));
} else throw Error('Usage: --check | --write [--review-dir <new-directory>]');
