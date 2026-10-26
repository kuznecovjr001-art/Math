/** Короткие мягкие звуки без файлов: работают офлайн. */
import type { GameEvent } from '../motion/events';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.12) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  pop: () => tone(660, 0, 0.12, 0.08),
  back: () => tone(440, 0, 0.1, 0.06),
  good: () => {
    tone(523, 0, 0.18);
    tone(659, 0.12, 0.18);
    tone(784, 0.24, 0.3);
  },
  /** Не «ошибка», а мягкое «давай проверим». */
  soft: () => tone(392, 0, 0.25, 0.07),
  /** Верный промежуточный шаг: тише и короче, чем ответ на карточку. */
  tick: () => tone(784, 0, 0.1, 0.06),
  /** Конец миссии: спокойное восходящее арпеджио, без фанфар. */
  reward: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, 0.09)),
  /** Наклейка в альбом. */
  sticker: () => { tone(1175, 0, 0.15, 0.06); tone(1568, 0.1, 0.25, 0.05); },
};

/** Звуки отвечают на события игры (motion/events), а не вызываются из каждого экрана. */
export function sfxForEvent(e: GameEvent) {
  switch (e.type) {
    case 'ANSWER_CORRECT': return e.final ? sfx.good() : sfx.tick();
    case 'ANSWER_INCORRECT': return sfx.soft();
    case 'MISSION_COMPLETED': return sfx.reward();
    case 'STICKER_AWARDED': return sfx.sticker();
  }
}
