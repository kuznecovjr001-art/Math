import { describe, expect, it } from 'vitest';
import { shuffled } from '../games/OrderGame';
import { patternChoices } from '../games/PatternGame';
import { answerChoices } from '../games/types';
import { ART_NAMES, artCodeFromFile, buildArtMap } from './art';
import { islandOf } from './levels';
import { expectedAnswer, measureAnswer, MISSIONS } from './missions';

const NEW = ['N09', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N16'];
const cards = (id: string) => {
  const m = MISSIONS.find((x) => x.id === id)!;
  return [...m.cards.A, ...m.cards.B, ...m.cards.C];
};

describe('missions from the NCERT books', () => {
  it('places preschool missions on the first two islands', () => {
    for (const id of NEW.slice(0, 5)) expect(islandOf(id)).toBe(0);
    for (const id of NEW.slice(5)) expect(islandOf(id)).toBe(1);
  });

  it('keeps every new card solvable', () => {
    for (const id of NEW) {
      for (const p of cards(id)) {
        if (p.kind === 'sort') {
          expect(p.items.filter((x) => x.bin === 0).length).toBe(p.items.filter((x) => x.bin === 1).length);
        }
        if (p.kind === 'pattern') {
          expect(p.shown).toBeGreaterThanOrEqual(p.unit.length * 2 - 1);
          expect(patternChoices(p.unit)).toContain(p.unit[p.shown % p.unit.length]);
        }
        if (p.kind === 'flash' && p.layout === 'dice') expect(p.n).toBeLessThanOrEqual(6);
        if (p.kind === 'flash' && p.layout === 'frame') expect(p.n).toBeLessThanOrEqual(10);
        if (p.kind === 'zero') {
          expect(p.lose).toBeLessThanOrEqual(p.start);
          expect(answerChoices(expectedAnswer(p), 0)).toContain(expectedAnswer(p));
        }
        if (p.kind === 'fingers') expect(p.up).toBeLessThan(p.total);
        if (p.kind === 'measure') {
          const len = p.attr === 'longer' || p.attr === 'shorter';
          expect(len ? p.a.len : p.a.weight).not.toBe(len ? p.b.len : p.b.weight);
        }
      }
    }
  });

  it('teaches zero: some cards end with nothing left', () => {
    expect(cards('N13').some((p) => expectedAnswer(p) === 0)).toBe(true);
  });

  it('makes length cards misleading by eye until aligned', () => {
    // Длинная лента начинается раньше, короткая сдвинута: на глаз концы почти рядом.
    for (const p of cards('N15')) {
      if (p.kind !== 'measure' || !p.a.len) continue;
      const shorter = p.a.len! < p.b.len! ? p.a : p.b;
      expect(shorter.shift).toBeGreaterThan(0);
    }
  });

  it('reads the scale by weight, not by picture size', () => {
    expect(measureAnswer({
      kind: 'measure', attr: 'heavier',
      a: { icon: '1FAA8', weight: 5 }, b: { icon: '1F388', weight: 1 },
    })).toBe(0);
    expect(measureAnswer({ kind: 'measure', attr: 'shorter', a: { len: 5 }, b: { len: 3 } })).toBe(1);
  });

  it('never shows day events already in order', () => {
    for (const p of cards('N16')) {
      if (p.kind !== 'order') continue;
      expect(shuffled(p.events)).not.toEqual(p.events);
    }
  });
});

describe('own artwork', () => {
  it('maps file names to OpenMoji codes', () => {
    expect(artCodeFromFile('../assets/art/apple.png')).toBe('1F34E');
    expect(artCodeFromFile('../assets/art/Cat.webp')).toBe('1F431');
    expect(artCodeFromFile('../assets/art/1f34e.svg')).toBe('1F34E');
    expect(buildArtMap({ '../assets/art/apple.png': '/a.png' })).toEqual({ '1F34E': '/a.png' });
    expect(artCodeFromFile('../assets/art/ui/Icon-Home.png')).toBe('ui/icon-home');
    expect(artCodeFromFile('../assets/art/bg/map-land.webp')).toBe('bg/map-land');
  });

  it('names every picture the missions use', () => {
    const codes = new Set(Object.values(ART_NAMES));
    for (const m of MISSIONS) expect(codes, m.id).toContain(m.icon);
  });
});
