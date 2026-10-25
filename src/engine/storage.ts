import { DAY } from './progress';
import type { AppData, Attempt } from './types';

export const KEY = 'mathkids:v1';
/** Вчерашняя (или более ранняя) хорошая запись: ошибка в данных сегодня не затрёт её сразу. */
export const BACKUP_KEY = `${KEY}:backup`;
const BACKUP_AT_KEY = `${BACKUP_KEY}:at`;

export function emptyData(): AppData {
  return { version: 1, profiles: [], attempts: [], stickers: {}, settings: { voice: true } };
}

function isAttempt(a: unknown): a is Attempt {
  const x = a as Attempt | null;
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.missionId === 'string'
    && typeof x.at === 'number' && typeof x.correct === 'boolean';
}

/**
 * Проверяем форму, чтобы повреждённая запись не роняла приложение.
 * null — запись не прочитать (повреждена или от более новой версии): её нельзя перезаписывать пустой.
 */
export function parseData(raw: string | null): AppData | null {
  if (!raw) return emptyData();
  try {
    const d = JSON.parse(raw) as Partial<AppData>;
    if (!d || d.version !== 1 || !Array.isArray(d.profiles) || !Array.isArray(d.attempts)) return null;
    return {
      ...d,
      version: 1,
      profiles: d.profiles,
      attempts: d.attempts.filter(isAttempt),
      stickers: d.stickers ?? {},
      settings: { voice: d.settings?.voice ?? true },
    };
  } catch {
    return null;
  }
}

export type LoadIssue = null | 'restored' | 'unreadable';

/** Нечитаемая запись откладывается в отдельный ключ, а приложение берёт резервную копию или начинает с нуля. */
export function loadData(s: Storage = localStorage, now = Date.now()): { data: AppData; issue: LoadIssue } {
  try {
    const raw = s.getItem(KEY);
    const data = parseData(raw);
    if (data) return { data, issue: null };
    s.setItem(`${KEY}:broken-${now}`, raw!);
    const braw = s.getItem(BACKUP_KEY);
    const backup = braw ? parseData(braw) : null;
    if (backup) return { data: backup, issue: 'restored' };
    return { data: emptyData(), issue: 'unreadable' };
  } catch {
    return { data: emptyData(), issue: 'unreadable' };
  }
}

/** Возвращает false, если браузер не дал сохранить (приватный режим, переполнение). */
export function saveData(d: AppData, s: Storage = localStorage, now = Date.now()): boolean {
  try {
    const prev = s.getItem(KEY);
    const backupAt = Number(s.getItem(BACKUP_AT_KEY) ?? 0);
    if (prev && now - backupAt >= DAY && parseData(prev)) {
      try {
        s.setItem(BACKUP_KEY, prev);
        s.setItem(BACKUP_AT_KEY, String(now));
      } catch {
        // Нет места на копию — основная запись важнее.
      }
    }
    s.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

/** Файл резервной копии для взрослого: всё, что хранится на устройстве. */
export function exportJson(d: AppData): string {
  return JSON.stringify({ app: 'mathkids', exportedAt: new Date().toISOString(), data: d });
}

function union<T>(a: T[], b: T[], id: (x: T) => string): T[] {
  const seen = new Set(a.map(id));
  return [...a, ...b.filter((x) => !seen.has(id(x)) && seen.add(id(x)))];
}

/**
 * Восстановление из файла добавляет недостающее к текущим данным, ничего не удаляя.
 * null — файл не похож на резервную копию «Считалочки».
 */
export function importMerge(here: AppData, text: string): AppData | null {
  let inner: string;
  try {
    const f = JSON.parse(text) as { app?: string; data?: unknown };
    inner = JSON.stringify(f?.app === 'mathkids' ? f.data : f);
  } catch {
    return null;
  }
  const other = parseData(inner);
  if (!other) return null;
  const stickers = { ...here.stickers };
  for (const [pid, list] of Object.entries(other.stickers)) {
    stickers[pid] = union(stickers[pid] ?? [], list, (x) => x);
  }
  return {
    ...here,
    profiles: union(here.profiles, other.profiles, (p) => p.id),
    attempts: union(here.attempts, other.attempts, (a) => a.id),
    stickers,
  };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
