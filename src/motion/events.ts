/**
 * Единая модель событий игры. По ним Счётик меняет состояние, а звук и анимации знают, что произошло.
 * События — простые данные: их можно записать, повторить и проверить в тестах.
 */
export type VoiceEmotion = 'explain' | 'question' | 'praise' | 'support';

export type GameEvent =
  | { type: 'TASK_STARTED'; first: boolean }
  | { type: 'VOICE_STARTED'; emotion: VoiceEmotion }
  | { type: 'VOICE_FINISHED' }
  | { type: 'OBJECT_PICKED' }
  | { type: 'OBJECT_DROPPED'; hit: boolean }
  | { type: 'ANSWER_CORRECT'; final: boolean }
  | { type: 'ANSWER_INCORRECT' }
  | { type: 'HELP_REQUESTED'; level: number }
  | { type: 'MISSION_COMPLETED' }
  | { type: 'STICKER_AWARDED' }
  /** Ход времени: снимает временные состояния и замечает долгое ожидание. */
  | { type: 'TICK' };

type Listener = (e: GameEvent) => void;
const listeners = new Set<Listener>();

export function emit(e: GameEvent) {
  for (const l of listeners) l(e);
}

export function onGameEvent(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
