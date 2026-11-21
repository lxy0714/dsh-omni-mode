// A separate public-interface version; original tasks and historical grades stay frozen.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha = text => createHash('sha256').update(text).digest('hex');
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function bilingual(value, label) {
  if (!record(value) || Object.keys(value).some(k => !['zh', 'en'].includes(k)) || ['zh', 'en'].some(k => typeof value[k] !== 'string' || !value[k].trim() || value[k].length > 24000)) throw Error(`Invalid bilingual ${label}`);
}

export function makeContractSuite(sourceText, contractText) {
  const source = JSON.parse(sourceText), manifest = JSON.parse(contractText);
  if (!record(source) || !Array.isArray(source.cases) || !source.cases.length) throw Error('Missing source cases');
  if (!record(manifest) || manifest.schemaVersion !== 1 || manifest.id !== 'original40-explicit-contract-v2' || Object.keys(manifest).some(k => !['schemaVersion', 'id', 'common', 'cases'].includes(k))) throw Error('Invalid public-contract manifest');
  bilingual(manifest.common, 'common contract');
  if (!Array.isArray(manifest.cases)) throw Error('Missing case contracts');
  const ids = source.cases.map(c => c.id);
  if (ids.some(id => typeof id !== 'string' || !/^[a-z][a-z0-9-]+$/.test(id)) || new Set(ids).size !== ids.length) throw Error('Invalid source case identities');
  const contracts = new Map();
  for (const item of manifest.cases) {
    if (!record(item) || Object.keys(item).some(k => !['id', 'contract'].includes(k)) || !ids.includes(item.id) || contracts.has(item.id)) throw Error('Unknown or repeated case contract');
    bilingual(item.contract, item.id);
    contracts.set(item.id, item.contract);
  }
  if (contracts.size !== ids.length) throw Error('Every original identity needs exactly one public contract');
  const suite = {
    ...structuredClone(source),
    id: manifest.id,
    protocol: {
      kind: 'separate-public-interface-experiment',
      sourceCaseSetHash: sha(sourceText),
      publicContractHash: sha(contractText),
      historicalResultsChanged: false,
      factualAnswersRemainPrivate: true,
      outcomeGraderUnchanged: true,
    },
    cases: source.cases.map(testCase => {
      bilingual(testCase.prompt, `${testCase.id} source prompt`);
      const publicContract = contracts.get(testCase.id);
      return {
        ...structuredClone(testCase),
        prompt: Object.fromEntries(['zh', 'en'].map(language => [language,
          testCase.prompt[language] + '\n\n' +
          (language === 'zh' ? '公开接口契约（双方相同，不是事实答案）：\n' : 'Public interface contract (identical for both arms; not factual answers):\n') +
          manifest.common[language] + '\n\n' + publicContract[language],
        ])),
      };
    }),
  };
  return {suite, text: JSON.stringify(suite, null, 2) + '\n', promptBytes: suite.cases.map((c, i) => ({
    caseId: c.id,
    beforeZh: Buffer.byteLength(source.cases[i].prompt.zh),
    afterZh: Buffer.byteLength(c.prompt.zh),
    beforeEn: Buffer.byteLength(source.cases[i].prompt.en),
    afterEn: Buffer.byteLength(c.prompt.en),
  }))};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--check', '--write'].includes(args[0])) throw Error('Use --check or --write; writing creates a new version and never overwrites it');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const sourceText = fs.readFileSync(path.join(root, 'benchmark/cases-v1.json'), 'utf8');
  if (sha(sourceText) !== 'd4b960440eadf1bdb6c867c564a2e0633d2df2f0bd73a4bfd89e413cfe19bca5') throw Error('The untouched original40 source no longer matches its historical freeze');
  const contractText = fs.readFileSync(path.join(root, 'benchmark/contracts-v2.json'), 'utf8');
  const built = makeContractSuite(sourceText, contractText);
  if (built.suite.cases.length !== 40) throw Error('Expected all original40 identities');
  const output = path.join(root, 'benchmark/cases-v2.json');
  if (args[0] === '--write') fs.writeFileSync(output, built.text, {flag: 'wx'});
  else if (fs.existsSync(output) && fs.readFileSync(output, 'utf8') !== built.text) throw Error('The generated public-interface version has drifted');
  console.log(JSON.stringify({kind: built.suite.protocol.kind, id: built.suite.id, cases: built.suite.cases.length,
    sourceCaseSetHash: sha(sourceText), publicContractHash: sha(contractText), caseSetHash: sha(built.text),
    originalSourceChanged: false, written: args[0] === '--write', promptBytes: built.promptBytes}, null, 2));
}
