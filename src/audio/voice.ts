/**
 * Озвучка: сначала готовая запись из public/audio/<ключ>.mp3, иначе синтез речи браузера.
 * Список записанных фраз — public/audio/manifest.json. Чтобы заменить голос,
 * положите свои файлы с теми же именами (список фраз — public/audio/phrases.tsv).
 */
import { phraseKey } from './phraseKey';

let enabled = true;
let ruVoice: SpeechSynthesisVoice | null = null;
let recorded: Set<string> | null = null;
let current: HTMLAudioElement | null = null;

const BASE = `${import.meta.env.BASE_URL}audio/`;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

if (typeof fetch !== 'undefined' && typeof Audio !== 'undefined') {
  fetch(`${BASE}manifest.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((m: { files?: string[] } | null) => { recorded = new Set(m?.files ?? []); })
    .catch(() => { recorded = new Set(); });
}

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined' || typeof Audio !== 'undefined';
}

function synth(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  if (ruVoice) u.voice = ruVoice;
  u.rate = 0.92;
  u.pitch = 1.05;
  speechSynthesis.speak(u);
}

export function speak(text: string) {
  if (!enabled) return;
  stopSpeaking();
  const key = phraseKey(text);
  if (!recorded?.has(key)) {
    synth(text);
    return;
  }
  const a = new Audio(`${BASE}${key}.mp3`);
  current = a;
  // Нет файла или нет сети — читает синтез, ребёнок всё равно слышит задание.
  const fallback = () => { if (current === a) { current = null; synth(text); } };
  a.addEventListener('error', fallback, { once: true });
  a.play().catch((e: unknown) => {
    // Браузер запретил звук до первого касания — синтез тоже не сработает, молчим.
    if (e instanceof DOMException && e.name === 'NotAllowedError') return;
    fallback();
  });
}

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
