import { describe, expect, it } from 'vitest';
import { emptyData, exportJson, importMerge, loadData, parseData, saveData, BACKUP_KEY, KEY } from './storage';
import type { AppData } from './types';

function fakeStorage(init: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
  };
}

const T0 = new Date(2026, 9, 20, 10, 0).getTime();

function sample(): AppData {
  return {
    ...emptyData(),
    profiles: [{ id: 'p1', name: 'Аня', avatar: '1F431', createdAt: T0 }],
    attempts: [{
      id: 'a1', profileId: 'p1', missionId: 'A01', cardId: 'A01-A01-A-v1', variant: 'A', skill: 'M01',
      mode: 'learn', correct: true, helpLevel: 0, answer: '3', at: T0,
    }],
    stickers: { p1: ['A01'] },
  };
}

describe('parseData', () => {
  it('reads a v1 record written by the previous version unchanged', () => {
    const d = sample();
    expect(parseData(JSON.stringify(d))).toEqual(d);
  });

  it('returns null for unreadable or newer records instead of empty data', () => {
    expect(parseData('{broken')).toBeNull();
    expect(parseData(JSON.stringify({ ...sample(), version: 2 }))).toBeNull();
    expect(parseData(JSON.stringify({ version: 1, profiles: 'x' }))).toBeNull();
  });

  it('drops malformed attempts but keeps the rest of the history', () => {
    const d = sample();
    const raw = JSON.stringify({ ...d, attempts: [...d.attempts, null, { id: 'z' }] });
    expect(parseData(raw)?.attempts).toEqual(d.attempts);
  });
});

describe('loadData', () => {
  it('starts empty when nothing is stored', () => {
    expect(loadData(fakeStorage())).toEqual({ data: emptyData(), issue: null });
  });

  it('keeps an unreadable record aside and restores the backup', () => {
    const backup = JSON.stringify(sample());
    const s = fakeStorage({ [KEY]: '{broken', [BACKUP_KEY]: backup });
    const r = loadData(s, T0);
    expect(r.issue).toBe('restored');
    expect(r.data).toEqual(sample());
    expect(s.getItem(`${KEY}:broken-${T0}`)).toBe('{broken');
  });

  it('keeps an unreadable record aside even without a backup', () => {
    const s = fakeStorage({ [KEY]: '{broken' });
    const r = loadData(s, T0);
    expect(r).toEqual({ data: emptyData(), issue: 'unreadable' });
    expect(s.getItem(`${KEY}:broken-${T0}`)).toBe('{broken');
  });
});

describe('saveData', () => {
  it('copies the previous good record to the backup once a day', () => {
    const s = fakeStorage();
    const d1 = sample();
    expect(saveData(d1, s, T0)).toBe(true);
    const d2 = { ...d1, stickers: { p1: ['A01', 'A02'] } };
    saveData(d2, s, T0 + 1000);
    expect(JSON.parse(s.getItem(BACKUP_KEY)!)).toEqual(d1);
    saveData({ ...d2, stickers: {} }, s, T0 + 2000);
    // Через секунду резервная копия не переписывается: ошибка в данных не успеет затереть хорошую копию.
    expect(JSON.parse(s.getItem(BACKUP_KEY)!)).toEqual(d1);
    saveData(d2, s, T0 + 25 * 3600 * 1000);
    expect(JSON.parse(s.getItem(BACKUP_KEY)!)).toEqual({ ...d2, stickers: {} });
  });

  it('reports failure when storage refuses to write', () => {
    const s = fakeStorage();
    s.setItem = () => { throw new Error('quota'); };
    expect(saveData(sample(), s, T0)).toBe(false);
  });
});

describe('export and import', () => {
  it('round-trips through the export file', () => {
    expect(importMerge(emptyData(), exportJson(sample()))).toEqual(sample());
  });

  it('merges into existing data without losing anything', () => {
    const here = sample();
    const other: AppData = {
      ...emptyData(),
      profiles: [{ id: 'p2', name: 'Петя', avatar: '1F436', createdAt: T0 }, here.profiles[0]],
      attempts: [{ ...here.attempts[0], id: 'a2', profileId: 'p2' }, here.attempts[0]],
      stickers: { p1: ['A02'], p2: ['A01'] },
    };
    const m = importMerge(here, exportJson(other))!;
    expect(m.profiles.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(m.attempts.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(m.stickers).toEqual({ p1: ['A01', 'A02'], p2: ['A01'] });
    expect(m.settings).toEqual(here.settings);
  });

  it('rejects a file that is not a backup', () => {
    expect(importMerge(sample(), 'hello')).toBeNull();
  });
});
