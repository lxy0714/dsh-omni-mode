import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { claimPrimaryArm, inspectPrimaryArm, journaledStream } from './primary-journal.mjs';
const freeze = 'f'.repeat(64), variant = 'candidate', id = 'debug-01';
const result = modelCalls => ({ variant, status: 'complete', modelCalls });
function directory(t) {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'om-j-'));
  t.after(() => fs.rmSync(temp, { recursive: true })); // temp created by this test
  return temp;
}
const inspect = root => inspectPrimaryArm(root,id,variant,freeze);
const claim = root => claimPrimaryArm(root,id,variant,freeze);
const child = (root, steps) => spawnSync(process.execPath,
  ['--input-type=module','-e',`import {claimPrimaryArm} from ${JSON.stringify(new URL('./primary-journal.mjs',import.meta.url).href)}; const a=claimPrimaryArm(process.argv[1],${JSON.stringify(id)},${JSON.stringify(variant)},${JSON.stringify(freeze)}); ${steps}`,root],
  { encoding:'utf8', timeout:5000 });

test('transport sees durable intent before dispatch and completed calls match receipt count', async t => {
  const root = directory(t); assert.equal(inspect(root).state, 'unstarted');
  const a = claim(root); let dispatches = 0;
  const wrap = journaledStream(async function* () {
    ++dispatches;
    const pathAtCall=path.join(root,`${id}.${variant}`,`0${dispatches}.call-intent.json`);
    assert.deepEqual(JSON.parse(fs.readFileSync(pathAtCall)), { call: dispatches });
    yield { type:'finish', reason:{ kind:dispatches===1?'tool-calls':'stop' } };
  }, a);
  for (const _ of [1,2]) for await (const chunk of wrap({})) assert.equal(chunk.type,'finish');
  assert.throws(() => a.recordArm(result(1)), /invalid arm receipt/);
  const hash = a.recordArm(result(2));
  assert.deepEqual(inspect(root), { state:'recorded', calls:['tool-calls','stop'], result:result(2), resultSha256:hash });
  assert.throws(() => claim(root), { code:'EEXIST' });
  assert.throws(() => a.beginCall(), /cannot begin/);
});
test('process exit during call leaves unknown primary; no second process can claim it', t => {
  const root = directory(t);
  const first = child(root, 'a.beginCall(); process.exit(19);');
  assert.equal(first.status,19,first.stderr);
  assert.equal(inspect(root).state,'unknown');
  const second = child(root, 'process.exit(0);');
  assert.equal(second.status,1); assert.match(second.stderr,/EEXIST/);
});
test('a finished call before an arm receipt is still unknown after process exit', t => {
  const root = directory(t);
  const first = child(root, "a.beginCall()('stop'); process.exit(17);");
  assert.equal(first.status,17); assert.equal(inspect(root).state,'unknown');
  assert.throws(() => claim(root), { code:'EEXIST' });
});
test('reservation without its intent is conservatively unknown', t => {
  const root = directory(t); fs.mkdirSync(path.join(root,`${id}.${variant}`));
  assert.equal(inspect(root).state,'unknown'); assert.throws(() => claim(root), { code:'EEXIST' });
});
test('transport throw, stream omission and consumer cancellation cannot look successful', async t => {
  const scenarios = [
    [async function* () {throw new Error('test throw');}, 'interrupted'],
    [async function* () {yield {type:'token'};}, 'missing-finish'],
    [async function* () { yield {type:'token'}; yield {type:'finish',reason:{kind:'stop'}};}, 'interrupted']
  ];
  for (let i=0;i<scenarios.length;i++) {
    const root=directory(t), a=claim(root), [transport,kind]=scenarios[i];
    const iter=journaledStream(transport,a)({});
    if(i===0) await assert.rejects(iter.next(), /test throw/);
    else if(i===1) { for await (const _ of iter) {} }
    else { await iter.next(); await iter.return(); }
    assert.throws(() => a.beginCall(), /cannot begin/);
    a.recordArm({...result(1),status:'infrastructure-error'});
    assert.deepEqual(inspect(root).calls,[kind]);
  }
});
test('bounded calls, no duplicate terminals and no bypass after a terminal failure', t => {
  const root=directory(t), a=claim(root);
  for(let n=1;n<=24;n++) {
    const finish=a.beginCall(); assert.throws(() => a.beginCall()); finish('tool-calls'); assert.throws(() => finish('stop'));
  }
  assert.throws(() => a.beginCall()); a.recordArm({...result(24),status:'step-limit'});
  assert.equal(inspect(root).calls.length,24);
});
test('wrong freeze, altered bytes, or extra records cannot be credited', t => {
  const root=directory(t), a=claim(root);
  a.beginCall()('stop'); a.recordArm(result(1));
  const resultFile=path.join(root,`${id}.${variant}`,'arm-result.json');
  assert.equal(inspectPrimaryArm(root,id,variant,'d'.repeat(64)).state,'unknown');
  fs.appendFileSync(resultFile,' '); assert.equal(inspect(root).state,'unknown');
  assert.throws(() => claimPrimaryArm(root,'../other',variant,freeze), /unknown journal arm/);
});
