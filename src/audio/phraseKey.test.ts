import { describe, expect, it } from 'vitest';
import voiceKeys from './voice-keys.json';
import { phraseKey } from './phraseKey';

describe('phraseKey', () => {
  it('is a stable FNV-1a hash of the trimmed text', () => {
    expect(phraseKey('Получилось!')).toBe('e93230da');
    expect(phraseKey(' Получилось! ')).toBe('e93230da');
    expect(phraseKey('Привет! Поиграем?')).not.toBe('e93230da');
  });
});

describe('recorded voice', () => {
  // До первой сборки голоса (tts/build_voice.py) список пуст — проверять нечего.
  it.skipIf(voiceKeys.keys.length === 0)('has a recording for every fixed phrase and every authored card', async () => {
    const { FIXED_PHRASES } = await import('./phrases');
    const { MISSIONS, instruction, voiceText } = await import('../content/missions');
    const keys = new Set<string>(voiceKeys.keys);
    const texts = [...FIXED_PHRASES];
    for (const m of MISSIONS) {
      texts.push(m.praise, `${m.praise} ${m.finish}`, ...m.help);
      for (const p of [...m.cards.A, ...m.cards.B, ...m.cards.C]) texts.push(instruction(p), ...(m.helpFor?.(p) ?? []));
    }
    const missing = texts.map(voiceText).filter((t) => !keys.has(phraseKey(t)));
    expect(missing).toEqual([]);
  });
});
