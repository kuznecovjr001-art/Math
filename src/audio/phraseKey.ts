/**
 * Имя файла записи для фразы: FNV-1a от UTF-8 текста, 8 шестнадцатеричных знаков.
 * Такой же расчёт в scripts/voice-build.py — запись кладётся в public/audio/<ключ>.mp3.
 */
export function phraseKey(text: string): string {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text.trim())) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
