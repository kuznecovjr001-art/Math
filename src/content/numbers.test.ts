import { describe, expect, it } from 'vitest';
import { jumpChoices } from '../games/JumpsGame';
import { answerChoices } from '../games/types';
import { extendCards, seededRng } from './generate';
import { ISLANDS } from './levels';
import { expectedAnswer, instruction, MISSIONS, type CardParams } from './missions';
import {
  clockChoices, clockText, isMore, mirror, placeChoices, riddleChoices, symmetryOptions, tenChoices, UNITS, weekChoices,
} from './numbers';

/** Все авторские и сгенерированные карточки новых механик. */
function cards(): { id: string; p: CardParams }[] {
  const out: { id: string; p: CardParams }[] = [];
  for (const m of MISSIONS) {
    for (const v of ['A', 'B', 'C'] as const) {
      const base = m.cards[v];
      if (!base.some(isMore)) continue;
      for (let seed = 1; seed <= 30; seed++) {
        const pool = [...m.cards.A, ...m.cards.B, ...m.cards.C];
        for (const p of extendCards(base, base, pool, base.length + 6, seededRng(seed))) out.push({ id: m.id, p });
      }
    }
  }
  return out;
}
const ALL = cards();

/** Те же варианты, что показывает игра. */
function options(p: CardParams): number[] {
  switch (p.kind) {
    case 'beads100': case 'chart100': return tenChoices(expectedAnswer(p), 1, 100);
    case 'complete100': return tenChoices(expectedAnswer(p), 1, 99);
    case 'openLine': return tenChoices(expectedAnswer(p), 1, 100);
    case 'bar': return tenChoices(expectedAnswer(p), 1, 200);
    case 'tally': return p.ask === 'most' ? p.counts.map((_, i) => i) : answerChoices(expectedAnswer(p));
    case 'groupsOf': case 'units': return answerChoices(expectedAnswer(p));
    case 'jumps': return jumpChoices(p.step, p.count);
    case 'fraction': return p.options.map((_, i) => i);
    case 'placeValue': return placeChoices(p.h, p.t, p.o);
    case 'riddle': return riddleChoices(p);
    case 'compare3': return [0, 1, 2];
    case 'symmetry': return [0, 1, 2];
    case 'clock': return clockChoices(p).map((_, i) => i);
    case 'week': return weekChoices(p);
    case 'unitPick': return UNITS.map((_, i) => i);
    default: return [];
  }
}

describe('islands 3–6 cards', () => {
  it('covers islands three, four and the hundreds island', () => {
    expect(ISLANDS.map((i) => i.id)).toContain('hundreds');
    for (const id of ['N17', 'N20', 'N21', 'N24', 'N25', 'N33']) expect(MISSIONS.some((m) => m.id === id)).toBe(true);
  });

  it('always offers the right answer among three distinct choices', () => {
    expect(ALL.length).toBeGreaterThan(500);
    for (const { id, p } of ALL) {
      if (p.kind === 'coins') continue; // ответ набирается монетами, а не выбирается
      const opts = options(p);
      const where = `${id}: ${JSON.stringify(p)}`;
      expect(opts, where).toContain(expectedAnswer(p));
      expect(new Set(opts).size, where).toBe(opts.length);
      expect(opts.length, where).toBeGreaterThanOrEqual(3);
      expect(opts.every((o) => o >= 0), where).toBe(true);
    }
  });

  it('writes a task text without placeholders', () => {
    for (const { p } of ALL) {
      const t = instruction(p);
      expect(t.length).toBeGreaterThan(10);
      expect(t).not.toMatch(/undefined|NaN/);
    }
  });

  it('keeps generated numbers sensible', () => {
    for (const { id, p } of ALL) {
      const where = `${id}: ${JSON.stringify(p)}`;
      switch (p.kind) {
        case 'coins': expect(p.price, where).toBeGreaterThan(0); break;
        case 'groupsOf': expect(p.total % p.size, where).toBe(0); break;
        case 'placeValue': case 'riddle': expect(p.h, where).toBeGreaterThan(0); break;
        case 'compare3': expect(p.a >= 100 && p.a <= 999 && p.b >= 100 && p.b <= 999, where).toBe(true); break;
        case 'openLine': expect(p.a + p.b, where).toBeLessThanOrEqual(99); break;
        case 'fraction': expect(p.options.filter((f, i) => i === expectedAnswer(p) && f.equal), where).toHaveLength(1); break;
        case 'symmetry': {
          const opts = symmetryOptions(p);
          expect(opts.filter((o) => o.join() === mirror(p.half).join()), where).toHaveLength(1);
          break;
        }
        case 'complete100': expect(p.n > 0 && p.n < 100, where).toBe(true); break;
        // У пропущенной клетки есть соседи слева и справа в её ряду, как в авторских карточках.
        case 'chart100': expect(p.missing % 10, where).toBeGreaterThanOrEqual(2); break;
        case 'units': {
          const authored = MISSIONS.flatMap((m) => [...m.cards.A, ...m.cards.B, ...m.cards.C])
            .filter((x) => x.kind === 'units' && x.unit === p.unit).map((x) => (x as { len: number }).len);
          expect(p.len, where).toBeLessThanOrEqual(Math.max(...authored));
          break;
        }
      }
    }
  });

  it('offers three different clock times with the right one among them', () => {
    for (let h = 1; h <= 12; h++) {
      for (const m of [0, 30] as const) {
        const opts = clockChoices({ h, m });
        expect(opts, `${h}:${m}`).toContain(clockText(h, m));
        expect(new Set(opts).size, `${h}:${m} ${opts.join()}`).toBe(3);
      }
    }
  });

  it('marks exactly one fraction option as right', () => {
    for (const { id, p } of ALL) {
      if (p.kind !== 'fraction') continue;
      expect(expectedAnswer(p), `${id}: ${JSON.stringify(p)}`).toBeGreaterThanOrEqual(0);
    }
  });
});
