import { isReviewDue, missionDone, probeReached, suggestMissions } from '../engine/progress';
import type { Attempt, MissionSession, Profile } from '../engine/types';
import { ISLANDS, islandOf, islandOpen, missionOpen, orderedMissions } from './levels';
import { getMission } from './missions';

export type Reason = 'review' | 'new' | 'again' | 'assigned';

/**
 * Ближайшая открытая миссия на пути к данной: она сама или первая непройденная предпосылка
 * (внутри острова — requires, для закрытого острова — ядро предыдущего). Задание взрослого
 * не перескакивает через учебный путь, а ведёт по нему.
 */
export function stepToward(attempts: Attempt[], id: string, startIsland: number): string {
  const island = islandOf(id);
  if (island > 0 && !islandOpen(attempts, island, startIsland)) {
    const core = ISLANDS[island - 1].core;
    return stepToward(attempts, core.find((c) => !probeReached(attempts, c)) ?? core[0], startIsland);
  }
  const r = getMission(id)!.requires.find((x) => !probeReached(attempts, x));
  return r ? stepToward(attempts, r, startIsland) : id;
}

/** Задание взрослого: что сделано после назначения и какая миссия ведёт к остальным. */
export function planStatus(p: Profile, attempts: Attempt[], sessions: MissionSession[]) {
  // Миссии, которых нет в этой версии (старая копия, переименование), пропускаем, а не падаем.
  return (p.plan ?? []).filter((id) => getMission(id)).map((id) => ({
    id,
    done: sessions.some((s) => s.missionId === id && s.finishedAt !== undefined && s.finishedAt >= (p.planAt?.[id] ?? Infinity)),
    next: stepToward(attempts, id, p.startIsland ?? 0),
  }));
}

/** Две миссии на сегодня по режиму, который выбрал взрослый. */
export function todaySuggestions(
  p: Profile, attempts: Attempt[], sessions: MissionSession[], stickers: string[], now: number, count = 2,
): { id: string; reason: Reason }[] {
  const ordered = orderedMissions();
  if (p.mode === 'review') {
    const done = ordered.filter((m) => missionDone(attempts, stickers, m.id));
    const due = done.filter((m) => isReviewDue(attempts, m.id, now));
    return [...due.map((m) => ({ id: m.id, reason: 'review' as const })),
      ...done.filter((m) => !due.includes(m)).map((m) => ({ id: m.id, reason: 'again' as const }))].slice(0, count);
  }
  const isOpen = (id: string) => missionOpen(attempts, getMission(id)!, p.startIsland ?? 0);
  if (p.mode === 'assigned') {
    const next = [...new Set(planStatus(p, attempts, sessions).filter((x) => !x.done).map((x) => x.next))];
    if (next.length > 0) return next.slice(0, count).map((id) => ({ id, reason: 'assigned' }));
  }
  return suggestMissions(attempts, ordered, isOpen, now, count, stickers);
}
