import { useState } from 'react';
import type { HelpLevel } from '../engine/types';

export interface GameResult {
  correct: boolean;
  answer: string;
  /** false — это промежуточный шаг карточки (например, раскладка до вопроса об итоге). */
  final?: boolean;
  /** Вопрос следующего шага, если final === false. */
  next?: string;
  /** Верный ответ: столько мс игра показывает разбор (лягушка допрыгивает и т. п.), прежде чем перейти дальше. */
  showMs?: number;
}

/**
 * Решено ли: после верного ответа игра показывает разбор (вместо «?» — ответ) и просит на это время showMs.
 * Возвращает флаг и обёртку над onSubmit.
 */
export function useSolved(onSubmit: (r: GameResult) => void, showMs = 900): [boolean, (r: GameResult) => void] {
  const [solved, setSolved] = useState(false);
  return [solved, (r) => {
    if (r.correct && r.final !== false) setSolved(true);
    onSubmit(r.correct && r.final !== false ? { ...r, showMs: r.showMs ?? showMs } : r);
  }];
}

export interface GameProps<P> {
  params: P;
  help: HelpLevel;
  /** Пока идёт реакция на ответ, повторный ответ не принимается. */
  locked: boolean;
  onSubmit: (r: GameResult) => void;
}

/** Три варианта ответа: правильный и соседние, порядок зависит от ответа, не от случая. */
export function answerChoices(answer: number, min = 1): number[] {
  const set = new Set([answer]);
  for (const d of [1, -1, 2, -2]) {
    if (set.size >= 3) break;
    if (answer + d >= min) set.add(answer + d);
  }
  const arr = [...set].sort((a, b) => a - b);
  // Правильный ответ не всегда посередине.
  const shift = answer % 3;
  return arr.slice(shift).concat(arr.slice(0, shift));
}
