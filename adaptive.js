import { resolveWithDeadline } from './quality.js';

export const name = 'omni-adaptive-retention';
export const inject = ['llm', 'omniSmallPruner', 'omniMediumPruner', 'omniLargePruner'];

export function availableWindow(window, output = 0) {
  if (!Number.isSafeInteger(window) || window <= 0) return undefined;
  const reservation = Number.isSafeInteger(output) && output >= 0 ? output : 0;
  return Math.max(0, window - reservation - 8192);
}

export function chooseTier(session, pending) {
  // Pending metadata covers a destination model before its header is committed.
  // Taking the minimum also stays conservative after an unsuccessful switch.
  if (pending && !pending.valid) return 'small';
  const values = [];
  const context = session.requestContext();
  const header = session.requestHeader();
  const current = availableWindow(context?.contextWindow, header?.config?.maxTokens);
  if (current !== undefined) values.push(current);
  if (pending?.valid) {
    const next = availableWindow(pending.window, pending.output);
    if (next !== undefined) values.push(next);
  }
  if (values.length === 0) return 'small';
  const usable = Math.min(...values);
  return usable >= 524288 ? 'large' : usable >= 131072 ? 'medium' : 'small';
}

export function createAdaptiveProvider(pools, llm, warn = console.warn) {
  // Derived caches only. No model settings, session events or shared configs
  // are mutated here. Official pruners own durable replay-safe replacements.
  const pending = new WeakMap();
  const activeTurns = new WeakSet();
  const metadata = new Map();
  let warned = false;
  return {
    config: pools.small.config,
    measureContent: blocks => pools.small.measureContent(blocks),
    pruneContent: blocks => pools.small.pruneContent(blocks),
    pruneSession(session) {
      // Replacement tool/result events must belong to an open turn. In idle
      // manual compaction, let the official summary transaction run without
      // writing tool-result replacements outside the lifecycle envelope.
      if (!activeTurns.has(session)) return { pruned: [], charsRemoved: 0 };
      return pools[chooseTier(session, pending.get(session))].pruneSession(session);
    },
    markIdle(session) { activeTurns.delete(session); },
    async beforeStep(payload, next) {
      const { agent, modelSelection: selection, signal } = payload;
      if (signal?.aborted) return next();
      activeTurns.add(agent.session);
      pending.set(agent.session, { valid: false });
      try {
        if (selection?.provider && selection?.model) {
          const key = JSON.stringify([selection.provider, selection.model]);
          let entry = metadata.get(key);
          if (!entry || entry.expires <= Date.now()) {
            const info = await resolveWithDeadline(llm, selection, signal, 20000);
            entry = {
              window: info.context?.contextWindow,
              output: info.defaultMaxTokens,
              expires: Date.now() + 60000,
            };
            // Bound derived catalog state independently of Agent recursion.
            if (metadata.size >= 128) metadata.delete(metadata.keys().next().value);
            metadata.set(key, entry);
          }
          if (!signal?.aborted) pending.set(agent.session, {
            valid: availableWindow(entry.window, entry.output) !== undefined,
            window: entry.window, output: entry.output,
          });
        }
      } catch {
        if (!signal?.aborted && !warned) {
          warned = true;
          warn('[全能模式] 模型窗口信息暂不可用，采用保守保留档位；未改变模型或推理设置。');
        }
      }
      // Preserve rejection, cancellation, messages and request-series decisions
      // from all other listeners. Do not catch errors thrown by next().
      return next();
    },
    clearMetadata() { metadata.clear(); },
  };
}

export function apply(ctx) {
  // Private aliases are supplied by nested Loader groups. Do not mix Loader
  // string labels with Context.isolate labels: they are different namespaces.
  const provider = createAdaptiveProvider({
    small: ctx.omniSmallPruner, medium: ctx.omniMediumPruner, large: ctx.omniLargePruner,
  }, ctx.llm);
  ctx.reflect.provide('toolResultPruner', provider);
  ctx.reflect.provide('omniRetention', provider);
  ctx.on('agent/pre-step', (payload, next) => provider.beforeStep(payload, next), { prepend: true });
  ctx.on('agent/status', ({agent,status}) => { if (status === 'idle') provider.markIdle(agent.session); });
  ctx.on('llm/models-updated', () => provider.clearMetadata());
  ctx.on('llm/adapters-updated', () => provider.clearMetadata());
}
