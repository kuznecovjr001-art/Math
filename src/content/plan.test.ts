import { describe, expect, it } from 'vitest';
import { DAY } from '../engine/progress';
import type { Attempt, MissionSession, Profile } from '../engine/types';
import { planStatus, stepToward, todaySuggestions } from './plan';

const T0 = new Date(2026, 9, 20, 10, 0).getTime();
let n = 0;
/** Ребёнок дошёл до пробы миссии (по правилу открытия). */
function reached(missionId: string, at = T0): Attempt {
  n += 1;
  return {
    id: `a${n}`, profileId: 'p', missionId, cardId: 'x', variant: 'B', skill: 'M01',
    mode: 'probe', correct: true, helpLevel: 0, answer: '', at, sessionId: `s${n}`, step: 0, errorsBefore: 0,
  };
}
function finished(missionId: string, at: number): MissionSession {
  return { id: `f${missionId}${at}`, profileId: 'p', missionId, mode: 'play', startedAt: at - 1000, cards: 7, shown: 7, finishedAt: at };
}
const kid = (p: Partial<Profile> = {}): Profile => ({ id: 'p', name: '', avatar: '1F431', createdAt: 0, ...p });

describe('stepToward', () => {
  it('is the mission itself when it is open', () => {
    expect(stepToward([], 'A01', 0)).toBe('A01');
  });

  it('walks back through prerequisites inside the island', () => {
    expect(stepToward([], 'N01', 0)).toBe('A01');
    expect(stepToward([reached('A01')], 'N01', 0)).toBe('A02');
  });

  it('walks back to the core of the previous island when the island is closed', () => {
    expect(stepToward([], 'N03', 0)).toBe('A01');
    expect(stepToward([], 'N03', 1)).toBe('A03');
  });
});

describe('planStatus', () => {
  it('marks a mission done only when finished after the plan was set', () => {
    const p = kid({ mode: 'assigned', plan: ['A01', 'A02'], planSince: T0 });
    const s = [finished('A01', T0 - DAY), finished('A02', T0 + 1)];
    expect(planStatus(p, [reached('A01')], s)).toEqual([
      { id: 'A01', done: false, next: 'A01' },
      { id: 'A02', done: true, next: 'A02' },
    ]);
  });

  it('names the open step that leads to a locked assigned mission', () => {
    const p = kid({ mode: 'assigned', plan: ['N01'], planSince: T0 });
    expect(planStatus(p, [], [])).toEqual([{ id: 'N01', done: false, next: 'A01' }]);
  });
});

describe('todaySuggestions', () => {
  it('offers the next assigned steps first, without duplicates', () => {
    const p = kid({ mode: 'assigned', plan: ['N01', 'A02'], planSince: T0 });
    expect(todaySuggestions(p, [], [], [], T0)).toEqual([{ id: 'A01', reason: 'assigned' }]);
    const att = [reached('A01')];
    expect(todaySuggestions(p, att, [], [], T0)).toEqual([{ id: 'A02', reason: 'assigned' }]);
  });

  it('falls back to free choice when the plan is done', () => {
    const p = kid({ mode: 'assigned', plan: ['A01'], planSince: T0 });
    const s = todaySuggestions(p, [reached('A01')], [finished('A01', T0 + 1)], ['A01'], T0 + 2);
    expect(s.map((x) => x.reason)).not.toContain('assigned');
    expect(s.length).toBeGreaterThan(0);
  });

  it('in review mode offers only already finished missions, due ones first', () => {
    const p = kid({ mode: 'review' });
    const att = [reached('A01', T0), reached('A02', T0 + 5 * DAY)];
    const s = todaySuggestions(p, att, [], ['A01', 'A02'], T0 + 5 * DAY + 1);
    expect(s).toEqual([{ id: 'A01', reason: 'review' }, { id: 'A02', reason: 'again' }]);
    expect(todaySuggestions(p, [], [], [], T0)).toEqual([]);
  });

  it('free mode keeps the previous behaviour', () => {
    expect(todaySuggestions(kid(), [], [], [], T0)).toEqual([{ id: 'A01', reason: 'new' }, { id: 'N09', reason: 'new' }]);
  });
});
