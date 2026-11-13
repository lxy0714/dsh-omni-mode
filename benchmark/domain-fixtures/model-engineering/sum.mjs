// Synthetic fixture with a deliberate defect / 含故意缺陷的合成夹具。
export function sum(values) {
  let total = 0;
  for (const v of values) total += v;
  return total;
}
