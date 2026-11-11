// Materialize only a named, already-hashed research file into the research cache.
// This is static source DATA, never a package installation or executable module import.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readTarGz,sha256} from './parsers.mjs';
// External cache is caller-supplied so no author machine path is baked into the repo.
const CACHE=path.resolve(process.env.OMNI_RESEARCH_CACHE??path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),'.research-cache','omni-upgrade'));
const [name,...paths]=process.argv.slice(2);
if(!name || !paths.length)throw new Error('Usage: node inspect-file.mjs package file [file...]');
let result;
for(const f of await fs.readdir(CACHE)){if(!/^result-.*\.json$/.test(f))continue;const r=JSON.parse(await fs.readFile(path.join(CACHE,f),'utf8'));if(r.package===name)result=r;}
if(!result?.distribution?.tarball || !result.distribution.integrityVerified)throw new Error('No integrity-verified cached archive');
const archive=await fs.readFile(path.join(CACHE,sha256(result.distribution.tarball)+'.bin'));
if(sha256(archive)!==result.distribution.tarballSha256)throw new Error('Archive SHA mismatch');
const files=readTarGz(archive);
for(const filename of paths){if(filename.startsWith('/')||filename.split('/').includes('..')||filename.includes('\\'))throw new Error('Unsafe file');const b=files.get(filename);if(!b || b.length>2*1024*1024)throw new Error('Missing/oversized requested file '+filename);const out=path.join(CACHE,'inspection',sha256(name).slice(0,16),filename);await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,b);console.log(out);}
