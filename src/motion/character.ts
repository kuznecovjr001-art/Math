import type { GameEvent } from './events';

/** Состояния Счётика. Нарисованных поз пять — остальные состояния отличаются движением (docs/MOTION_SYSTEM.md). */
export type Mood =
  | 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'helping'
  | 'happy' | 'encourage' | 'pointing' | 'celebrating' | 'sleeping';

export interface CharacterState {
  mood: Mood;
  /** Временное состояние держится до этого момента; потом — базовое. */
  until: number;
  priority: number;
  voice: boolean;
  inTask: boolean;
  lastActivity: number;
}

export const CHARACTER_IDLE: CharacterState = {
  mood: 'idle', until: 0, priority: 0, voice: false, inTask: false, lastActivity: 0,
};

/** Приоритет и длительность временных реакций: более важная не перебивается менее важной. */
const REACTION: Partial<Record<Mood, { priority: number; ms: number }>> = {
  celebrating: { priority: 5, ms: 2500 },
  happy: { priority: 4, ms: 1200 },
  encourage: { priority: 3, ms: 1400 },
  helping: { priority: 3, ms: 2500 },
  greeting: { priority: 2, ms: 1500 },
  pointing: { priority: 2, ms: 1200 },
};

/** Без касаний столько времени — задумался, потом задремал. Пороги пилотные. */
export const THINK_AFTER_MS = 20_000;
export const SLEEP_AFTER_MS = 90_000;

function base(s: CharacterState, now: number): Mood {
  if (s.voice) return 'speaking';
  if (!s.inTask) return 'idle';
  const quiet = now - s.lastActivity;
  return quiet >= SLEEP_AFTER_MS ? 'sleeping' : quiet >= THINK_AFTER_MS ? 'thinking' : 'listening';
}

function react(s: CharacterState, mood: Mood, now: number, ms?: number): CharacterState {
  const r = REACTION[mood]!;
  const busy = now < s.until && s.priority > r.priority;
  return busy ? s : { ...s, mood, priority: r.priority, until: now + (ms ?? r.ms) };
}

function settle(s: CharacterState, now: number): CharacterState {
  return now < s.until ? s : { ...s, mood: base(s, now), priority: 0, until: 0 };
}

/** Чистая функция: следующее состояние по событию. Таймеры и React — снаружи (useCharacter). */
export function characterStep(prev: CharacterState, e: GameEvent, now: number): CharacterState {
  const active = { ...prev, lastActivity: now };
  switch (e.type) {
    case 'TICK': return settle(prev, now);
    case 'TASK_STARTED': {
      const s = settle({ ...active, inTask: true, until: 0, priority: 0 }, now);
      return e.first ? react(s, 'greeting', now) : s;
    }
    case 'VOICE_STARTED': return settle({ ...prev, voice: true }, now);
    case 'VOICE_FINISHED': return settle({ ...prev, voice: false }, now);
    case 'OBJECT_PICKED': return settle(active, now);
    case 'OBJECT_DROPPED': return e.hit ? settle(active, now) : react(active, 'pointing', now);
    case 'ANSWER_CORRECT': return react(active, 'happy', now, e.final ? undefined : 700);
    case 'ANSWER_INCORRECT': return react(active, 'encourage', now);
    case 'HELP_REQUESTED': return react(active, 'helping', now);
    case 'MISSION_COMPLETED':
    case 'STICKER_AWARDED': return react({ ...active, inTask: false }, 'celebrating', now);
  }
}

/** Какой из нарисованных рисунков показывать. Сон и приветствие пока без своих рисунков — см. ТЗ на слои. */
export function poseOf(m: Mood): 'idle' | 'talk' | 'help' | 'happy' | 'think' {
  switch (m) {
    case 'speaking': return 'talk';
    case 'helping': case 'pointing': return 'help';
    case 'happy': case 'celebrating': return 'happy';
    case 'thinking': case 'encourage': return 'think';
    default: return 'idle';
  }
}
