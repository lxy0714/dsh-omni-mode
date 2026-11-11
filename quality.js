// Scoped to this preset. Uses only the public Agent model-selection API.
export const name = 'omni-quality';
export const inject = ['llm'];

// Effort IDs are adapter-owned opaque strings. Rank only explicit human labels
// from model metadata, and pass the original advertised ID back unchanged.
// If ANY label is ambiguous, do not claim to know this model's maximum.
const ranks = new Map([
  ['none', 0], ['off', 0], ['disabled', 0], ['关闭', 0], ['无', 0],
  ['minimal', 1], ['最低', 1],
  ['low', 2], ['低', 2],
  ['medium', 3], ['中', 3], ['中等', 3],
  ['enabled', 4], ['开启', 4],
  ['high', 5], ['高', 5],
  ['xhigh', 6], ['extra high', 6], ['extra-high', 6], ['极高', 6],
  ['max', 7], ['maximum', 7], ['最高', 7],
]);

export function strongestEffort(reasoning) {
  const efforts = reasoning?.efforts;
  if (!Array.isArray(efforts) || efforts.length === 0) {
    return { reason: 'no-reasoning-capability' };
  }
  let best;
  let bestRank = -1;
  for (const effort of efforts) {
    if (typeof effort?.id !== 'string' || typeof effort.name !== 'string') {
      return { reason: 'unknown-effort-vocabulary' };
    }
    const rank = ranks.get(effort.name.trim().toLowerCase());
    if (rank === undefined) return { reason: 'unknown-effort-vocabulary' };
    if (rank > bestRank) { bestRank = rank; best = effort.id; }
  }
  if (bestRank <= 0) return { reason: 'no-enabled-reasoning-effort' };
  return { effort: best, reason: 'highest-recognized-effort' };
}

export async function resolveWithDeadline(llm, selection, signal, timeoutMs) {
  const controller = new AbortController();
  let timer;
  let rejectWaiting;
  const interrupted = new Promise((_, reject) => { rejectWaiting = reject; });
  const abort = () => {
    controller.abort(signal?.reason);
    rejectWaiting(new Error('Quality metadata discovery cancelled'));
  };
  signal?.addEventListener('abort', abort, { once: true });
  timer = setTimeout(() => {
    controller.abort();
    rejectWaiting(new Error('Quality metadata discovery timed out'));
  }, timeoutMs);
  try {
    if (signal?.aborted) abort();
    return await Promise.race([
      llm.resolveModelInfo(selection.provider, selection.model, controller.signal),
      interrupted,
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function initializeQuality(llm, { agent, source, signal }, warn = console.warn, timeoutMs = 20000) {
  // Resuming or clearing must preserve durable user choices. Only a fresh Agent
  // gets the quality default; later explicit model selections always win.
  if (source !== 'startup') return { reason: 'preserve-resumed-selection' };
  if (signal?.aborted) return { reason: 'cancelled' };
  try {
    const selected = agent.model.current();
    if (!selected?.provider || !selected?.model) return { reason: 'no-model-selection' };
    const info = await resolveWithDeadline(llm, selected, signal, timeoutMs);
    if (signal?.aborted) return { reason: 'cancelled' };
    // Do not clobber a user selection made while capability discovery was pending.
    const current = agent.model.current();
    if (!current || current.provider !== selected.provider || current.model !== selected.model ||
        current.reasoningEffort !== selected.reasoningEffort) return { reason: 'selection-changed' };
    if (current.reasoningEffort !== undefined &&
        !info.reasoning?.efforts?.some(effort => effort.id === current.reasoningEffort)) {
      warn('[全能模式] 当前推理档位未出现在能力清单中，保留原选择，避免误降档。');
      return { reason: 'unknown-current-effort' };
    }
    const result = strongestEffort(info.reasoning);
    if (!result.effort) {
      if (result.reason === 'unknown-effort-vocabulary') {
        warn('[全能模式] 推理档位语义未知，保留当前选择，未猜测最高档位。');
      }
      return result;
    }
    if (current.reasoningEffort !== result.effort) {
      await agent.model.select({ ...current, reasoningEffort: result.effort });
    }
    return result;
  } catch (error) {
    if (signal?.aborted) return { reason: 'cancelled' };
    // Do not log provider error text: it could contain endpoints or credentials.
    warn('[全能模式] 无法应用最高推理档位，已保留原模型设置；请检查模型能力或手动选档。');
    return { reason: 'initialization-failed' };
  }
}

export function apply(ctx) {
  ctx.on('agent/created', async (payload) => {
    await initializeQuality(ctx.llm, payload);
  });
}
