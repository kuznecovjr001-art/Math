import type { AppData } from './types';

const KEY = 'mathkids:v1';

export function emptyData(): AppData {
  return { version: 1, profiles: [], attempts: [], stickers: {}, settings: { voice: true } };
}

/** Проверяем форму, чтобы повреждённая запись не роняла приложение. */
export function parseData(raw: string | null): AppData {
  if (!raw) return emptyData();
  try {
    const d = JSON.parse(raw) as Partial<AppData>;
    if (d.version !== 1 || !Array.isArray(d.profiles) || !Array.isArray(d.attempts)) {
      return emptyData();
    }
    return {
      version: 1,
      profiles: d.profiles,
      attempts: d.attempts,
      stickers: d.stickers ?? {},
      settings: { voice: d.settings?.voice ?? true },
    };
  } catch {
    return emptyData();
  }
}

export function loadData(): AppData {
  try {
    return parseData(localStorage.getItem(KEY));
  } catch {
    return emptyData();
  }
}

/** Возвращает false, если браузер не дал сохранить (приватный режим, переполнение). */
export function saveData(d: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
