// Short-lived, bounded trusted-code worker. Stdin is JSON DATA, never code.
import { documentSchemas } from './documents-audit.mjs';
import { validate, CapabilityError } from './schema.mjs';
import { auditDocumentsCore } from './documents-audit-core.mjs';
try {
  let bytes = 0; const chunks = [];
  for await (const chunk of process.stdin) { bytes += chunk.length; if (bytes > 2 * 1024 * 1024) throw new CapabilityError('E_LIMIT', '输入超过2MiB / Input exceeds 2 MiB'); chunks.push(chunk); }
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8')); validate(documentSchemas['documents.audit'], input);
  process.stdout.write(JSON.stringify({ result: auditDocumentsCore(input) }));
} catch (error) {
  process.stdout.write(JSON.stringify({ error: error instanceof CapabilityError ? { code: error.code, message: error.message, path: error.path } : { code: 'E_PARSE', message: '标准解析器执行失败 / Standard parser execution failed' } }));
  process.exitCode = 1;
}
