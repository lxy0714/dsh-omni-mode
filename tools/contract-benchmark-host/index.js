// Development-only Host controller. Reuses the untouched historical runArm.
import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import YAML from 'yaml';
import {runArm} from './core.mjs';
import {makeContractSuite} from '../../scripts/benchmark/contract-suite.mjs';
import {makeControlledCore} from '../../scripts/benchmark/extract-controlled-core.mjs';
import {simulationSignals} from '../../scripts/benchmark/replay-receipts.mjs';

export const name = 'omni-contract-benchmark';
export const inject = ['llm', 'tools'];
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const strip = value => value.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trim();
const complete = arm => ['complete', 'needs-user'].includes(arm.status);
const infrastructure = arm => ['aborted', 'infrastructure-error'].includes(arm.status);
export const SNAPSHOT_PATHS = Object.freeze(['benchmark/cases-v1.json', 'benchmark/cases-v2.json', 'benchmark/contracts-v2.json',
  'benchmark/contract-v2-protocol.json', 'cordis.patch.yml', 'tools/benchmark-host/baseline.json',
  'tools/benchmark-host/index.js', 'tools/contract-benchmark-host/index.js', 'scripts/benchmark/grader.mjs',
  'tools/contract-benchmark-host/core.mjs', 'scripts/benchmark/extract-controlled-core.mjs',
  'scripts/benchmark/contract-suite.mjs', 'scripts/benchmark/replay-receipts.mjs',
  'skills/grilling/SKILL.md', 'skills/omni-method/SKILL.md']);
const loadedDriverHash = sha(readFileSync(fileURLToPath(import.meta.url)));
const loadedCoreHash = sha(readFileSync(new URL('./core.mjs', import.meta.url)));
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
const code = error => /^[A-Za-z0-9_:/-]{1,100}$/.test(String(error?.code ?? error?.name ?? 'EVALUATOR_ERROR')) ? String(error?.code ?? error?.name ?? 'EVALUATOR_ERROR') : 'EVALUATOR_ERROR';
function persona(raw) {
  const doc = YAML.parseDocument(raw, {customTags: [{tag: 'tag:yaml.org,2002:js', resolve: value => ({opaque: value})}]});
  if (doc.errors.length) throw Error('Invalid candidate composition');
  const value = doc.toJS()[0].insert[0].config.plugins.find(item => item.id === 'persona').config.prefix;
  if (typeof value !== 'string' || !value.trim()) throw Error('Missing candidate persona');
  return value;
}
function armPayload(texts) {
  const baseline = JSON.parse(texts['tools/benchmark-host/baseline.json']);
  return {baseline, arms: {
    baseline: {prompt: baseline.persona, skills: {grilling: strip(baseline.grilling)}},
    candidate: {prompt: persona(texts['cordis.patch.yml']), skills: {
      grilling: strip(texts['skills/grilling/SKILL.md']), 'omni-method': strip(texts['skills/omni-method/SKILL.md']),
    }},
  }};
}

