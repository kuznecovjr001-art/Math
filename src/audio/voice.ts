/**
 * Озвучка инструкций через синтез речи браузера.
 * Это временное решение: по материалам проекта финальные фразы
 * записываются заранее и проверяются на слух.
 */
let enabled = true;
let ruVoice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function speak(text: string) {
  if (!enabled || !canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  if (ruVoice) u.voice = ruVoice;
  u.rate = 0.92;
  u.pitch = 1.05;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}
