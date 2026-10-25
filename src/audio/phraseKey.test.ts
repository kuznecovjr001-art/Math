import { describe, expect, it } from 'vitest';
import manifest from '../../public/audio/manifest.json';
import { phraseKey } from './phraseKey';

describe('phraseKey', () => {
  it('matches the key the recording script uses', () => {
    // Значение посчитано так же, как в scripts/voice-build.py.
    expect(phraseKey('Получилось!')).toBe('e93230da');
    expect(phraseKey(' Получилось! ')).toBe('e93230da');
    expect(phraseKey('Привет! Поиграем?')).not.toBe('e93230da');
  });
});

describe('recorded voice', () => {
  it('has a recording for every fixed phrase', async () => {
    const { FIXED_PHRASES } = await import('./phrases');
    const files = new Set<string>(manifest.files);
    for (const t of FIXED_PHRASES) expect(files.has(phraseKey(t)), t).toBe(true);
  });
});
