// Bridge an official pruner from a nested Loader realm to a preset-private alias.
export const name = 'omni-retention-pool';
export const inject = ['toolResultPruner'];
const allowed = new Set(['omniSmallPruner', 'omniMediumPruner', 'omniLargePruner']);
export function apply(ctx, config) {
  if (!allowed.has(config?.as)) throw new Error('Invalid private retention-pool alias');
  ctx.reflect.provide(config.as, ctx.toolResultPruner);
}
