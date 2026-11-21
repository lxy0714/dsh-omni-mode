// Opt-in development bootstrap. Reuse an explicitly selected installed runtime
// for tests without reinstalling its dependency tree or changing the profile.
// This file is excluded from the published runtime package.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire, registerHooks} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const base = process.env.DSH_TEST_BASE;
if (!base || !path.isAbsolute(base) || path.basename(base) !== 'package.json') throw Error('Set DSH_TEST_BASE to an existing absolute Harness package.json');
const manifest = JSON.parse(fs.readFileSync(base, 'utf8'));
if (manifest.name !== '@deepseek-ai/dsh') throw Error('DSH_TEST_BASE must identify the actual Harness package');
const installed = createRequire(base);
const borrowed = new Map(['yaml', '@deepseek-ai/dsh-tools'].map(name => [name, pathToFileURL(installed.resolve(name)).href]));
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND' || !borrowed.has(specifier) || !context.parentURL?.startsWith('file:')) throw error;
      if (!fileURLToPath(context.parentURL).startsWith(project)) throw error;
      return {url: borrowed.get(specifier), shortCircuit: true};
    }
  },
});
