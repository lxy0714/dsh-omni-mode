// Paths relative to capabilities/. Keep copied-package tests and doctor hashes
// aligned with the actual runtime, including deferred trusted parser sources.
export const RUNTIME_FILES = Object.freeze([
  'schema.mjs', 'operations.mjs', 'runner.mjs', 'runtime-files.mjs', 'catalog.json',
  'game-idle.mjs', 'engineering-impact.mjs', 'documents-audit.mjs',
  'engineering-delivery.mjs', 'game-build-check.mjs', 'style-draft.mjs', 'research-quotes.mjs', 'fiction-threads.mjs',
  'documents-audit-core.mjs', 'documents-audit-worker.mjs',
  'vendor/commonmark-0.31.2.cjs', 'vendor/commonmark-LICENSE.txt',
  'vendor/github-slugger-2.0.0/index.js', 'vendor/github-slugger-2.0.0/regex.js',
  'vendor/github-slugger-2.0.0/LICENSE.txt', 'vendor/mdurl-LICENSE.txt',
  'vendor/entities-LICENSE.txt', 'vendor/provenance.json'
]);
export const CONTRACT_TEST_FILES = Object.freeze([
  'operations.test.mjs', 'runner.test.mjs', 'catalog.test.mjs',
  'game-idle.test.mjs', 'engineering-impact.test.mjs', 'documents-audit.test.mjs',
  'engineering-delivery.test.mjs', 'game-build-check.test.mjs', 'style-draft.test.mjs', 'research-quotes.test.mjs', 'fiction-threads.test.mjs'
]);
