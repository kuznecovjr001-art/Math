import { describe, expect, it } from 'vitest';
import { cardId, expectedAnswer, instruction, MISSIONS } from './missions';

describe('missions content', () => {
  it('has unique ids and known prerequisites', () => {
    const ids = MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MISSIONS) for (const r of m.requires) expect(ids).toContain(r);
  });

  it('gives every mission learning, probe and review cards', () => {
    for (const m of MISSIONS) {
      expect(m.cards.A.length).toBeGreaterThan(0);
      expect(m.cards.B.length).toBe(m.cards.A.length);
      expect(m.cards.C.length).toBe(m.cards.A.length);
    }
  });

  it('keeps every card solvable with the given stock', () => {
    for (const m of MISSIONS) {
      for (const p of [...m.cards.A, ...m.cards.B, ...m.cards.C]) {
        if (p.kind === 'cups') expect(p.items).toBeGreaterThanOrEqual(p.receivers);
        if (p.kind === 'basket') expect(p.stock).toBeGreaterThan(p.target);
        if (p.kind === 'boxes') expect(p.stock).toBeGreaterThanOrEqual(p.groups * p.per);
        if (p.kind === 'seats') expect(p.taken).toBeLessThan(p.total);
        expect(expectedAnswer(p)).toBeGreaterThan(0);
      }
    }
  });

  it('builds card ids like M05-A03-B-v1', () => {
    const a03 = MISSIONS.find((m) => m.id === 'A03')!;
    expect(cardId(a03, 'B', 0)).toBe('M05-A03-B-v1');
  });

  it('writes instructions with correct Russian forms', () => {
    expect(instruction({ kind: 'basket', target: 4, stock: 7, fruit: 'apple' }))
      .toBe('Положи в корзину 4 яблока.');
    expect(instruction({ kind: 'seats', total: 5, taken: 2 }))
      .toBe('Тут 5 мест. 2 пассажира уже сели. Посади столько, сколько ещё может сесть.');
    expect(instruction({ kind: 'boxes', groups: 3, per: 2, stock: 8, fruit: 'apple', holder: 'box' }))
      .toBe('Положи в каждую из 3 коробок по 2 яблока.');
  });
});
