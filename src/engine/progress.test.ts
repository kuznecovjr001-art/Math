import { describe, expect, it } from 'vitest';
import {
  DAY, isIndependentSuccess, isReviewDue, probeReached, missionUnlocked, reviewDueAt, skillStatus, suggestMissions,
} from './progress';
import type { Attempt } from './types';

const T0 = new Date(2026, 9, 20, 10, 0).getTime();
let n = 0;
function att(p: Partial<Attempt>): Attempt {
  n += 1;
  return {
    id: `a${n}`, profileId: 'p', missionId: 'A01', cardId: 'x', variant: 'B', skill: 'M01',
    mode: 'probe', correct: true, helpLevel: 0, answer: '', at: T0, ...p,
  };
}

describe('skillStatus', () => {
  it('is none without attempts', () => {
    expect(skillStatus([], 'M01')).toBe('none');
  });

  it('is meeting when nothing is correct yet', () => {
    expect(skillStatus([att({ correct: false })], 'M01')).toBe('meeting');
  });

  it('does not count success after help as independent', () => {
    expect(skillStatus([att({ helpLevel: 2 })], 'M01')).toBe('withHelp');
  });

  it('does not count a learning-mode success as independent', () => {
    expect(skillStatus([att({ mode: 'learn', variant: 'A' })], 'M01')).toBe('withHelp');
  });

  it('needs successes on two different days to be solid', () => {
    const sameDay = [att({}), att({ at: T0 + 1000 }), att({ at: T0 + 2000 })];
    expect(skillStatus(sameDay, 'M01')).toBe('independent');
    const twoDays = [att({}), att({ at: T0 + 1000 }), att({ at: T0 + DAY })];
    expect(skillStatus(twoDays, 'M01')).toBe('solid');
  });

  it('is confirmed by an independent review after a pause', () => {
    const list = [
      att({}), att({ at: T0 + DAY }), att({ at: T0 + DAY + 1 }),
      att({ mode: 'review', variant: 'C', at: T0 + 4 * DAY }),
    ];
    expect(skillStatus(list, 'M01')).toBe('confirmed');
  });

  it('does not count an intermediate step of a card as a success', () => {
    expect(isIndependentSuccess(att({ partial: true }))).toBe(false);
    const parts = [att({ partial: true }), att({ partial: true, at: T0 + DAY }), att({ partial: true, at: T0 + DAY })];
    expect(skillStatus(parts, 'M01')).toBe('withHelp');
  });

  it('does not count a correct answer after a mistake on the same card as independent', () => {
    expect(isIndependentSuccess(att({ errorsBefore: 1 }))).toBe(false);
    expect(isIndependentSuccess(att({ errorsBefore: 0 }))).toBe(true);
    // Записи прошлой версии без поля считаются как раньше.
    expect(isIndependentSuccess(att({}))).toBe(true);
  });

  it('ignores other skills', () => {
    expect(skillStatus([att({ skill: 'M02' })], 'M01')).toBe('none');
  });
});

describe('missions', () => {
  it('opens the next mission once the probe was reached (author rule, not completion)', () => {
    expect(probeReached([att({ variant: 'A', mode: 'learn' })], 'A01')).toBe(false);
    expect(probeReached([att({ correct: false })], 'A01')).toBe(true);
  });

  it('does not suggest a reached but unfinished mission as done', () => {
    const missions = [{ id: 'A01', requires: [] }];
    expect(suggestMissions([att({})], missions, () => true, T0, 2, [])).toEqual([{ id: 'A01', reason: 'new' }]);
    expect(suggestMissions([att({})], missions, () => true, T0, 2, ['A01'])).toEqual([{ id: 'A01', reason: 'again' }]);
  });

  it('unlocks a mission after its prerequisites', () => {
    const m = { id: 'A02', requires: ['A01'] };
    expect(missionUnlocked([], m)).toBe(false);
    expect(missionUnlocked([att({})], m)).toBe(true);
  });

  it('schedules review one day after the first independent success', () => {
    const list = [att({})];
    expect(reviewDueAt(list, 'A01')).toBe(T0 + DAY);
    expect(isReviewDue(list, 'A01', T0 + DAY - 1)).toBe(false);
    expect(isReviewDue(list, 'A01', T0 + DAY)).toBe(true);
  });

  it('spaces later reviews further apart', () => {
    const list = [att({}), att({ mode: 'review', variant: 'C', at: T0 + DAY })];
    expect(reviewDueAt(list, 'A01')).toBe(T0 + DAY + 3 * DAY);
  });

  it('suggests due reviews before new missions', () => {
    const missions = [
      { id: 'A01', requires: [] },
      { id: 'A02', requires: ['A01'] },
      { id: 'A03', requires: ['A02'] },
    ];
    const open = (list: Attempt[]) => (id: string) =>
      missionUnlocked(list, missions.find((m) => m.id === id)!);
    expect(suggestMissions([], missions, open([]), T0)).toEqual([{ id: 'A01', reason: 'new' }]);
    const done = [att({})];
    const s = suggestMissions(done, missions, open(done), T0 + 2 * DAY);
    expect(s).toEqual([{ id: 'A01', reason: 'review' }, { id: 'A02', reason: 'new' }]);
  });
});