export function createController(ctx, {root = projectRoot, expectedCases = 40,
  expectedOriginalHash = 'd4b960440eadf1bdb6c867c564a2e0633d2df2f0bd73a4bfd89e413cfe19bca5'} = {}) {
  const outputRoot = path.join(root, '.verification', 'contract-benchmark');
  let running = false;
  async function sources() {
    const texts = Object.fromEntries(await Promise.all(SNAPSHOT_PATHS.map(async p => [p, await fs.readFile(path.join(root, p), 'utf8')])));
    if (sha(texts['benchmark/cases-v1.json']) !== expectedOriginalHash) throw Error('Original task source no longer matches its accepted historical freeze');
    if (sha(texts['tools/contract-benchmark-host/index.js']) !== loadedDriverHash || sha(texts['tools/contract-benchmark-host/core.mjs']) !== loadedCoreHash) throw Error('Loaded driver generation does not match disk; reload before freezing');
    if (makeControlledCore(texts['tools/benchmark-host/index.js']) !== texts['tools/contract-benchmark-host/core.mjs']) throw Error('Execution core differs from the trusted historical source');
    const built = makeContractSuite(texts['benchmark/cases-v1.json'], texts['benchmark/contracts-v2.json']);
    if (built.text !== texts['benchmark/cases-v2.json']) throw Error('Public-contract suite does not match its immutable source and manifest');
    const protocol = JSON.parse(texts['benchmark/contract-v2-protocol.json']);
    if (protocol.id !== built.suite.id || protocol.expectedCases !== expectedCases || protocol.expectedCases !== built.suite.cases.length || protocol.maxModelCallsPerArm !== 24) throw Error('Protocol/suite mismatch');
    return {texts, built, protocol, hashes: Object.fromEntries(Object.entries(texts).map(([p, text]) => [p, sha(text)]))};
  }
  const location = id => { if (!uuid(id)) throw Error('Exact experiment UUID required'); return path.join(outputRoot, id); };
  async function freeze(exec) {
    if (!exec.agent) throw Error('An initiating Agent is required');
    const selected = structuredClone(exec.agent.model.current());
    const route = await ctx.llm.resolveCallConfig({...selected}, exec.signal);
    const data = await sources();
    const {baseline, arms} = armPayload(data.texts);
    const experimentId = crypto.randomUUID(), directory = location(experimentId);
    const descriptor = {
      schemaVersion: 1, experimentId, protocolId: data.protocol.id, frozenAt: new Date().toISOString(),
      baseline: baseline.version, baselineCommit: baseline.commit, expectedCases: data.built.suite.cases.length,
      caseSetHash: data.hashes['benchmark/cases-v2.json'], sourceCaseSetHash: data.hashes['benchmark/cases-v1.json'],
      publicContractHash: data.hashes['benchmark/contracts-v2.json'], protocolHash: data.hashes['benchmark/contract-v2-protocol.json'],
      graderHash: data.hashes['scripts/benchmark/grader.mjs'], driverHash: data.hashes['tools/contract-benchmark-host/index.js'],
      coreDriverHash: data.hashes['tools/benchmark-host/index.js'],
      candidatePolicyHash: sha(arms.candidate.prompt), baselinePolicyHash: sha(arms.baseline.prompt),
      routeFingerprint: sha(JSON.stringify(route)), selectedFingerprint: sha(JSON.stringify(selected)),
      routeIdentity: {provider: route.provider, model: route.model, ...(route.reasoningEffort === undefined ? {} : {reasoningEffort: route.reasoningEffort})},
      skillHashes: Object.fromEntries(Object.entries(arms).map(([v, arm]) => [v, Object.fromEntries(Object.entries(arm.skills).map(([n, text]) => [n, sha(text)]))])),
      sourceHashes: data.hashes, node: process.version, platform: process.platform, arch: process.arch,
      language: 'zh', driver: 'real configured LLM / controlled virtual tools; not the native Agent executor',
      promptBytes: data.built.promptBytes, historicalResultsChanged: false,
    };
    await fs.mkdir(outputRoot, {recursive: true}); await fs.mkdir(directory);
    await fs.writeFile(path.join(directory, 'sources.json'), JSON.stringify(data.texts, null, 2) + '\n', {flag: 'wx'});
    await fs.writeFile(path.join(directory, 'frozen.json'), JSON.stringify({descriptor, route, arms, protocol: data.protocol}, null, 2) + '\n', {flag: 'wx'});
    await fs.mkdir(path.join(directory, 'receipts')); await fs.mkdir(path.join(directory, 'pilot'));
    return descriptor;
  }
  async function load(id, exec) {
    if (!exec.agent) throw Error('An initiating Agent is required');
    const directory = location(id);
    const frozen = JSON.parse(await fs.readFile(path.join(directory, 'frozen.json'), 'utf8'));
    const data = await sources();
    if (JSON.stringify(data.hashes) !== JSON.stringify(frozen.descriptor.sourceHashes)) throw Error('Frozen source drift: create a new experiment, never mix revisions');
    const saved = JSON.parse(await fs.readFile(path.join(directory, 'sources.json'), 'utf8'));
    const savedHashes = Object.fromEntries(Object.entries(saved).map(([p, text]) => [p, sha(text)]));
    if (JSON.stringify(savedHashes) !== JSON.stringify(data.hashes)) throw Error('Frozen source snapshot is corrupt');
    if (JSON.stringify(armPayload(data.texts).arms) !== JSON.stringify(frozen.arms) || JSON.stringify(data.protocol) !== JSON.stringify(frozen.protocol)) throw Error('Frozen policy, skill or protocol payload mismatch');
    for (const [key, source] of Object.entries({caseSetHash: 'benchmark/cases-v2.json', sourceCaseSetHash: 'benchmark/cases-v1.json',
      publicContractHash: 'benchmark/contracts-v2.json', protocolHash: 'benchmark/contract-v2-protocol.json', graderHash: 'scripts/benchmark/grader.mjs',
      driverHash: 'tools/contract-benchmark-host/index.js', coreDriverHash: 'tools/benchmark-host/index.js'})) {
      if (frozen.descriptor[key] !== data.hashes[source]) throw Error('Frozen descriptor/source hash mismatch');
    }
    if (frozen.descriptor.experimentId !== id || frozen.descriptor.candidatePolicyHash !== sha(frozen.arms.candidate.prompt) || frozen.descriptor.baselinePolicyHash !== sha(frozen.arms.baseline.prompt)) throw Error('Frozen descriptor identity mismatch');
    if (sha(JSON.stringify(frozen.route)) !== frozen.descriptor.routeFingerprint) throw Error('Frozen route payload mismatch');
    if (sha(JSON.stringify(exec.agent.model.current())) !== frozen.descriptor.selectedFingerprint) throw Error('User model selection changed; no override performed');
    const route = await ctx.llm.resolveCallConfig({...exec.agent.model.current()}, exec.signal);
    if (sha(JSON.stringify(route)) !== frozen.descriptor.routeFingerprint) throw Error('Resolved model route changed');
    return {...frozen, directory, data};
  }
  async function records(directory) {
    const names = (await fs.readdir(path.join(directory, 'receipts'))).filter(n => n.endsWith('.json')).sort();
    return Promise.all(names.map(async n => JSON.parse(await fs.readFile(path.join(directory, 'receipts', n), 'utf8'))));
  }
  async function execute(args, exec) {
    if (!args || Object.keys(args).some(k => !['mode', 'experimentId', 'caseId', 'offset', 'limit'].includes(k)) || !['status', 'freeze', 'pilot', 'pair', 'sweep', 'recover'].includes(args.mode)) throw Error('Invalid controlled-evaluation arguments');
    if (running && args.mode !== 'status') throw Error('An experiment operation is already running');
    if (args.mode === 'status') {
      if (args.experimentId) {
        const frozen = await load(args.experimentId, exec); const receipts = await records(frozen.directory);
        return {running, ...frozen.descriptor, recordedReceipts: receipts.length,
          cases: frozen.data.built.suite.cases.map(c => ({id: c.id, attempts: receipts.filter(r => r.caseId === c.id).map(r => ({kind: r.attemptKind, status: r.status}))}))};
      }
      const data = await sources();
      return {running, protocolId: data.protocol.id, cases: data.built.suite.cases.map(c => c.id), caseSetHash: data.hashes['benchmark/cases-v2.json'], historicalResultsChanged: false};
    }
    if (args.mode === 'freeze') {
      if (Object.keys(args).some(k => k !== 'mode')) throw Error('Freeze takes no caller-supplied identities or hashes');
      running = true; try { return await freeze(exec); } finally { running = false; }
    }
    running = true;
    try {
      const frozen = await load(args.experimentId, exec), cases = frozen.data.built.suite.cases;
      const offset = args.offset ?? 0, limit = args.limit ?? 5;
      if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 8) throw Error('Integer offset >= 0 and limit 1..8 required');
      const pilot = {id: 'unscored-public-contract-wiring', category: 'unscored-pilot', prompt: {zh: '不计分接线检查：只调用一次fixture_capabilities，然后回复接线完成；不要读写文件或提问。'}, files: {}, sources: [], userAnswers: [], tools: cases[0].tools, expected: {rules: [], critical: ['capability-discovery'], process: {writePaths: [], noWrite: true, requireCapabilities: true, questions: {min: 0, max: 0}}}};
      const chosen = args.mode === 'pilot' ? [pilot] : args.mode === 'sweep' ? cases.slice(offset, offset + limit) : cases.filter(c => c.id === args.caseId);
      if (!chosen.length) throw Error('No matching frozen case');
      const previous = await records(frozen.directory);
      for (const c of chosen) {
        const old = previous.filter(r => r.caseId === c.id);
        if (args.mode === 'pilot') continue;
        if (args.mode === 'recover') {
          if (old.length !== 1 || old[0].status !== 'infrastructure-error' || !old[0].results.some(infrastructure)) throw Error('Only one explicitly separate recovery of an infrastructure failure is preregistered');
        } else if (old.length) throw Error('Case already attempted: no behavioral retries or primary replacement');
      }
      const signal = AbortSignal.any([exec.signal, AbortSignal.timeout(args.mode === 'sweep' ? 3300000 : 900000)]);
      const grader = await import(pathToFileURL(path.join(root, 'scripts/benchmark/grader.mjs')).href + '?v=' + frozen.descriptor.graderHash);
      const summaries = [];
      for (const c of chosen) {
        signal.throwIfAborted();
        if (sha(JSON.stringify(exec.agent.model.current())) !== frozen.descriptor.selectedFingerprint) throw Error('User changed model selection; remaining work stopped');
        const order = parseInt(sha(c.id).slice(0, 2), 16) % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate'];
        const results = [], requests = []; let errorCode = null;
        const started = new Date().toISOString();
        for (const variant of order) {
          let first = true;
          const wrapped = {llm: {stream: async function* (options) {
            const request = {variant, systemHash: sha(options.system), firstUserMessageHash: sha(JSON.stringify(options.messages[0])),
              toolsHash: sha(JSON.stringify(options.tools)), initial: first,
              promptUtf8Bytes: Buffer.byteLength(options.system + JSON.stringify(options.messages) + JSON.stringify(options.tools))};
            first = false; requests.push(request);
            for await (const chunk of ctx.llm.stream(options)) {
              if (request.initial && chunk.usage) request.usage = Object.fromEntries(Object.entries(chunk.usage).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)));
              yield chunk;
            }
          }}};
          const arm = frozen.arms[variant];
          const result = await runArm(wrapped, c, variant, arm.prompt.replaceAll('{{model}}', frozen.route.model), arm.skills, frozen.route, signal, grader);
          result.diagnosticSignals = simulationSignals(c, result); results.push(result);
          if (result.errorCode) { errorCode = result.errorCode; break; }
        }
        const tools = new Set(requests.map(r => r.toolsHash)), userMessages = new Set(requests.map(r => r.firstUserMessageHash));
        if (tools.size > 1 || userMessages.size > 1) errorCode = 'ASYMMETRIC_PUBLIC_REQUEST';
        const status = errorCode ? 'infrastructure-error' : results.length === 2 && results.every(complete) ? 'complete' : 'incomplete';
        // Descriptor and receipt envelopes are independently versioned.
        // Keep this override after the spread; old frozen receipts remain intact.
        const receipt = {...frozen.descriptor, schemaVersion: 2, status, errorCode, started, scored: args.mode !== 'pilot',
          caseId: c.id, category: c.category, caseHash: sha(JSON.stringify(c)), toolsHash: requests[0]?.toolsHash ?? null,
          attemptKind: args.mode === 'recover' ? 'infrastructure-recovery' : args.mode === 'pilot' ? 'unscored-pilot' : 'primary',
          maxModelCalls: 24, order, requests, results};
        const filename = c.id + '-' + crypto.randomUUID() + '.json';
        const destination = path.join(frozen.directory, args.mode === 'pilot' ? 'pilot' : 'receipts', filename);
        await fs.writeFile(destination, JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
        summaries.push({caseId: c.id, status, errorCode, attemptKind: receipt.attemptKind, receipt: path.relative(root, destination),
          results: results.map(r => ({variant: r.variant, status: r.status, passed: r.grade.passed, criticalPassed: r.grade.criticalPassed,
            failed: r.grade.checks.filter(check => !check.passed).map(check => check.id), diagnosticSignals: r.diagnosticSignals, modelCalls: r.modelCalls, durationMs: r.durationMs}))});
        if (errorCode) break;
      }
      return {experimentId: args.experimentId, caseSetHash: frozen.descriptor.caseSetHash, routeIdentity: frozen.descriptor.routeIdentity,
        count: summaries.length, ...(args.mode === 'sweep' ? {nextOffset: offset + summaries.length} : {}), cases: summaries};
    } catch (error) { throw Object.assign(Error(error?.message ?? 'Controlled evaluation failed'), {code: code(error)}); }
    finally { running = false; }
  }
  return {execute};
}

