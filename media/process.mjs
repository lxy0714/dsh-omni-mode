import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
async function waitGroupExit(group){
 if(process.platform!=='linux')return;
 for(let attempt=0;attempt<50;attempt++){
 let live=false;for(const name of await fs.readdir('/proc')){if(!/^\d+$/.test(name))continue;const stat=await fs.readFile(`/proc/${name}/stat`,'utf8').catch(()=>null);if(!stat)continue;const fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');if(Number(fields[2])===group&&!['Z','X'].includes(fields[0])){live=true;break;}}
 if(!live)return;await delay(20);
 }throw new Error('owned descendants failed to exit / 本作业子进程未退出');
}
const MAX_LOG=32768;
// Own process groups only; never kill by process name. Child execution is NOT a sandbox.
export async function runProcess(executable,args,{cwd,signal,timeoutMs=120000,maxOutput=1048576,binaryOutput=false,onCommand}={}){
 if(signal?.aborted)throw signal.reason??new Error('CANCELLED / 已取消');
 onCommand?.({executable,args});
 return new Promise((resolve,reject)=>{
 let child,stdout=Buffer.alloc(0),stderr=Buffer.alloc(0),failure,timer,killTimer,settled=false;
 const killGroup=sig=>{if(!child?.pid)return;try{process.kill(-child.pid,sig);}catch(e){if(e.code!=='ESRCH')failure??=e;}};
 const terminate=reason=>{failure??=reason;killGroup('SIGTERM');killTimer??=setTimeout(()=>killGroup('SIGKILL'),400);};
 const abort=()=>terminate(signal.reason??new Error('CANCELLED / 已取消'));
 try{child=spawn(executable,args,{cwd,detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env}});}catch(e){reject(e);return;}
 signal?.addEventListener('abort',abort,{once:true});
 timer=setTimeout(()=>terminate(new Error('TIMEOUT / 执行超时')),timeoutMs);
 child.stdout.on('data',chunk=>{if(stdout.length+chunk.length>maxOutput){terminate(new Error('process output limit / 进程输出超限'));return;}stdout=Buffer.concat([stdout,chunk]);});
 child.stderr.on('data',chunk=>{stderr=Buffer.concat([stderr,chunk]);if(stderr.length>MAX_LOG)stderr=stderr.subarray(stderr.length-MAX_LOG);});
 child.on('error',e=>{failure??=new Error(e.code==='ENOENT'?`BLOCKED missing executable / 缺少可执行程序: ${executable}`:e.message);});
 child.on('close',async(code,sig)=>{
 if(settled)return;settled=true;clearTimeout(timer);clearTimeout(killTimer);signal?.removeEventListener('abort',abort);
 // A leader may leave detached-within-group descendants: terminate even after successful exit.
 killGroup('SIGKILL');
 if(child.pid)try{await waitGroupExit(child.pid);}catch(e){failure??=e;}
 if(failure)reject(failure);else if(code!==0)reject(new Error(`${executable}: exit ${code??sig} / 进程失败\n${stderr.toString('utf8')}`));else resolve({stdout:binaryOutput?stdout:stdout.toString('utf8'),stderr:stderr.toString('utf8'),code});
 });
 });
}
export async function toolVersion(executable,signal){const r=await runProcess(executable,['-version'],{signal,timeoutMs:10000,maxOutput:65536});return r.stdout.split('\n')[0];}
export function linkedAbort(timeoutMs){const controller=new AbortController();const onSignal=()=>controller.abort(new Error('CANCELLED / 已取消'));process.on('SIGINT',onSignal);process.on('SIGTERM',onSignal);const timer=setTimeout(()=>controller.abort(new Error('TIMEOUT / 作业超时')),timeoutMs);return {signal:controller.signal,close(){clearTimeout(timer);process.off('SIGINT',onSignal);process.off('SIGTERM',onSignal);}};}
