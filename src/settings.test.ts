import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SETTINGS_KEY } from './settings';

function fakeStorage(init: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); }, clear: () => m.clear(),
  };
}

describe('settings', () => {
  it('uses defaults when nothing is stored', () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('takes the voice switch from the old progress record once', () => {
    const s = fakeStorage({ 'mathkids:v1': JSON.stringify({ version: 1, settings: { voice: false } }) });
    expect(loadSettings(s).voice).toBe(false);
  });

  it('keeps known values and ignores broken or unknown ones', () => {
    const s = fakeStorage({ [SETTINGS_KEY]: JSON.stringify({ motion: 'minimal', voiceVolume: 7, sfx: 'yes', extra: 1 }) });
    expect(loadSettings(s)).toEqual({ ...DEFAULT_SETTINGS, motion: 'minimal' });
    expect(loadSettings(fakeStorage({ [SETTINGS_KEY]: '{broken' }))).toEqual(DEFAULT_SETTINGS);
  });

  it('saves to its own key, not into the progress record', () => {
    const s = fakeStorage();
    saveSettings({ ...DEFAULT_SETTINGS, music: true }, s);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!).music).toBe(true);
    expect(s.getItem('mathkids:v1')).toBeNull();
  });
});
