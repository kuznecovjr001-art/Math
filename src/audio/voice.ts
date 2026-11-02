/**
 * Голос Счётика — только заранее записанные фразы (public/voice, конвейер — docs/VOICE_PIPELINE.md).
 *
 * - Одна фраза за раз: новая останавливает предыдущую.
 * - speak() завершается, когда запись действительно доиграла, её остановили или файл не открылся —
 *   игра может ждать голос, но никогда не зависает из-за него.
 * - Фраза без записи не подменяется синтезом речи: она пропускается (текст на экране) и попадает в missing().
 * - VOICE_STARTED / VOICE_FINISHED уходят в общую шину событий: по ним говорит Счётик.
 */
import { emit, type VoiceEmotion } from '../motion/events';
import { phraseKey } from './phraseKey';

export interface Clip {
  volume: number;
  addEventListener(type: 'playing' | 'ended' | 'error', h: () => void): void;
  play(): Promise<void>;
  pause(): void;
}

interface Deps {
  recorded: Set<string>;
  url: (key: string) => string;
  clip: (src: string) => Clip;
  key: (text: string) => string;
}

export function createVoice(d: Deps) {
  let enabled = true;
  let volume = 1;
  let current: { clip: Clip; finish: () => void } | null = null;
  let generation = 0;
  const missing = new Set<string>();

  function stop() {
    generation++;
    const c = current;
    current = null;
    if (c) {
      c.clip.pause();
      c.finish();
    }
  }

  function speak(text: string, emotion: VoiceEmotion = 'explain'): Promise<void> {
    stop();
    const key = d.key(text);
    if (!enabled) return Promise.resolve();
    if (!d.recorded.has(key)) {
      missing.add(text);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const clip = d.clip(d.url(key));
      clip.volume = volume;
      let started = false;
      let over = false;
      const finish = () => {
        if (over) return;
        over = true;
        if (current?.clip === clip) current = null;
        if (started) emit({ type: 'VOICE_FINISHED' });
        resolve();
      };
      current = { clip, finish };
      clip.addEventListener('playing', () => {
        if (!started && !over) {
          started = true;
          emit({ type: 'VOICE_STARTED', emotion });
        }
      });
      clip.addEventListener('ended', finish);
      clip.addEventListener('error', finish);
      // Браузер может запретить звук до первого касания — тогда просто молчим.
      clip.play().catch(finish);
    });
  }

  /** Несколько фраз подряд с паузой; любая новая фраза или остановка прерывает всю очередь. */
  async function speakAll(texts: string[], gapMs = 250, emotion: VoiceEmotion = 'explain') {
    for (const [i, t] of texts.entries()) {
      const p = speak(t, emotion);
      const mine = generation;
      await p;
      if (i === texts.length - 1) return;
      await new Promise((r) => setTimeout(r, gapMs));
      if (generation !== mine) return;
    }
  }

  return {
    speak,
    speakAll,
    stop,
    setEnabled(on: boolean) { enabled = on; if (!on) stop(); },
    setVolume(v: number) { volume = v; if (current) current.clip.volume = v; },
    missing: () => [...missing],
    has: (text: string) => d.recorded.has(d.key(text)),
  };
}

const BASE = `${import.meta.env.BASE_URL}voice/`;

/** Список озвученных фраз (tts/build_voice.py) — отдельный чанк, грузится сразу после старта, не в первом экране. */
interface VoiceKeys { version: number; voice: string; keys: string[] }
const recorded = new Set<string>();
let voiceName = '';
export const voiceKeysLoaded: Promise<void> = import('./voice-keys.json')
  .then((m) => {
    const v = (m.default ?? m) as VoiceKeys;
    voiceName = v.voice;
    v.keys.forEach((k) => recorded.add(k));
  })
  .catch(() => undefined);

const voice = createVoice({
  recorded,
  url: (key) => `${BASE}${voiceName}/${key}.ogg`,
  clip: (src) => new Audio(src),
  key: phraseKey,
});

export const speak = voice.speak;
export const speakAll = voice.speakAll;
export const stopSpeaking = voice.stop;
export const setVoiceEnabled = voice.setEnabled;
export const setVoiceVolume = voice.setVolume;
export const hasRecording = voice.has;
export const missingPhrases = voice.missing;
/** Есть ли записи (до первой сборки голоса — нет, и генератор не ограничивается). */
export const voiceReady = () => recorded.size > 0;
