import { A, E, O, S, fail, unique } from './schema.mjs';

// Exact, nonnegative idle-game arithmetic. Validate gameSchemas[id] before run.
// Limits are execution/serialization guards, not suggested game-balance values.
const INPUT_DIGITS = 128;
const INTERMEDIATE_DIGITS = 4096;
const OUTPUT_DIGITS = 131072;
const WORK_UNITS = 100000000;
const MAX_RESOURCES = 100;
const MAX_LEVELS = 128;
const MAX_LEVEL = 10000;
// An end-of-input assertion (unlike $, this also rejects a final newline).
const integerString = positive => ({ ...S(INPUT_DIGITS), pattern: positive ? '^[1-9][0-9]*(?![\\s\\S])' : '^(?:0|[1-9][0-9]*)(?![\\s\\S])' });
const rational = () => O({ numerator: integerString(false), denominator: integerString(true) });
const integer = maximum => ({ type: 'integer', minimum: 0, maximum });
const rounding = () => E('floor', 'ceil', 'half-up', 'half-even');

export const gameSchemas = Object.freeze({
  'game.offline': O({
    elapsedSeconds: integer(Number.MAX_SAFE_INTEGER),
    maxOfflineSeconds: integer(Number.MAX_SAFE_INTEGER),
    efficiency: rational(),
    rounding: rounding(),
    resources: A(O({ id: S(64), ratePerSecond: rational(), rewardCap: integerString(false) }), MAX_RESOURCES, 1)
  }),
  'game.growth': O({
    base: integerString(false),
    multiplier: rational(),
    levels: A(integer(MAX_LEVEL), MAX_LEVELS, 1),
    rounding: rounding()
  })
});

function gcd(a, b) { while (b !== 0n) { const r = a % b; a = b; b = r; } return a; }
function reduced(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}
const readRational = value => reduced(BigInt(value.numerator), BigInt(value.denominator));

function budget() {
  let work = 0, output = 0;
  return {
    multiply(a, b, path) {
      if (a === 0n || b === 0n) return 0n;
      if (a === 1n) return b;
      if (b === 1n) return a;
      // Each operand is already bounded. Even a rejected transient product has
      // at most 8192 decimal digits; never allocate an unbounded BigInt power.
      const cost = a.toString().length * b.toString().length;
      if (cost > WORK_UNITS - work) fail('E_LIMIT', '计算工作量超过100000000 / Multiplication work budget exceeds 100000000 digit-pairs', path);
      work += cost;
      const value = a * b;
      if (value.toString().length > INTERMEDIATE_DIGITS) fail('E_LIMIT', '中间整数超过4096位 / Intermediate integer exceeds 4096 decimal digits', path);
      return value;
    },
    strings(...values) {
      const strings = values.map(value => value.toString());
      const digits = strings.reduce((sum, value) => sum + value.length, 0);
      if (digits > OUTPUT_DIGITS - output) fail('E_LIMIT', '输出数字超过131072位 / Aggregate numeric output exceeds 131072 decimal digits');
      output += digits;
      return strings;
    }
  };
}

function power(base, exponent, limits, path) {
  let result = 1n, factor = base, remaining = exponent;
  while (remaining > 0) {
    if (remaining % 2 === 1) result = limits.multiply(result, factor, path);
    remaining = Math.floor(remaining / 2);
    if (remaining > 0) factor = limits.multiply(factor, factor, path);
  }
  return result;
}

function rounded(numerator, denominator, mode) {
  const whole = numerator / denominator, remainder = numerator % denominator;
  if (remainder === 0n || mode === 'floor') return whole;
  if (mode === 'ceil') return whole + 1n;
  // Compare the two distances instead of doubling a 4096-digit remainder.
  const distanceUp = denominator - remainder;
  if (remainder < distanceUp) return whole;
  if (remainder > distanceUp || mode === 'half-up') return whole + 1n;
  return whole % 2n === 0n ? whole : whole + 1n;
}

const OFFLINE_MODEL = 't=min(elapsedSeconds,maxOfflineSeconds); exact=t*ratePerSecond*efficiency; roundedAmount=round(exact); awardedAmount=min(roundedAmount,rewardCap). One rounding per resource after the full exact product; caps do not carry fractions to future calls. / 每资源完整精确乘积只取整一次，再应用收益上限；不跨调用结转余数。';
const GROWTH_MODEL = 'exact(level)=base*(multiplier.numerator/multiplier.denominator)^level; amount=round(exact(level)). Each requested level is computed independently from base, in input order, without stepwise rounding or a gameplay value cap. Level 0 is base, including multiplier 0 (empty product). / 每等级从base独立计算并一次取整，保持输入顺序，不逐步舍入或暗设数值上限；零等级为空积。';

export const gameImplementations = Object.freeze({
  'game.offline'(input) {
    unique(input.resources.map(resource => resource.id), 'resource');
    const limits = budget(), efficiency = readRational(input.efficiency);
    const creditedSeconds = Math.min(input.elapsedSeconds, input.maxOfflineSeconds);
    const resources = input.resources.map((resource, index) => {
      const path = `$.resources[${index}]`, rate = readRational(resource.ratePerSecond);
      const numerator = limits.multiply(limits.multiply(BigInt(creditedSeconds), rate.numerator, path), efficiency.numerator, path);
      const denominator = limits.multiply(rate.denominator, efficiency.denominator, path);
      const exact = reduced(numerator, denominator), amount = rounded(exact.numerator, exact.denominator, input.rounding);
      const cap = BigInt(resource.rewardCap), award = amount < cap ? amount : cap;
      const [n, d, roundedAmount, awardedAmount, rewardCap] = limits.strings(exact.numerator, exact.denominator, amount, award, cap);
      return { id: resource.id, exactAmount: { numerator: n, denominator: d }, roundedAmount, awardedAmount, rewardCap, capped: amount > cap };
    });
    return {
      elapsedSeconds: input.elapsedSeconds, maxOfflineSeconds: input.maxOfflineSeconds,
      creditedSeconds, discardedSeconds: input.elapsedSeconds - creditedSeconds,
      rounding: input.rounding, resources, model: OFFLINE_MODEL
    };
  },
  'game.growth'(input) {
    const limits = budget(), base = BigInt(input.base), multiplier = readRational(input.multiplier);
    const [baseString, multiplierNumerator, multiplierDenominator] = limits.strings(base, multiplier.numerator, multiplier.denominator);
    const values = input.levels.map((level, index) => {
      const path = `$.levels[${index}]`;
      let numerator = base, denominator = 1n;
      if (level > 0 && base !== 0n && multiplier.numerator !== 0n) {
        const p = power(multiplier.numerator, level, limits, path);
        const q = power(multiplier.denominator, level, limits, path);
        // p and q are coprime. Cancel the integer base before its product,
        // avoiding a large unnecessary numerator/denominator gcd.
        const divisor = gcd(base, q);
        numerator = limits.multiply(base / divisor, p, path);
        denominator = q / divisor;
      } else if (level > 0) numerator = 0n;
      const amount = rounded(numerator, denominator, input.rounding);
      const [n, d, value] = limits.strings(numerator, denominator, amount);
      return { level, exactAmount: { numerator: n, denominator: d }, amount: value };
    });
    return { base: baseString, multiplier: { numerator: multiplierNumerator, denominator: multiplierDenominator }, rounding: input.rounding, values, model: GROWTH_MODEL };
  }
});
