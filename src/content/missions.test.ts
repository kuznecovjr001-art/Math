import { describe, expect, it } from 'vitest';
import { recordChoices } from '../games/RecordGame';
import { tensChoices } from '../games/TensGame';
import { answerChoices } from '../games/types';
import {
  cardId, expectedAnswer, factChoices, instruction, MISSIONS, strategyHint, voiceParts, voiceText,
} from './missions';

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
        if (p.kind === 'hidden') expect(p.visible).toBeLessThan(p.total);
        if (p.kind === 'tenframe') expect(p.a).toBeLessThan(10);
        if (p.kind === 'shapes') expect(p.options).toContain(p.target);
        if (p.kind === 'shapes' && p.target === 'rectangle') expect(p.options).not.toContain('square');
        if (p.kind === 'story') expect(p.ops[p.op]).toBeDefined();
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

  it('always offers the right answer among the choices', () => {
    for (const m of MISSIONS) {
      for (const p of [...m.cards.A, ...m.cards.B, ...m.cards.C]) {
        const ans = expectedAnswer(p);
        const offered: Record<string, () => number[]> = {
          count: () => answerChoices(ans),
          hidden: () => answerChoices(ans, 0),
          tenframe: () => answerChoices(ans, 0),
          tens: () => p.kind === 'tens' ? tensChoices(p.tens, p.ones) : [],
          facts: () => p.kind === 'facts' ? factChoices(p.a, p.b) : [],
          story: () => answerChoices(ans, 0),
          record: () => answerChoices(ans),
          array: () => answerChoices(ans),
          boxes: () => answerChoices(ans),
        };
        const choices = offered[p.kind]?.();
        if (!choices) continue;
        expect(choices, `${m.id} ${JSON.stringify(p)}`).toContain(ans);
        expect(new Set(choices).size).toBe(choices.length);
        expect(choices.length).toBe(3);
      }
    }
  });

  it('offers the multiplication record as «по a, b раз»', () => {
    expect(recordChoices(2, 3)).toContain('2 × 3');
    expect(recordChoices(2, 3)).not.toContain('3 × 2');
  });

  it('keeps fact choices non-negative and without the answer duplicated', () => {
    for (let a = 0; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const c = factChoices(a, b);
        expect(c).toContain(a * b);
        expect(c.every((x) => x >= 0)).toBe(true);
        expect(new Set(c).size).toBe(c.length);
      }
    }
  });

  it('gives a strategy hint without naming the result for hard facts', () => {
    expect(strategyHint(6, 7)).toBe('6 × 7 = 5 × 7 + 7 = 35 + 7.');
    expect(strategyHint(9, 4)).not.toContain('36');
  });

  it('reads signs aloud', () => {
    expect(voiceText('Сколько будет 6 × 7?')).toBe('Сколько будет 6 умножить на 7?');
    expect(voiceText('12 : 3 = 4')).toBe('12 разделить на 3 равно 4');
  });

  it('voices a fixed instruction tail as its own checked recording', () => {
    expect(voiceParts('Сколько будет 26 + 13? Прыгай по числовой прямой: сначала десятками, потом единицами.')).toEqual([
      'Сколько будет 26 плюс 13?', 'Прыгай по числовой прямой: сначала десятками, потом единицами.',
    ]);
    expect(voiceParts('Сколько будет 6 × 7?')).toEqual(['Сколько будет 6 умножить на 7?']);
  });
});
