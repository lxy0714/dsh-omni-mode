// Offline, lossless cohort accounting. No model calls or transcript re-grading.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash = text => createHash('sha256').update(text).digest('hex');
const finished = arm => ['complete', 'needs-user'].includes(arm.status);
// Transport/provider faults say nothing about model behaviour. Counting them as arm
// failures would bias whichever arm happens to hit a flaky call, so they are excluded
// from outcome comparison and reported on their own line.
export const infrastructure = arm => arm.status === 'aborted' || arm.status === 'infrastructure-error';
const passed = arm => finished(arm) && arm.grade?.passed === true;
const critical = arm => finished(arm) && arm.grade?.criticalPassed === true;
const variants = ['baseline', 'candidate'];

export function summarizeReceipts(entries, {caseSetHash, candidatePolicyHash, routeFingerprint, cases}) {
  if (![caseSetHash, candidatePolicyHash, routeFingerprint].every(v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v))) throw Error('Exact cohort hashes required');
  const admitted = entries.filter(({receipt:r}) => r.scored === true && r.caseSetHash === caseSetHash && r.candidatePolicyHash === candidatePolicyHash && r.routeFingerprint === routeFingerprint);
  // Earliest attempt, including interruptions, is primary. Repeats are retained,
  // never silently substituted for a failure. Timestamp ties use the receipt ID.
  admitted.sort((a,b) => String(a.receipt.started).localeCompare(String(b.receipt.started)) || a.id.localeCompare(b.id));
  const ids = new Set(cases.map(c => c.id));
  const seen = new Set(), primary = [], attempts = [];
  for (const {id, sha256, receipt:r} of admitted) {
    if (!ids.has(r.caseId)) throw Error('Receipt contains a case outside the selected suite');
    if (!Number.isFinite(Date.parse(r.started))) throw Error('Receipt timestamp missing');
    const names = r.results.map(a => a.variant);
    if (new Set(names).size !== names.length || names.some(n => !variants.includes(n))) throw Error('Invalid arm identity');
    const row = {receipt:id, receiptSha256:sha256, caseId:r.caseId, category:r.category, started:r.started,
      status:r.status, errorCode:r.errorCode ?? null, toolsHash:r.toolsHash,
      graderHash:r.graderHash ?? null, driverHash:r.driverHash ?? null,
      arms:Object.fromEntries(r.results.map(a => [a.variant,{status:a.status,
        infrastructure:infrastructure(a),
        passed:passed(a), criticalPassed:critical(a), recordedScore:a.grade?.score ?? null,
        failedChecks:(a.grade?.checks ?? []).filter(c => !c.passed).map(c => c.id), modelCalls:a.modelCalls,
        durationMs:a.durationMs}]))};
    attempts.push(row);
    if (!seen.has(r.caseId)) {seen.add(r.caseId);primary.push(row);}
  }
  const count = rows => Object.fromEntries(variants.map(v => [v, {
    entered:rows.filter(r => r.arms[v]).length,
    finished:rows.filter(r => r.arms[v] && finished(r.arms[v])).length,
    passed:rows.filter(r => r.arms[v]?.passed).length,
    criticalPassed:rows.filter(r => r.arms[v]?.criticalPassed).length,
    incomplete:rows.filter(r => r.arms[v] && !finished(r.arms[v]) && !r.arms[v].infrastructure).length,
    infrastructure:rows.filter(r => r.arms[v]?.infrastructure).length,
    missing:rows.filter(r => !r.arms[v]).length,
  }]));
  // A pair is comparable only when both arms produced a model outcome. Critical
  // regressions are judged on every pair where both arms actually ran, including an arm
  // that exhausted its budget: otherwise a candidate that fails only by running out of
  // steps would silently escape the non-regression check it is meant to trip.
  const ran = primary.filter(r => variants.every(v => r.arms[v] && !r.arms[v].infrastructure));
  const paired = ran.filter(r => variants.every(v => finished(r.arms[v])));
  const discordant = paired.filter(r => r.arms.baseline.passed !== r.arms.candidate.passed);
  const categories = [...new Set(cases.map(c => c.category))].map(category => {
    const rows = primary.filter(r => r.category === category);
    return {category, expected:cases.filter(c => c.category === category).length, attempted:rows.length,
      ...count(rows), wins:rows.filter(r => r.arms.candidate?.passed && r.arms.baseline && !r.arms.baseline.passed).length,
      losses:rows.filter(r => r.arms.baseline?.passed && r.arms.candidate && !r.arms.candidate.passed).length};
  });
  const criticalRegressions = ran.filter(r => r.arms.baseline.criticalPassed && !r.arms.candidate.criticalPassed).map(r => r.caseId);
  const hashesComplete = admitted.every(({receipt:r}) => r.graderHash && r.driverHash);
  return {schemaVersion:1, kind:'exploratory-original-receipt-accounting',
    cohort:{caseSetHash,candidatePolicyHash,routeFingerprint}, selection:'first-attempt-including-errors; all repeats retained',
    expectedCases:cases.length, attemptedCases:primary.length, missingCases:cases.filter(c => !seen.has(c.id)).map(c => c.id),
    recordedAttempts:attempts.length, pairedPrimaryCases:paired.length, counts:count(primary), categories,
    discordantCases:discordant.map(r => ({caseId:r.caseId, baseline:r.arms.baseline.passed, candidate:r.arms.candidate.passed})),
    criticalRegressions, hashesComplete, acceptanceEstablished:false,
    limitations:{zh:['按收据原记录计分，不用当前评分器事后改分。','缺失、截断、步数耗尽与基础设施错误不视为成功；重复运行不替换首轮失败。','未预注册重复次数；部分历史收据缺少评分器/驱动哈希，不能作为确认性无退步或因果提升证明。','新增12题与判据修改发生在观察结果之后，只能作为探索性诊断；不能补足原40题的三类改善验收。'],en:['Uses the grades originally recorded in receipts, not post-hoc regrading.','Missing arms, truncation, step limits and infrastructure errors are not successes; repeats never replace primary failures.','Repeat counts were not preregistered; historical receipts lack some grader/driver hashes and cannot establish confirmatory non-regression or causal gains.','The 12 added cases and rubric changes followed observed outcomes; they are exploratory and cannot satisfy the original 40-case three-category acceptance.']}, primary, attempts};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), arg=(key,fallback) => {const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
  const dir=path.resolve(arg('receipts',path.join(root,'.verification/benchmark')));
  const raw=await fs.readFile(path.join(root,'benchmark/cases.json'),'utf8');
  const suite=JSON.parse(raw), entries=[];
  for(const id of (await fs.readdir(dir)).filter(f=>f.endsWith('.json')).sort()) {
    const text=await fs.readFile(path.join(dir,id),'utf8');
    entries.push({id,sha256:hash(text),receipt:JSON.parse(text)});
  }
  const summary=summarizeReceipts(entries,{caseSetHash:arg('cases-hash',hash(raw)),candidatePolicyHash:arg('policy-hash'),routeFingerprint:arg('route-hash'),cases:suite.cases});
  const output=arg('output');
  if(output)await fs.writeFile(output,JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({...summary,primary:undefined,attempts:undefined},null,2));
}
