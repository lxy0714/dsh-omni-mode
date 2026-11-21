// Bounded supplied-bundle Markdown audit. The standard parser is loaded only
// inside a short-lived worker for this operation, not by other capability calls.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { A, B, O, S, fail } from './schema.mjs';
export const documentSchemas = {
  'documents.audit': O({
    documents: A(O({ path: S(1000), markdown: S(500000, 0) }), 100, 1),
    assets: A(S(1000), 2000),
    requiredHeadings: A(S(500), 100),
    checkHeadingLevels: { ...B, description: '默认true；检查连续标题跳级 / Default true; check heading-level jumps' },
    checkUnparsedSyntax: { ...B, description: '默认true；未解析链接/引用/扩展候选须复核，可能是字面文本；关闭时不核验这些候选 / Default true; unparsed candidates require intent review; false excludes them' }
  }, ['documents'])
};
// Separately test transport classification with explicit mock outcomes, without
// corrupting the real worker or pretending to have induced an OS memory fault.
export function decodeDocumentWorkerResult(child) {
  if (child.error?.code === 'ETIMEDOUT' || child.error?.code === 'ENOBUFS' || child.signal) fail('E_LIMIT', '标准解析器超时/内存或输出限 / Parser exceeded time, memory or output bounds');
  if (child.error) fail('E_RUNTIME', '无法启动解析工作进程 / Cannot start parser worker');
  let message; try { message = JSON.parse(child.stdout); } catch { fail('E_PARSE', '标准解析器未返回有效JSON / Parser did not return valid JSON'); }
  if (message.error) fail(message.error.code, message.error.message, message.error.path);
  const result = message.result;
  if (child.status !== 0 || !result || typeof result.valid !== 'boolean' || !Array.isArray(result.issues) || !Number.isSafeInteger(result.totalIssues)
    || result.issues.length > 200 || result.totalIssues < result.issues.length || result.valid !== (result.totalIssues === 0) || result.scope !== 'supplied-document-bundle-only') fail('E_PARSE', '标准解析器未正常完整返回 / Parser did not return a complete valid response');
  return { ...result, executionBoundary: { process: 'short-lived trusted-code worker', timeoutMs: 5000, v8OldSpaceMiB: 96, outputBytesLimit: 8388608, note: '非安全沙箱或总RSS保证 / Not a security sandbox or total-RSS guarantee' } };
}
export const documentImplementations = {
  'documents.audit'(input) {
    const raw = JSON.stringify(input);
    if (Buffer.byteLength(raw) > 2 * 1024 * 1024) fail('E_LIMIT', '输入超过2MiB / Input exceeds 2 MiB');
    const child = spawnSync(process.execPath,
      ['--max-old-space-size=96', fileURLToPath(new URL('./documents-audit-worker.mjs', import.meta.url))],
      { input: raw, encoding: 'utf8', timeout: 5000, killSignal: 'SIGKILL', maxBuffer: 8 * 1024 * 1024,
        env: { PATH: process.env.PATH || '', NODE_OPTIONS: '', NODE_DISABLE_COMPILE_CACHE: '1' } });
    return decodeDocumentWorkerResult(child);
  }
};
