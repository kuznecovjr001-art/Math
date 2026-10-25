/**
 * Список фраз для заранее записанной озвучки.
 * Запуск: npx vite-node scripts/voice-phrases.ts > public/audio/phrases.json
 * Фразы, которых нет в списке (редкие сгенерированные карточки), читает синтез речи браузера.
 */
import { seededRng } from '../src/content/generate';
import { missionLength } from '../src/content/levels';
import { instruction, MISSIONS, voiceText } from '../src/content/missions';
import { buildSteps, type PlayMode } from '../src/content/steps';
import { FIXED_PHRASES } from '../src/audio/phrases';

const SEEDS = Number(process.env.SEEDS ?? 0);
const out = new Set<string>(FIXED_PHRASES);
for (const m of MISSIONS) {
  out.add(m.praise);
  out.add(`${m.praise} ${m.finish}`);
  for (const h of m.help) out.add(voiceText(h));
  const cards = [...m.cards.A, ...m.cards.B, ...m.cards.C];
  for (const p of cards) {
    out.add(voiceText(instruction(p)));
    for (const h of m.helpFor?.(p) ?? []) out.add(voiceText(h));
  }
  for (const mode of ['play', 'review', 'again'] as PlayMode[]) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const s of buildSteps(m, mode, missionLength(m.id), seededRng(seed))) {
        out.add(voiceText(instruction(s.params)));
        for (const h of m.helpFor?.(s.params) ?? []) out.add(voiceText(h));
      }
    }
  }
}
process.stdout.write(JSON.stringify([...out].sort(), null, 0));
