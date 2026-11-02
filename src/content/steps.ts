import type { Variant } from '../engine/types';
import { extendCards, type Rng } from './generate';
import type { MissionLength } from './levels';
import type { CardParams, Mission } from './missions';

/** play — обучение и проба; review — повтор; again — «Ещё разок»: новая проба без обучения. */
export type PlayMode = 'play' | 'review' | 'again';

export interface Step {
  variant: Variant;
  index: number;
  params: CardParams;
  /** Карточка создана генератором, а не написана автором. */
  generated: boolean;
}

/**
 * Заход в миссию: сначала авторские карточки, потом сгенерированные по их образцу.
 * Авторские карточки обучения остаются первыми: на них построены подсказки.
 */
export function buildSteps(
  m: Mission, mode: PlayMode, len: MissionLength, rng: Rng, voiced?: (p: CardParams) => boolean,
): Step[] {
  const pool = [...m.cards.A, ...m.cards.B, ...m.cards.C];
  // Сгенерированная карточка не повторяет ни одну из этого захода и по возможности — авторские A и B.
  const own = new Set<string>([...m.cards.A, ...m.cards.B].map((p) => JSON.stringify(p)));
  const seen = new Set<string>(mode === 'play' ? own : []);
  const part = (v: Variant, authored: CardParams[], total: number): Step[] =>
    extendCards(authored, m.cards[v], pool, total, rng, seen, own, voiced).map((params, index) => ({
      variant: v, index, params, generated: index >= authored.length,
    }));

  if (mode === 'review') return part('C', m.cards.C, len.review);
  if (mode === 'again') return part('B', [], len.probe);
  return [...part('A', m.cards.A, len.learn), ...part('B', m.cards.B, len.probe)];
}
