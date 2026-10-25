import { dayKey } from './progress';
import type { Attempt, MissionSession } from './types';

/**
 * Итог одной карточки (экземпляра в заходе). Формулы — docs/progress-contract.md.
 * learning — карточка обучения (A), в самостоятельность не входит.
 */
export type CardOutcome = 'learning' | 'independent' | 'afterError' | 'withHelp' | 'unsolved';

/** Записи до 2026-10 не знают заход и номер карточки: каждая попытка — своя карточка. */
function cardKey(a: Attempt): string {
  return a.sessionId !== undefined && a.step !== undefined ? `${a.sessionId}:${a.step}` : `legacy:${a.id}`;
}

export function cardOutcomes(attempts: Attempt[]): { key: string; missionId: string; at: number; outcome: CardOutcome }[] {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const k = cardKey(a);
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return [...groups].map(([key, list]) => {
    const first = list[0];
    const solved = list.some((a) => a.correct && !a.partial);
    const wrong = list.some((a) => !a.correct || (a.errorsBefore ?? 0) > 0);
    const helped = list.some((a) => a.helpLevel > 0);
    const outcome: CardOutcome = first.mode === 'learn' ? 'learning'
      : !solved ? 'unsolved'
      : helped ? 'withHelp'
      : wrong ? 'afterError'
      : 'independent';
    return { key, missionId: first.missionId, at: Math.min(...list.map((a) => a.at)), outcome };
  });
}

export interface PeriodSummary {
  /** Дни, когда ребёнок отвечал хотя бы на одну карточку. */
  activeDays: number;
  /** Показанные карточки (по заходам; у записей до 2026-10 не известны). */
  shown: number;
  /** Ответы из истории до 2026-10: в доли не входят, экземпляр карточки у них неизвестен. */
  legacyAnswers: number;
  /** Карточки с хотя бы одним ответом, без обучения. Знаменатель долей ниже. */
  tried: number;
  independent: number;
  afterError: number;
  withHelp: number;
  unsolved: number;
  learning: number;
  sessionsStarted: number;
  sessionsFinished: number;
}

/** Ниже этого знаменателя доли не показываем: слишком мало ответов, чтобы делать выводы. */
export const MIN_SAMPLE = 10;

export function summarize(attempts: Attempt[], sessions: MissionSession[], from: number, to: number): PeriodSummary {
  const inRange = (t: number) => t >= from && t < to;
  // Карточка попадает в период по первому ответу целиком, даже если ответы перешли через полночь.
  const cards = cardOutcomes(attempts.filter((a) => a.sessionId !== undefined)).filter((c) => inRange(c.at));
  const count = (o: CardOutcome) => cards.filter((c) => c.outcome === o).length;
  const ss = sessions.filter((s) => inRange(s.startedAt));
  return {
    activeDays: new Set(attempts.filter((a) => inRange(a.at)).map((a) => dayKey(a.at))).size,
    shown: ss.reduce((n, s) => n + s.shown, 0),
    legacyAnswers: attempts.filter((a) => a.sessionId === undefined && inRange(a.at)).length,
    tried: cards.length - count('learning'),
    independent: count('independent'),
    afterError: count('afterError'),
    withHelp: count('withHelp'),
    unsolved: count('unsolved'),
    learning: count('learning'),
    sessionsStarted: ss.length,
    sessionsFinished: ss.filter((s) => s.finishedAt !== undefined).length,
  };
}

/** Доля в процентах или null, если ответов меньше MIN_SAMPLE. */
export function share(part: number, total: number): number | null {
  return total >= MIN_SAMPLE ? Math.round((100 * part) / total) : null;
}

/** Последние n дней, включая сегодняшний: [начало первого дня, конец сегодняшнего). */
export function lastDays(now: number, n: number): [number, number] {
  const d = new Date(now);
  const at = (shift: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + shift).getTime();
  return [at(1 - n), at(1)];
}
