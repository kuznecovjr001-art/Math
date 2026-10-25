import { describe, expect, it } from 'vitest';
import { patternChoices } from '../games/PatternGame';
import { answerChoices } from '../games/types';
import { extendCards, GENERATOR_ICONS, seededRng, varyCard } from './generate';
import { ISLANDS, missionLength } from './levels';
import { cardId, expectedAnswer, instruction, MISSIONS, type CardParams } from './missions';
import { buildSteps, type PlayMode } from './steps';

const MODES: PlayMode[] = ['play', 'review', 'again'];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

/** Все карточки, которые генератор может выдать в миссии за 40 заходов каждого вида. */
function generated(): { id: string; p: CardParams }[] {
  const out: { id: string; p: CardParams }[] = [];
  for (const m of MISSIONS) {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        for (const s of buildSteps(m, mode, missionLength(m.id), seededRng(seed))) {
          if (s.generated) out.push({ id: m.id, p: s.params });
        }
      }
    }
  }
  return out;
}
const ALL = generated();

describe('generated cards', () => {
  it('makes missions 6–8 cards for preschoolers and 8–10 for school islands', () => {
    for (const m of MISSIONS) {
      const len = missionLength(m.id);
      const steps = buildSteps(m, 'play', len, seededRng(1));
      expect(steps.length).toBe(Math.max(len.learn, m.cards.A.length) + Math.max(len.probe, m.cards.B.length));
      const school = ISLANDS.findIndex((i) => i.missions.includes(m.id)) >= 2;
      expect(steps.length).toBeGreaterThanOrEqual(school ? 8 : 6);
      expect(steps.length).toBeLessThanOrEqual(school ? 10 : 8);
      expect(buildSteps(m, 'review', len, seededRng(1)).length).toBe(len.review);
      expect(buildSteps(m, 'again', len, seededRng(1)).every((s) => s.variant === 'B' && s.generated)).toBe(true);
    }
  });

  it('keeps authored cards first and in their place', () => {
    for (const m of MISSIONS) {
      const steps = buildSteps(m, 'play', missionLength(m.id), seededRng(7));
      expect(steps.slice(0, m.cards.A.length).map((s) => s.params)).toEqual(m.cards.A);
      const firstB = steps.findIndex((s) => s.variant === 'B');
      expect(steps.slice(firstB, firstB + m.cards.B.length).map((s) => s.params)).toEqual(m.cards.B);
    }
  });

  it('gives new numbers on a new entry', () => {
    const m = MISSIONS.find((x) => x.id === 'N01')!;
    const a = buildSteps(m, 'again', missionLength('N01'), seededRng(1)).map((s) => s.params);
    const b = buildSteps(m, 'again', missionLength('N01'), seededRng(2)).map((s) => s.params);
    expect(a).not.toEqual(b);
  });

  it('repeats the same set for the same seed', () => {
    const m = MISSIONS.find((x) => x.id === 'T06')!;
    const run = () => buildSteps(m, 'play', missionLength('T06'), seededRng(42)).map((s) => s.params);
    expect(run()).toEqual(run());
  });

  it('does not repeat a card inside one entry when there is room', () => {
    for (const m of MISSIONS) {
      for (const seed of SEEDS.slice(0, 10)) {
        const keys = buildSteps(m, 'play', missionLength(m.id), seededRng(seed)).map((s) => JSON.stringify(s.params));
        keys.slice(1).forEach((k, i) => expect(k, `${m.id} seed ${seed}`).not.toBe(keys[i]));
        // Где вариантов меньше, чем карточек, повтор возможен: у котёнка 4 места,
        // у автобуса на 4–5 мест 7 раскладок, у сада до 12 деревьев 7 размеров.
        if (!['N09', 'A03', 'A11'].includes(m.id)) expect(new Set(keys).size, `${m.id} seed ${seed}`).toBe(keys.length);
      }
    }
  });

  it('keeps every kind from the mission in the mix', () => {
    const n01 = MISSIONS.find((x) => x.id === 'N01')!;
    const kinds = buildSteps(n01, 'again', missionLength('N01'), seededRng(3)).map((s) => s.params.kind);
    expect(new Set(kinds)).toEqual(new Set(['count', 'basket']));
  });

  it('keeps every generated card solvable', () => {
    for (const { id, p } of ALL) {
      const where = `${id}: ${JSON.stringify(p)}`;
      const ans = expectedAnswer(p);
      expect(Number.isInteger(ans), where).toBe(true);
      expect(instruction(p), where).not.toMatch(/undefined|NaN/);
      switch (p.kind) {
        case 'cups': expect(p.items, where).toBeGreaterThan(p.receivers); break;
        case 'basket': expect(p.stock, where).toBeGreaterThan(p.target); break;
        case 'count': expect(p.n, where).toBeGreaterThanOrEqual(1); break;
        case 'seats': expect(p.taken > 0 && p.taken < p.total, where).toBe(true); break;
        case 'hidden': expect(p.visible > 0 && p.visible < p.total, where).toBe(true); break;
        case 'parcels': expect(ans, where).toBeGreaterThan(0); break;
        case 'shapes':
          expect(p.options, where).toContain(p.target);
          expect(new Set(p.options).size, where).toBe(3);
          break;
        case 'tenframe':
          if (p.b === 0) expect(p.a >= 1 && p.a <= 9, where).toBe(true);
          else expect(p.a + p.b > 10 && p.b <= 9, where).toBe(true);
          break;
        case 'boxes': expect(p.stock, where).toBeGreaterThanOrEqual(p.groups * p.per); break;
        case 'array': expect(p.rows, where).not.toBe(p.cols); break;
        case 'story':
          expect(p.op >= 0 && p.op < p.ops.length, where).toBe(true);
          expect(ans, where).toBeGreaterThan(0);
          break;
        case 'sort':
          expect(p.items.length, where).toBe(6);
          expect(p.items.filter((x) => x.bin === 0).length, where).toBe(3);
          break;
        case 'pattern':
          expect(new Set(p.unit).size, where).toBeGreaterThan(1);
          expect(p.shown, where).toBeGreaterThanOrEqual(p.unit.length * 2 - 1);
          expect(patternChoices(p.unit), where).toContain(p.unit[p.shown % p.unit.length]);
          break;
        case 'flash':
          expect(p.n, where).toBeLessThanOrEqual(p.layout === 'dice' ? 6 : 10);
          break;
        case 'zero':
          expect(p.lose >= 1 && p.lose <= p.start, where).toBe(true);
          expect(answerChoices(ans, 0), where).toContain(ans);
          break;
        case 'fingers': expect(p.up > 0 && p.up < p.total, where).toBe(true); break;
        case 'measure': {
          const len = p.attr === 'longer' || p.attr === 'shorter';
          expect(len ? p.a.len : p.a.weight, where).not.toBe(len ? p.b.len : p.b.weight);
          if (len) {
            const short = p.a.len! < p.b.len! ? p.a : p.b;
            const long = short === p.a ? p.b : p.a;
            // На глаз короткая лента кажется длиннее: её конец дальше.
            expect(short.shift! + short.len!, where).toBeGreaterThan(long.shift! + long.len!);
          }
          break;
        }
        case 'order': expect([3, 4], where).toContain(p.events.length); break;
      }
    }
  });

  it('keeps numbers inside the range the author set', () => {
    for (const m of MISSIONS) {
      const pool = [...m.cards.A, ...m.cards.B, ...m.cards.C];
      const authoredMax = Math.max(...pool.map(expectedAnswer));
      for (const { p } of ALL.filter((x) => x.id === m.id)) {
        if (p.kind === 'facts' || p.kind === 'story' || p.kind === 'tens' || p.kind === 'count') continue;
        expect(expectedAnswer(p), `${m.id}: ${JSON.stringify(p)}`).toBeLessThanOrEqual(Math.max(authoredMax, 10));
      }
    }
  });

  it('teaches zero in about half of the button cards', () => {
    const zero = ALL.filter((x) => x.p.kind === 'zero');
    const share = zero.filter((x) => expectedAnswer(x.p) === 0).length / zero.length;
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.7);
  });

  it('uses only pictures that ship with the app', () => {
    const icons = new Set<string>(GENERATOR_ICONS);
    for (const { p } of ALL) {
      if (p.kind === 'sort') p.items.forEach((x) => icons.add(x.icon));
      if (p.kind === 'order') p.events.forEach((x) => icons.add(x.icon));
      if (p.kind === 'measure' && p.a.icon) [p.a.icon, p.b.icon!].forEach((x) => icons.add(x));
    }
    const files = Object.keys(import.meta.glob('../../public/img/openmoji/*.svg'));
    for (const code of icons) expect(files, code).toContain(`../../public/img/openmoji/${code}.svg`);
  });

  it('marks generated cards in their id', () => {
    const m = MISSIONS.find((x) => x.id === 'A03')!;
    expect(cardId(m, 'B', 3, true)).toBe('M05-A03-B4g-v1');
    expect(cardId(m, 'B', 0)).toBe('M05-A03-B-v1');
  });

  it('extends a plain list without touching the authored part', () => {
    const t: CardParams = { kind: 'fingers', total: 5, up: 2 };
    const out = extendCards([t], [t], [t], 4, seededRng(5));
    expect(out[0]).toBe(t);
    expect(out).toHaveLength(4);
    expect(varyCard(t, [t], seededRng(9)).kind).toBe('fingers');
  });
});