export function apply(ctx) {
  const controller = createController(ctx);
  // ToolDefinition is the inspected public registry contract; no SDK module copy.
  return ctx.tools.register({
    name: 'omni_contract_benchmark',
    description: '开发评测：先freeze，再按冻结ID执行同路由公开契约对照；只给被测模型虚拟工具，不改旧成绩或用户预设。 / Development comparison: freeze first, then run same-route public-contract pairs with virtual tools, without changing old scores or the preset.',
    parameters: {type: 'object', required: ['mode'], additionalProperties: false, properties: {
      mode: {type: 'string', enum: ['status', 'freeze', 'pilot', 'pair', 'sweep', 'recover'], description: 'status查看；freeze独立冻结；pilot不计分接线；pair单题；sweep批量；recover仅单列基础设施恢复。 / status, freeze, pilot, pair, sweep or recover.'},
      experimentId: {type: 'string', description: '除无ID的status或freeze外必填，使用freeze返回的精确UUID。 / Exact UUID returned by freeze, required for execution.'},
      caseId: {type: 'string', description: 'pair/recover使用status列出的精确题ID。 / Exact case ID for pair/recover.'},
      offset: {type: 'integer', description: 'sweep起点，非负整数，默认0。 / Nonnegative sweep start, default 0.'},
      limit: {type: 'integer', description: 'sweep题数1至8，默认5。 / Sweep size 1..8, default 5.'},
    }},
    timeoutMs: 3600000,
    output: {schema: {type: 'object', additionalProperties: true}, render: (_args, value) => [{type: 'text', text: JSON.stringify(value)}]},
    execute: (args, exec) => controller.execute(args, exec),
  });
}
