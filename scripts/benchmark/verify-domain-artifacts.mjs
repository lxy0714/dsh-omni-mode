// Post-run artifact checks, NOT a frozen rubric or a model-success grader.
// 运行后产物核验，不计算模型通过率，也不执行未经审读的交付脚本。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const digest = p => sha(fs.readFileSync(p));
const walk = dir => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, {withFileTypes:true})
  .flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : e.isFile() ? [path.join(dir,e.name)] : []);
const checks = [];
const add = (id, predicate, observed, limit) => checks.push({id,
  status: predicate ? 'verified' : 'mismatch', observed, limitation: limit});
const env = {...process.env}; delete env.NODE_TEST_CONTEXT;
function command(executable, args, cwd, timeout=60000) {
  const r=spawnSync(executable,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024});
  return {executable,args,exitCode:r.status,signal:r.signal,error:r.error?.code??null,
    stdout:r.stdout??'',stderr:r.stderr??''};
}
function jsonCommand(executable,args,cwd,timeout) {
  const r=command(executable,args,cwd,timeout);
  let data=null; try { data=JSON.parse(r.stdout); } catch {}
  return {command:r,data};
}
function inventory(root) { return walk(root).sort().map(p=>({path:path.relative(root,p),
  bytes:fs.statSync(p).size,sha256:digest(p)})); }

