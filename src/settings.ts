/**
 * Настройки анимаций и звука. Хранятся отдельно от прогресса (mathkids:v1): сброс или перенос прогресса
 * их не трогает, а битые настройки не мешают читать историю ребёнка.
 */
export const SETTINGS_KEY = 'mathkids:settings:v1';

export interface Settings {
  /** full — все анимации; moderate — без фоновых движений; minimal — только смена состояний без движения. */
  motion: 'full' | 'moderate' | 'minimal';
  voice: boolean;
  /** Громкость речи 0…1. */
  voiceVolume: number;
  sfx: boolean;
  music: boolean;
  /** Фон острова двигается (облака, вода, листья). */
  ambient: boolean;
  parallax: boolean;
  /** Праздник в конце миссии: полный или спокойный. */
  celebrations: 'full' | 'calm';
}

export const DEFAULT_SETTINGS: Settings = {
  motion: 'full', voice: true, voiceVolume: 1, sfx: true, music: false,
  ambient: true, parallax: true, celebrations: 'full',
};

const pick = <T>(v: unknown, ok: (x: unknown) => boolean, d: T): T => (ok(v) ? (v as T) : d);
const isBool = (x: unknown) => typeof x === 'boolean';

export function loadSettings(s: Storage = localStorage): Settings {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(s.getItem(SETTINGS_KEY) ?? 'null') ?? {};
    // Первый запуск после обновления: голос раньше лежал в записи прогресса.
    if (s.getItem(SETTINGS_KEY) === null) {
      const old = JSON.parse(s.getItem('mathkids:v1') ?? 'null')?.settings?.voice;
      if (typeof old === 'boolean') raw = { voice: old };
    }
  } catch {
    raw = {};
  }
  const d = DEFAULT_SETTINGS;
  return {
    motion: pick(raw.motion, (x) => ['full', 'moderate', 'minimal'].includes(x as string), d.motion),
    voice: pick(raw.voice, isBool, d.voice),
    voiceVolume: pick(raw.voiceVolume, (x) => typeof x === 'number' && x >= 0 && x <= 1, d.voiceVolume),
    sfx: pick(raw.sfx, isBool, d.sfx),
    music: pick(raw.music, isBool, d.music),
    ambient: pick(raw.ambient, isBool, d.ambient),
    parallax: pick(raw.parallax, isBool, d.parallax),
    celebrations: pick(raw.celebrations, (x) => x === 'full' || x === 'calm', d.celebrations),
  };
}

export function saveSettings(v: Settings, s: Storage = localStorage): boolean {
  try {
    s.setItem(SETTINGS_KEY, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}
