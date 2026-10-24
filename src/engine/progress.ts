import type { Attempt, SkillId, SkillStatus } from './types';

export const DAY = 24 * 60 * 60 * 1000;

/**
 * Интервалы повтора миссии в днях после самостоятельного успеха.
 * Это стартовые настройки для пилота, а не доказанная норма.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14];

/** Сколько самостоятельных успехов и в сколько разных дней нужно для «уверенно». */
export const SOLID_SUCCESSES = 3;
export const SOLID_DAYS = 2;
/** Пауза, после которой успех в повторе подтверждает навык. */
export const CONFIRM_PAUSE_DAYS = 3;

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Самостоятельный успех: верно, без помощи, не в режиме обучения. */
export function isIndependentSuccess(a: Attempt): boolean {
  return a.correct && a.helpLevel === 0 && a.mode !== 'learn';
}

export function skillStatus(attempts: Attempt[], skill: SkillId): SkillStatus {
  const own = attempts.filter((a) => a.skill === skill);
  if (own.length === 0) return 'none';

  const independent = own.filter(isIndependentSuccess).sort((x, y) => x.at - y.at);
  if (independent.length === 0) {
    return own.some((a) => a.correct) ? 'withHelp' : 'meeting';
  }

  const days = new Set(independent.map((a) => dayKey(a.at)));
  const solid = independent.length >= SOLID_SUCCESSES && days.size >= SOLID_DAYS;
  if (!solid) return 'independent';

  const first = independent[0].at;
  const confirmed = independent.some(
    (a) => a.mode === 'review' && a.at - first >= CONFIRM_PAUSE_DAYS * DAY,
  );
  return confirmed ? 'confirmed' : 'solid';
}

export const STATUS_ORDER: SkillStatus[] = [
  'none', 'meeting', 'withHelp', 'independent', 'solid', 'confirmed',
];

export function statusAtLeast(s: SkillStatus, min: SkillStatus): boolean {
  return STATUS_ORDER.indexOf(s) >= STATUS_ORDER.indexOf(min);
}

/** Миссия пройдена, если ребёнок дошёл до самостоятельной пробы. */
export function missionCompleted(attempts: Attempt[], missionId: string): boolean {
  return attempts.some((a) => a.missionId === missionId && a.variant !== 'A');
}

/**
 * Когда миссию пора повторить. null — миссия ещё не пройдена
 * или пока нет самостоятельного успеха, от которого считать паузу.
 */
export function reviewDueAt(attempts: Attempt[], missionId: string): number | null {
  const own = attempts.filter((a) => a.missionId === missionId);
  const successes = own.filter(isIndependentSuccess).sort((x, y) => x.at - y.at);
  if (successes.length === 0) return null;
  const reviewsDone = successes.filter((a) => a.mode === 'review').length;
  const interval = REVIEW_INTERVALS_DAYS[Math.min(reviewsDone, REVIEW_INTERVALS_DAYS.length - 1)];
  const last = successes[successes.length - 1].at;
  return last + interval * DAY;
}

export function isReviewDue(attempts: Attempt[], missionId: string, now: number): boolean {
  const due = reviewDueAt(attempts, missionId);
  return due !== null && due <= now;
}

export interface MissionRef {
  id: string;
  requires: string[];
}

export function missionUnlocked(attempts: Attempt[], m: MissionRef): boolean {
  return m.requires.every((r) => missionCompleted(attempts, r));
}

/**
 * Предлагаем ребёнку две миссии: сначала то, что пора повторить,
 * затем новые открытые, затем любые пройденные.
 */
export function suggestMissions(
  attempts: Attempt[],
  missions: { id: string }[],
  isOpen: (id: string) => boolean,
  now: number,
  count = 2,
): { id: string; reason: 'review' | 'new' | 'again' }[] {
  const out: { id: string; reason: 'review' | 'new' | 'again' }[] = [];
  const push = (id: string, reason: 'review' | 'new' | 'again') => {
    if (out.length < count && !out.some((o) => o.id === id)) out.push({ id, reason });
  };
  for (const m of missions) if (isReviewDue(attempts, m.id, now)) push(m.id, 'review');
  for (const m of missions) {
    if (isOpen(m.id) && !missionCompleted(attempts, m.id)) push(m.id, 'new');
  }
  for (const m of missions) if (missionCompleted(attempts, m.id)) push(m.id, 'again');
  return out;
}