export function verifyArtifacts({runRoot,recoveryRoot,snapshotRoot}) {
  checks.length=0;
  const cases=JSON.parse(fs.readFileSync(path.join(ROOT,'benchmark/domain-acceptance.json'),'utf8'));
  const run=path.resolve(runRoot),recovery=path.resolve(recoveryRoot),snap=path.resolve(snapshotRoot);
  for (const c of cases.scenarioTasks) {
    const source=path.join(ROOT,c.fixture),copied=path.join(run,c.id,'in');
    const expected=inventory(source),actual=inventory(copied);
    add(`${c.id}:input-integrity`,JSON.stringify(expected)===JSON.stringify(actual),
      {expectedFiles:expected.length,actualFiles:actual.length},'Byte identity only, not source truth.');
  }
  const snapshot=JSON.parse(fs.readFileSync(path.join(snap,'inventory.json'),'utf8'));
  const drift=snapshot.files.filter(f=>!fs.existsSync(path.join(snap,f.path))||digest(path.join(snap,f.path))!==f.sha256);
  add('snapshot:integrity',drift.length===0,{files:snapshot.files.length,drift},
    'This snapshot was captured late, not at each agent termination.');

  const delivered=path.join(run,'model-engineering/out/sum.mjs');
  // This small local module was read by the lead before this checker was written.
  const sumProbe=`import assert from 'node:assert/strict';
import {sum} from ${JSON.stringify(pathToFileURL(delivered).href)};
assert.equal(sum([]),0);assert.equal(sum([1,2.5]),3.5);
for(const v of ['2',NaN,Infinity,-Infinity,null,undefined,true,{},[],1n])
  assert.throws(()=>sum([1,v]),e=>e instanceof TypeError&&/invalid/.test(e.message));
assert.throws(()=>sum(null),TypeError);
console.log(JSON.stringify({checks:13,finiteSum:3.5}));`;
  const sum=jsonCommand(process.execPath,['--input-type=module','-e',sumProbe],run);
  add('engineering:delivered-behaviour',sum.command.exitCode===0&&sum.data?.checks===13,sum,
    'Independent explicit examples, not all possible JavaScript inputs.');

  const fastaPython=String.raw`import sys,json,collections
from pathlib import Path
r=[]
for name,canonical in [('sample-a.fasta','ACGT'),('sample-b.fasta','ACGU')]:
 records=[]; current=None
 for line in (Path(sys.argv[1])/name).read_text().splitlines():
  if line.startswith('>'):
   current=[line[1:].split()[0],''];records.append(current)
  elif line.strip():
   assert current is not None;current[1]+=line.strip().upper()
 for ident,seq in records:
  c=collections.Counter(seq);known=sum(c[b] for b in canonical);gc=c['G']+c['C']
  r.append({'id':ident,'length':len(seq),'ambiguous':len(seq)-known,'gcAll':gc/len(seq),'gcCanonical':gc/known if known else None})
print(json.dumps(r))`;
  const fasta=jsonCommand('python3',['-c',fastaPython,path.join(run,'model-molbio/in')],run);
  const expected=[['alpha',6,2,1/3,0.5],['beta',4,0,0.5,0.5],['gamma',6,0,1/3,1/3],['delta',4,0,0.5,0.5]];
  add('molbio:independent-fasta-statistics',fasta.command.exitCode===0&&expected.every((e,i)=>{
    const v=fasta.data?.[i]; return v&&v.id===e[0]&&v.length===e[1]&&v.ambiguous===e[2]&&Math.abs(v.gcAll-e[3])<1e-10&&Math.abs(v.gcCanonical-e[4])<1e-10;
  }),fasta,'Numbers independently recomputed; prose scope and scientific restraint require separate reading.');

  const icsPython=String.raw`import sys,json,re
from datetime import datetime
from zoneinfo import ZoneInfo
text=open(sys.argv[1],newline='').read();text=re.sub(r'\r?\n[ \t]','',text)
events=re.findall(r'BEGIN:VEVENT(.*?)END:VEVENT',text,re.S)
want=[('2030-05-01T09:00','2030-05-01T10:30'),('2030-05-01T13:00','2030-05-01T14:00'),('2030-05-02T08:00','2030-05-02T09:00')]
observed=[]
for event,(a,b) in zip(events,want):
 start=re.search(r'DTSTART:(\d{8}T\d{6}Z)',event).group(1);end=re.search(r'DTEND:(\d{8}T\d{6}Z)',event).group(1)
 expected=[datetime.fromisoformat(s).replace(tzinfo=ZoneInfo('Asia/Shanghai')).astimezone(ZoneInfo('UTC')).strftime('%Y%m%dT%H%M%SZ') for s in [a,b]]
 assert [start,end]==expected;observed.append([start,end])
assert len(events)==3
print(json.dumps({'events':len(events),'utcIntervals':observed}))`;
  const ics=jsonCommand('python3',['-c',icsPython,path.join(run,'model-assistant/out/calendar.ics')],run);
  add('assistant:utc-intervals',ics.command.exitCode===0&&ics.data?.events===3,ics,
    'Three events have six endpoints; no calendar import or invitation was performed.');

  const answer=fs.readFileSync(path.join(run,'model-personalization/out/answer.md'),'utf8');
  add('personalization:length-and-punctuation',[...answer].length<=120&&!/[!！]/.test(answer),
    {unicodeCodePoints:[...answer].length,exclamationMarks:(answer.match(/[!！]/g)||[]).length},
    'Style quality and factual wording need human reading; word count alone is not full acceptance.');

  const pptx=path.join(run,'model-documents/out/local-code-graphics.pptx');
  const pptxPython=String.raw`import sys,json,re,zipfile,xml.etree.ElementTree as ET
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 slides=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n).group(1)))
 titles=[]
 for name in slides:
  root=ET.fromstring(z.read(name));texts=[x.text or '' for x in root.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t')];titles.append(texts)
 print(json.dumps({'slides':len(slides),'crc':'ok','slideTexts':titles},ensure_ascii=False))`;
  const deck=jsonCommand('python3',['-c',pptxPython,pptx],run);
  add('documents:ooxml',deck.command.exitCode===0&&deck.data?.slides===8,deck,
    'CRC/XML and text only. PIL previews are not PowerPoint/LibreOffice rendering.');

  const media=path.join(run,'cross-code-media-audio/renders/media-final');
  for (const file of ['animation.mp4','animation.gif']) {
    const p=path.join(media,file);
    const probe=jsonCommand('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',p],run);
    const decode=command('ffmpeg',['-v','error','-i',p,'-f','null','-'],run,120000);
    const v=probe.data?.streams?.find(s=>s.codec_type==='video');
    add(`media:${file}:probe-and-decode`,probe.command.exitCode===0&&decode.exitCode===0&&v?.width===640&&v?.height===400&&Number(v?.nb_read_frames)===150&&Math.abs(Number(probe.data?.format?.duration)-6)<0.05,
      {probe,decode,audioStreams:probe.data?.streams?.filter(s=>s.codec_type==='audio').length},
      'Lead-assisted render, not independent first-attempt completion; original audio interaction failed to await a real answer.');
  }
  add('media:completion-marker',fs.existsSync(path.join(media,'.complete.json')),
    {marker:fs.existsSync(path.join(media,'.complete.json'))},'Marker is not authorization or artistic acceptance.');

  const chart=path.join(recovery,'cross-data-game-document/artifacts/corrected');
  const chartVerify=jsonCommand(process.execPath,[path.join(ROOT,'media/runner.mjs'),'validate','--artifact',chart],run,120000);
  add('recovery-chart:runner-validation',chartVerify.command.exitCode===0&&chartVerify.data?.status==='verified',chartVerify,
    'Separate corrected artifact; does not erase the first chart semantic defect.');

  return {schemaVersion:1,kind:'post-run-artifact-inspection',createdAt:new Date().toISOString(),
    verifierSha256:digest(fileURLToPath(import.meta.url)),caseSetSha256:digest(path.join(ROOT,'benchmark/domain-acceptance.json')),
    rubricSha256:digest(path.join(ROOT,'benchmark/domain-rubric.json')),
    warning:{zh:'事后工程核验，不是冻结模型评分；不报告模型通过率。',en:'Post-run engineering checks, not frozen model scoring; no model pass rate is reported.'},
    checks,artifacts:cases.scenarioTasks.map(c=>({id:c.id,files:inventory(path.join(run,c.id,'out'))}))};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const flags=new Map();
  for(let i=2;i<process.argv.length;i+=2) {
    const k=process.argv[i],v=process.argv[i+1];
    if(!['--run-root','--recovery-root','--snapshot-root','--out'].includes(k)||!v||flags.has(k))throw Error('Unknown/repeated/missing option');
    flags.set(k,v);
  }
  for(const k of ['--run-root','--recovery-root','--snapshot-root','--out'])if(!flags.has(k))throw Error(`Required: ${k}`);
  const receipt=verifyArtifacts({runRoot:flags.get('--run-root'),recoveryRoot:flags.get('--recovery-root'),snapshotRoot:flags.get('--snapshot-root')});
  fs.writeFileSync(path.resolve(flags.get('--out')),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  const mismatch=receipt.checks.filter(c=>c.status!=='verified');
  console.log(JSON.stringify({receipt:flags.get('--out'),artifactChecks:receipt.checks.length,mismatches:mismatch.map(c=>c.id),modelPassRate:null}));
  if(mismatch.length)process.exitCode=1;
}
