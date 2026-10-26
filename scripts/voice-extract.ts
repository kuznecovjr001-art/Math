/**
 * Все фразы, которые может произнести Счётик: постоянные, авторские карточки, помощь, похвала и
 * сгенерированные карточки (сиды 1…SEEDS во всех режимах). Ключ — phraseKey(текст), как в приложении.
 *
 *   npx vite-node scripts/voice-extract.ts            # → tts/out/phrases.json
 *   SEEDS=6000 npx vite-node scripts/voice-extract.ts
 *
 * Карточку, фраза которой не попала в набор, генератор в игре заменит другой (steps.ts, voiced) —
 * поэтому набор должен быть насыщен: отчёт печатает, сколько новых фраз дали последние сиды.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { PHRASE } from '../src/audio/phrases';
import { phraseKey } from '../src/audio/phraseKey';
import { seededRng } from '../src/content/generate';
import { missionLength } from '../src/content/levels';
import { instruction, MISSIONS, voiceText } from '../src/content/missions';
import { buildSteps, type PlayMode } from '../src/content/steps';
import type { VoiceEmotion } from '../src/motion/events';

const SEEDS = Number(process.env.SEEDS ?? 5000);
const out = new Map<string, { key: string; text: string; emotion: VoiceEmotion; source: string }>();
const add = (text: string, emotion: VoiceEmotion, source: string) => {
  const t = voiceText(text);
  if (!out.has(t)) out.set(t, { key: phraseKey(t), text: t, emotion, source });
};

for (const [name, t] of Object.entries(PHRASE)) add(t, name === 'good' ? 'praise' : name === 'again' ? 'support' : 'question', `PHRASE.${name}`);
for (const m of MISSIONS) {
  add(m.praise, 'praise', `${m.id}.praise`);
  add(`${m.praise} ${m.finish}`, 'praise', `${m.id}.finish`);
  m.help.forEach((h, i) => add(h, 'support', `${m.id}.help${i + 1}`));
  for (const p of [...m.cards.A, ...m.cards.B, ...m.cards.C]) {
    add(instruction(p), 'question', `${m.id}.card`);
    for (const h of m.helpFor?.(p) ?? []) add(h, 'support', `${m.id}.helpFor`);
  }
}
const authored = out.size;
let lastNew = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
  const before = out.size;
  for (const m of MISSIONS) for (const mode of ['play', 'review', 'again'] as PlayMode[]) {
    for (const s of buildSteps(m, mode, missionLength(m.id), seededRng(seed))) {
      if (!s.generated) continue;
      add(instruction(s.params), 'question', `${m.id}.gen`);
      for (const h of m.helpFor?.(s.params) ?? []) add(h, 'support', `${m.id}.genHelp`);
    }
  }
  if (seed > SEEDS - 500) lastNew += out.size - before;
}

const keys = new Map<string, string>();
for (const p of out.values()) {
  const other = keys.get(p.key);
  if (other && other !== p.text) throw new Error(`Совпали ключи: «${other}» и «${p.text}»`);
  keys.set(p.key, p.text);
}
mkdirSync('tts/out', { recursive: true });
writeFileSync('tts/out/phrases.json', JSON.stringify([...out.values()], null, 0));
console.log(`фраз ${out.size}: авторских и постоянных ${authored}, сгенерированных ${out.size - authored}; последние 500 сидов дали новых ${lastNew}`);
