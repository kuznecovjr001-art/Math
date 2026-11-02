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
    const { MISSIONS, instruction, voiceParts } = await import('../content/missions');
    const keys = new Set<string>(voiceKeys.keys);
    const texts = [...FIXED_PHRASES];
    for (const m of MISSIONS) {
      texts.push(m.praise, `${m.praise} ${m.finish}`, ...m.help);
      for (const p of [...m.cards.A, ...m.cards.B, ...m.cards.C]) texts.push(instruction(p), ...(m.helpFor?.(p) ?? []));
    }
    const missing = texts.flatMap(voiceParts).filter((t) => !keys.has(phraseKey(t)));
    expect(missing).toEqual([]);
  });
});

describe('похвала и поддержка', () => {
  it('не повторяют прошлую фразу подряд и берут все варианты', async () => {
    const { pickPhrase, PRAISE, SUPPORT } = await import('./phrases');
    for (const list of [PRAISE, SUPPORT]) {
      const seen = new Set<string>();
      let prev = '';
      for (let i = 0; i < 400; i++) {
        const p = pickPhrase(list);
        expect(p).not.toBe(prev);
        prev = p;
        seen.add(p);
      }
      expect(seen.size).toBe(list.length);
    }
  });

  it('поддержка не говорит «неправильно»', async () => {
    const { SUPPORT } = await import('./phrases');
    for (const s of SUPPORT) expect(s.toLowerCase()).not.toMatch(/неправ|ошиб|плохо/);
  });
});
