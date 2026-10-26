/**
 * Доля карточек без записанного голоса (их читает синтез речи устройства).
 * Запуск: npx vite-node scripts/voice-coverage.ts
 */
import voiceKeys from '../src/audio/voice-keys.json';
import { phraseKey } from '../src/audio/phraseKey';
import { seededRng } from '../src/content/generate';
import { missionLength } from '../src/content/levels';
import { instruction, MISSIONS, voiceText } from '../src/content/missions';
import { buildSteps, type PlayMode } from '../src/content/steps';
const rec = new Set<string>(voiceKeys.keys);
let total = 0, silent = 0; const all = new Set<string>(); const per: Record<string, [number, number]> = {};
for (const m of MISSIONS) for (const mode of ['play', 'review', 'again'] as PlayMode[]) for (let seed = 1; seed <= 300; seed++) {
  for (const s of buildSteps(m, mode, missionLength(m.id), seededRng(seed))) {
    const t = voiceText(instruction(s.params)); total++; all.add(t);
    const k = (per[m.id] ??= [0, 0]); k[1]++;
    if (!rec.has(phraseKey(t))) { silent++; k[0]++; }
  }
}
const unrec = [...all].filter((t) => !rec.has(phraseKey(t)));
console.log(`steps ${total}, without recording ${silent} (${Math.round(100 * silent / total)}%); distinct instructions ${all.size}, unrecorded distinct ${unrec.length}`);
console.log(Object.entries(per).filter(([, [a, b]]) => a / b > 0.3).map(([id, [a, b]]) => `${id} ${Math.round(100 * a / b)}%`).join(', '));
