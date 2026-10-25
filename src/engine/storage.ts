import { DAY } from './progress';
import type { AppData, Attempt, Profile } from './types';

export const KEY = 'mathkids:v1';
/** Вчерашняя (или более ранняя) хорошая запись: ошибка в данных сегодня не затрёт её сразу. */
export const BACKUP_KEY = `${KEY}:backup`;
const BACKUP_AT_KEY = `${BACKUP_KEY}:at`;

export function emptyData(): AppData {
  return { version: 1, profiles: [], attempts: [], stickers: {}, settings: { voice: true } };
}

const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isAttempt(a: unknown): a is Attempt {
  const x = a as Attempt | null;
  return !!x && typeof x === 'object' && str(x.id) && str(x.profileId) && str(x.missionId) && str(x.cardId)
    && str(x.skill) && str(x.mode) && str(x.answer) && num(x.at) && typeof x.correct === 'boolean'
    && ['A', 'B', 'C'].includes(x.variant) && [0, 1, 2, 3].includes(x.helpLevel);
}

function isProfile(p: unknown): p is Profile {
  const x = p as Profile | null;
  return !!x && typeof x === 'object' && str(x.id) && str(x.name) && str(x.avatar) && num(x.createdAt)
    && (x.startIsland === undefined || num(x.startIsland));
}

function isStickers(s: unknown): s is Record<string, string[]> {
  return !!s && typeof s === 'object' && !Array.isArray(s)
    && Object.values(s).every((l) => Array.isArray(l) && l.every(str));
}

/**
 * Проверяем форму, чтобы повреждённая запись (или чужой файл) не роняла приложение.
 * null — запись не прочитать (повреждена или от более новой версии): её нельзя перезаписывать пустой.
 * Отдельные битые попытки отбрасываются, битые профили и наклейки делают всю запись нечитаемой.
 */
export function parseData(raw: string | null): AppData | null {
  if (!raw) return emptyData();
  try {
    const d = JSON.parse(raw) as Partial<AppData>;
    if (!d || d.version !== 1 || !Array.isArray(d.profiles) || !Array.isArray(d.attempts)) return null;
    if (!d.profiles.every(isProfile) || (d.stickers !== undefined && !isStickers(d.stickers))) return null;
    return {
      ...d,
      version: 1,
      profiles: d.profiles,
      attempts: d.attempts.filter(isAttempt),
      stickers: d.stickers ?? {},
      settings: { voice: d.settings?.voice !== false },
    };
  } catch {
    return null;
  }
}

/** restored — взята резервная копия; unreadable — начали с нуля; locked — отложить запись не удалось, сохранять нельзя. */
export type LoadIssue = null | 'restored' | 'unreadable' | 'locked';

const BROKEN_PREFIX = `${KEY}:broken-`;

/** Отложенные нечитаемые записи — их можно сохранить в файл из раздела для взрослых. */
export function brokenRecords(s: Storage = localStorage): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(BROKEN_PREFIX)) out.push(s.getItem(k) ?? '');
  }
  return out;
}

/** Нечитаемая запись откладывается в отдельный ключ, а приложение берёт резервную копию или начинает с нуля. */
export function loadData(s: Storage = localStorage, now = Date.now()): { data: AppData; issue: LoadIssue } {
  let raw: string | null;
  try {
    raw = s.getItem(KEY);
  } catch {
    return { data: emptyData(), issue: 'locked' };
  }
  const data = parseData(raw);
  if (data) return { data, issue: null };

  let setAside = brokenRecords(s).includes(raw!);
  if (!setAside) {
    try {
      s.setItem(`${BROKEN_PREFIX}${now}`, raw!);
      setAside = true;
    } catch {
      // Нет места: исходная запись остаётся в KEY, и перезаписывать её нельзя.
    }
  }
  const braw = s.getItem(BACKUP_KEY);
  const backup = braw ? parseData(braw) : null;
  if (!setAside) return { data: backup ?? emptyData(), issue: 'locked' };
  return backup ? { data: backup, issue: 'restored' } : { data: emptyData(), issue: 'unreadable' };
}

/** Возвращает false, если браузер не дал сохранить (приватный режим, переполнение). */
export function saveData(d: AppData, s: Storage = localStorage, now = Date.now()): boolean {
  try {
    const prev = s.getItem(KEY);
    s.setItem(KEY, JSON.stringify(d));
    const backupAt = Number(s.getItem(BACKUP_AT_KEY)) || 0;
    // Пустая запись не заменяет резервную копию: после сбоя копия — единственная история.
    if (prev && now - backupAt >= DAY && (parseData(prev)?.profiles.length ?? 0) > 0) {
      try {
        s.setItem(BACKUP_KEY, prev);
        s.setItem(BACKUP_AT_KEY, String(now));
      } catch {
        // Нет места на копию — основная запись важнее.
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Файл резервной копии для взрослого: всё, что хранится на устройстве. */
export function exportJson(d: AppData): string {
  return JSON.stringify({ app: 'mathkids', exportedAt: new Date().toISOString(), data: d });
}

/** Файл копии с историей за годы занимает единицы мегабайт; больше — не наш файл. */
const MAX_IMPORT = 20_000_000;

function union<T>(a: T[], b: T[], id: (x: T) => string): T[] {
  const seen = new Set(a.map(id));
  return [...a, ...b.filter((x) => !seen.has(id(x)) && seen.add(id(x)))];
}

/**
 * Восстановление из файла добавляет недостающее к текущим данным, ничего не удаляя.
 * null — файл не похож на резервную копию «Считалочки».
 */
export function importMerge(here: AppData, text: string): AppData | null {
  if (text.length > MAX_IMPORT) return null;
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
