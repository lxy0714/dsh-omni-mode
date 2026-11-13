// Synthetic fixture / 合成夹具。
import {readFileSync} from 'node:fs';

export function loadReport(file, requested) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  return data[requested];
}
