// Real DSH kernel, full preset composition and JSONL persistence. Inference is
// deliberately a local mock adapter: this test never reads active credentials.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { testRuntimeRequire, linkRuntimePackages } from './scripts/test-runtime.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const source = process.env.DSH_TEST_PACKAGE_DIR ? path.resolve(process.env.DSH_TEST_PACKAGE_DIR) : path.dirname(fileURLToPath(import.meta.url));
const host = testRuntimeRequire();
const load = async name => import(pathToFileURL(host.resolve(name)));
const [phase, run] = process.argv.slice(2);

if (!phase) {
  const runs = path.join(source, '.verification');
  fs.mkdirSync(runs, {recursive:true});
  const dir = fs.mkdtempSync(path.join(runs, 'run-'));
  linkRuntimePackages(host,dir);
  const packageName=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8')).name;
  const installedPath=path.join(dir,'node_modules',...packageName.split('/'));
  fs.mkdirSync(path.dirname(installedPath),{recursive:true});
  fs.symlinkSync(source,installedPath,process.platform==='win32'?'junction':'dir');
  fs.writeFileSync(path.join(dir,'cordis.yml'),'[]\n');
  const reports=[];
  for(const step of ['create','resume']) {
    const child=spawnSync(process.execPath,[fileURLToPath(import.meta.url),step,dir],{
      cwd:dir,env:{...process.env,DSH_HOME:path.join(dir,'home'),DSH_TEST_BASE:host.resolve('@deepseek-ai/dsh/package.json')},
      encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,
    });
    fs.writeFileSync(path.join(dir,`${step}.stdout.log`),child.stdout??'');
    fs.writeFileSync(path.join(dir,`${step}.stderr.log`),child.stderr??'');
    if(child.status!==0) {
      console.error((child.stdout??'').slice(-16000));console.error((child.stderr??'').slice(-16000));
      throw new Error(`${step} worker failed: status=${child.status}, signal=${child.signal}, artifacts=${dir}`);
    }
    reports.push(JSON.parse(fs.readFileSync(path.join(dir,`${step}.json`),'utf8')));
  }
  assert.notEqual(reports[0].pid,reports[1].pid);
  assert(reports[1].eventCount>reports[0].eventCount);
  const result={layer:'real-dsh-full-preset-mock-inference',result:'PASS',dsh:'0.2.2-rc.1',differentProcesses:true,realProvider:'NOT TESTED: no isolated credential/route supplied',reports,artifacts:dir};
  fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} else {
  const {boot,loadOverlayPatches}=await load('@deepseek-ai/dsh-app-boot');
  const {LlmAdapter,createUserMessage}=await load('@deepseek-ai/dsh-llm');
  const {defineTool}=await load('@deepseek-ai/dsh-tools');
  const base=await loadOverlayPatches('omni-test',host.resolve('@deepseek-ai/dsh-base/cordis.patch.yml'));
  const preset=await loadOverlayPatches('omni-test',path.join(source,'cordis.patch.yml'));
  const disabled=['llm-deepseek','llm-deepseek-account','llm-pi-ai','session-title-llm','hmr','plugin-manager',
    'tool-bash','tool-pwsh','tool-jobs','tool-fs','tool-fs-search','skill-filesystem','tool-skill','command-goal','tool-goal',
    'plan-mode','compaction-basic','command-compact','tool-result-pruner','tool-subagent-control','tool-subagent','tool-subagent-fork',
    'workflow-ptc','tool-workflow','agent-instructions','tool-todo','tool-web','spill-policy'];
  const extras=[
    ...disabled.map(id=>({id,disabled:true})),
    {id:'session-persistence-jsonl',config:{root:path.join(run,'sessions'),compression:'none'}},
    {id:'agent-default-model',config:{provider:'omni-fixture',model:'large'}},
    {insert:[
      {id:'connection',name:'@deepseek-ai/dsh-client-connection'},
      {id:'workspace',name:'@deepseek-ai/dsh-workspace'},
      {id:'schedule',name:'@deepseek-ai/dsh-schedule'},
      {id:'cordis-host-runner',name:'@deepseek-ai/dsh-cordis-host-runner'},
      {id:'cordis-inspect-providers',name:'@deepseek-ai/dsh-tool-cordis/host'},
      {id:'agent-preset-registry',name:'@deepseek-ai/dsh-agent-preset-registry',config:{default:'omni'}},
    ]},
  ];
  let calls=0;
  class FixtureAdapter extends LlmAdapter {
    async resolveModel(provider,model) {
      return {provider,id:model,name:model,context:{contextWindow:model==='small'?65536:1048576},defaultMaxTokens:4096,
        reasoning:{efforts:[{id:'effort-medium',name:'Medium'},{id:'effort-high',name:'High'}],defaultEffort:'effort-medium'}};
    }
    async *stream(options) {
      calls++;
      const last=options.messages.at(-1);
      if(last?.role==='user'&&last.content.some(block=>block.type==='text'&&block.text.includes('LARGE_TOOL_FIXTURE'))){
        const id=`fixture-call-${calls}`;
        yield {type:'block-start',index:0,blockType:'tool-call'};
        yield {type:'tool-call-delta',index:0,id,name:'omni_fixture_payload',argumentsDelta:'{}'};
        yield {type:'block-end',index:0,block:{type:'tool-call',id,name:'omni_fixture_payload',arguments:'{}'}};
        yield {type:'finish',reason:{kind:'tool-calls'}};
        return;
      }
      yield {type:'block-start',index:0,blockType:'text'};
      yield {type:'text-delta',index:0,text:options.purpose==='compaction'?'Fixture summary of verified history.':'OMNI_OK'};
      yield {type:'block-end',index:0,block:{type:'text',text:options.purpose==='compaction'?'Fixture summary of verified history.':'OMNI_OK'}};
      yield {type:'finish',reason:{kind:'stop'}};
    }
  }
  let ctx,handle;
  try {
    ctx=await boot('omni-test',path.join(run,'cordis.yml'),[...base,...extras,...preset],root=>{
      root.inject(['llm'],scope=>{scope.llm.registerAdapter(['omni-fixture'],new FixtureAdapter());});
    },pathToFileURL(run).href+'/');
    const roster=await ctx.agentPresets.list();
    const omni=roster.find(item=>item.id==='omni');
    assert(omni&&!omni.broken,`full preset activation failed: ${JSON.stringify(omni)}`);
    const sessionId='omni-integration-session';
    const setup=async(agentCtx,agent)=>{
      const selected=await ctx.agentPresets.mount(agentCtx,phase==='create'?'omni':ctx.agentPresets.presetForSession(agent.session)??'omni');
      if(phase==='create')agent.session.append('agent-preset/selected',{agentPreset:selected.id});
      agentCtx.tools.register(defineTool({
        name:'omni_fixture_payload',description:'Return a harmless synthetic test payload; no files or network.',parameters:{},
        output:{schema:{type:'string'},render:(_args,value)=>[{type:'text',text:value}]},
        execute:async()=> '😀'.repeat(2000000),
      }));
    };
    handle=phase==='create'
      ? await ctx.agents.create({sessionId,meta:{cwd:run},agentOptions:{provider:'omni-fixture',model:'large'},setup})
      : await ctx.agents.resume({resumeSessionId:sessionId,setup});
    const agent=handle.agent;
    if(phase==='create')assert.equal(agent.model.current().reasoningEffort,'effort-high');
    else assert.equal(agent.model.current().reasoningEffort,'effort-medium','resume must retain manual selection');
    const composition=ctx.agentPresets.inspectCompositions(agent.ctx);
    assert(composition.some(item=>item.id==='omni'&&item.leakedServices.length===0));
    agent.followup(createUserMessage({content:[{type:'text',text:'Only reply OMNI_OK. Do not use tools.'}],source:{kind:'user'}}));
    await agent.whenIdle();
    assert(calls>0,'real Agent loop must dispatch inference through fixture adapter');
    assert.equal(agent.session.requestHeader().config.reasoningEffort,phase==='create'?'effort-high':'effort-medium');
    assert(agent.session.deriveMessages().some(message=>message.role==='assistant'&&message.content.some(block=>block.type==='text'&&block.text==='OMNI_OK')));
    let adaptiveSwitchVerified=false,manualCompactionVerified=false;
    if(phase==='create'){
      const provider=ctx.agentPresets.serviceFor(agent,'omniRetention');
      assert.equal(typeof provider.beforeStep,'function','actual main realm must use adaptive provider');
      agent.followup(createUserMessage({content:[{type:'text',text:'LARGE_TOOL_FIXTURE'}],source:{kind:'user'}}));
      await agent.whenIdle();
      const first=agent.session.snapshotEvents();
      assert(first.some(event=>event.type==='compaction/prune'),'pressure must exercise replay-safe pruning inside the active turn');
      assert(first.some(event=>event.type==='tool/result'&&event.sourceEventSeqs?.length&&event.data.message.content.some(block=>block.type==='text'&&block.text.length>8192)),'larger model must retain more than the small fallback');
      const idleCount=agent.session.seq;
      assert.equal(provider.pruneSession(agent.session).pruned.length,0);
      assert.equal(agent.session.seq,idleCount,'idle pruning must not corrupt persisted lifecycle');
      agent.model.select({provider:'omni-fixture',model:'small',reasoningEffort:'effort-high'});
      agent.followup(createUserMessage({content:[{type:'text',text:'Only reply OMNI_OK after switching to the small model.'}],source:{kind:'user'}}));
      await agent.whenIdle();
      assert.equal(agent.session.requestHeader().config.model,'small');
      // At least two official prune events prove that the destination-model
      // preparation narrowed the earlier large output before committing small.
      assert(agent.session.snapshotEvents().filter(event=>event.type==='compaction/prune').length>=2);
      adaptiveSwitchVerified=true;
      const compaction=ctx.agentPresets.serviceFor(agent,'compaction');
      const summary=await compaction.compactNow(agent,new AbortController().signal);
      assert(summary&&summary.shadowedTokenCount>0,'manual compaction must execute the real DSH transaction');
      manualCompactionVerified=true;
      agent.model.select({provider:'omni-fixture',model:'large',reasoningEffort:'effort-medium'});
    }
    await ctx.sessions.flush(agent.session);
    const eventCount=agent.session.seq;
    const reader=await ctx.sessionPersistence.open(sessionId,'read');
    const {events}=await reader.read();await reader.close();
    assert.equal(events.length,eventCount);
    assert(events.some(event=>event.type==='agent-preset/selected'));
    assert(events.some(event=>event.type==='assistant/message'));
    assert(events.some(event=>event.type==='turn/end'&&event.data.reason.kind==='completed'));
    for(let i=0;i<events.length;i++)assert.equal(events[i].seq,i);
    const report={phase,pid:process.pid,fullPresetActivated:true,modelCalls:calls,eventCount,selectedEffort:agent.model.current().reasoningEffort,serviceLeaks:0,adaptiveSwitchVerified,manualCompactionVerified,realProvider:false};
    fs.writeFileSync(path.join(run,`${phase}.json`),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
  } finally {
    if(handle)await handle.dispose();
    if(ctx)await ctx.fiber.dispose();
  }
}
