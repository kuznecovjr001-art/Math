import { describe, expect, it } from 'vitest';
import { plural } from './words';

describe('plural', () => {
  it('picks the Russian form for a number', () => {
    const f = (n: number) => plural(n, 'яблоко', 'яблока', 'яблок');
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25].map(f)).toEqual([
      'яблоко', 'яблока', 'яблока', 'яблок', 'яблок', 'яблок', 'яблоко', 'яблока', 'яблок',
    ]);
  });
});
