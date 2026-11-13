import test from 'node:test';
import assert from 'node:assert/strict';
import {sum} from './sum.mjs';

test('adds finite numbers and treats empty as zero', () => {
  assert.equal(sum([]), 0);
  assert.equal(sum([1, 2.5]), 3.5);
});

test('rejects invalid members instead of concatenating or coercing', () => {
  assert.throws(() => sum([1, '2']), /invalid/);
  assert.throws(() => sum([NaN]), /invalid/);
  assert.throws(() => sum([Infinity]), /invalid/);
});
