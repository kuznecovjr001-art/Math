import { describe, expect, it } from 'vitest';
import { answerChoices } from './types';

describe('answerChoices', () => {
  it('offers three distinct options including the answer', () => {
    for (let a = 1; a <= 10; a++) {
      const c = answerChoices(a);
      expect(c).toHaveLength(3);
      expect(new Set(c).size).toBe(3);
      expect(c).toContain(a);
      expect(Math.min(...c)).toBeGreaterThanOrEqual(1);
    }
  });

  it('does not always put the answer in the same place', () => {
    const places = new Set([3, 4, 5].map((a) => answerChoices(a).indexOf(a)));
    expect(places.size).toBeGreaterThan(1);
  });
});
