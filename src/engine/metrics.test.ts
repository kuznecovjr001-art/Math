import { describe, expect, it } from 'vitest';
import { cardOutcomes, lastDays, share, summarize } from './metrics';
import { DAY } from './progress';
import type { Attempt, MissionSession } from './types';

const T0 = new Date(2026, 9, 20, 10, 0).getTime();
let n = 0;
function att(p: Partial<Attempt>): Attempt {
  n += 1;
  return {
    id: `a${n}`, profileId: 'p', missionId: 'A01', cardId: 'x', variant: 'B', skill: 'M01',
    mode: 'probe', correct: true, helpLevel: 0, answer: '', at: T0, sessionId: 's1', step: 0, errorsBefore: 0, ...p,
  };
}

describe('cardOutcomes', () => {
  it('tells apart first-try success, success after a mistake, with help and unsolved', () => {
    const list = [
      att({ step: 0 }),
      att({ step: 1, correct: false }), att({ step: 1, errorsBefore: 1 }),
      att({ step: 2, correct: false }), att({ step: 2, correct: false, errorsBefore: 1 }), att({ step: 2, helpLevel: 1, errorsBefore: 2 }),
      att({ step: 3, correct: false }),
      att({ step: 4, mode: 'learn', variant: 'A' }),
    ];
    expect(cardOutcomes(list).map((c) => c.outcome)).toEqual(['independent', 'afterError', 'withHelp', 'unsolved', 'learning']);
  });

  it('counts a multi-step card once, and only when its final step is solved', () => {
    expect(cardOutcomes([att({ partial: true }), att({})]).map((c) => c.outcome)).toEqual(['independent']);
    expect(cardOutcomes([att({ partial: true })]).map((c) => c.outcome)).toEqual(['unsolved']);
  });

  it('treats each legacy attempt (no session) as its own card', () => {
    const legacy = [att({ sessionId: undefined, step: undefined }), att({ sessionId: undefined, step: undefined })];
    expect(cardOutcomes(legacy)).toHaveLength(2);
  });
});

describe('summarize', () => {
  it('counts only the period and uses tried cards as the denominator', () => {
    const sessions: MissionSession[] = [
      { id: 's1', profileId: 'p', missionId: 'A01', mode: 'play', startedAt: T0, cards: 7, shown: 7, finishedAt: T0 + 1 },
      { id: 's2', profileId: 'p', missionId: 'A02', mode: 'play', startedAt: T0 + DAY, cards: 7, shown: 2 },
      { id: 'old', profileId: 'p', missionId: 'A01', mode: 'play', startedAt: T0 - 40 * DAY, cards: 7, shown: 7 },
    ];
    const list = [
      att({ step: 0 }), att({ step: 1, helpLevel: 2 }), att({ step: 2, mode: 'learn', variant: 'A' }),
      att({ sessionId: 's2', step: 0, at: T0 + DAY, correct: false }),
      att({ sessionId: 'old', at: T0 - 40 * DAY }),
      att({ sessionId: undefined, step: undefined, at: T0 + 2 }),
    ];
    const [from, to] = lastDays(T0 + DAY, 7);
    expect(summarize(list, sessions, from, to)).toEqual({
      activeDays: 2, shown: 9, legacyAnswers: 1, tried: 3, independent: 1, afterError: 0, withHelp: 1, unsolved: 1, learning: 1,
      sessionsStarted: 2, sessionsFinished: 1,
    });
  });

  it('keeps a card that crosses midnight in the day of its first answer', () => {
    const late = new Date(2026, 9, 20, 23, 59, 50).getTime();
    const list = [att({ sessionId: 'n', at: late, correct: false }), att({ sessionId: 'n', at: late + 20_000, errorsBefore: 1 })];
    const [from, to] = lastDays(late, 1);
    expect(summarize(list, [], from, to)).toMatchObject({ tried: 1, afterError: 1, unsolved: 0 });
    const [from2, to2] = lastDays(late + 20_000, 1);
    expect(summarize(list, [], from2, to2).tried).toBe(0);
  });

  it('is all zeros without data', () => {
    const s = summarize([], [], 0, T0);
    expect(Object.values(s).every((v) => v === 0)).toBe(true);
  });
});

describe('share', () => {
  it('hides percentages on a tiny sample', () => {
    expect(share(3, 4)).toBeNull();
    expect(share(7, 10)).toBe(70);
  });
});

describe('lastDays', () => {
  it('covers whole calendar days up to the end of today', () => {
    const [from, to] = lastDays(T0, 7);
    expect(new Date(to).getDate()).toBe(21);
    expect(new Date(from).getDate()).toBe(14);
  });
});
