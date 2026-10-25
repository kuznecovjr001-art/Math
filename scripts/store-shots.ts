/**
 * Скриншоты для карточки RuStore из настоящего Android WebView (без системных панелей).
 * Демо-профиль с историей заменяет данные приложения — запускать только на эмуляторе.
 *   npx vite-node scripts/store-shots.ts -- <префикс: phone|tablet>
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ISLANDS } from '../src/content/levels';
import { getMission } from '../src/content/missions';

const PKG = 'io.github.kuznecovjr001_art.schitalochka';
const sdk = process.env.ANDROID_HOME ?? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const adb = (...a: string[]) => execFileSync(join(sdk, 'platform-tools', 'adb'), a, { encoding: 'utf8' }).trim();
const prefix = process.argv.at(-1)!;
const out = join('docs', 'store');
mkdirSync(out, { recursive: true });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

adb('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${adb('shell', 'pidof', PKG)}`);
const t = (await (await fetch('http://127.0.0.1:9222/json')).json()) as { type: string; webSocketDebuggerUrl: string }[];
const ws = new WebSocket(t.find((x) => x.type === 'page')!.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const cdp = (method: string, params: object = {}) => new Promise<any>((res) => {
  const id = ++seq;
  ws.addEventListener('message', function h(e) { const m = JSON.parse(String(e.data)); if (m.id === id) { ws.removeEventListener('message', h); res(m.result); } });
  ws.send(JSON.stringify({ id, method, params }));
});
const js = (expression: string) => cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
const shot = async (name: string) => {
  const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
  writeFileSync(join(out, `${prefix}-${name}.jpg`), Buffer.from(r.data, 'base64'));
};

// Демо: первые три острова пройдены за 10 дней, разные итоги карточек.
const now = Date.now(), DAY = 86400000;
const ids = ISLANDS.slice(0, 3).flatMap((i) => i.missions);
const attempts: object[] = [], sessions: object[] = [];
ids.forEach((id, k) => {
  const at = now - (10 - Math.floor(k / 2.5)) * DAY + 17 * 3600000 % DAY;
  sessions.push({ id: `s${k}`, profileId: 'demo', missionId: id, mode: 'play', startedAt: at, cards: 7, shown: 7, finishedAt: at + 300000 });
  for (let step = 0; step < 7; step++) {
    const learn = step < 2, wrong = !learn && (k + step) % 5 === 0, help = !learn && (k + step) % 7 === 0;
    const base = { profileId: 'demo', missionId: id, cardId: `${id}-${step}`, variant: learn ? 'A' : 'B', skill: getMission(id)!.skill,
      mode: learn ? 'learn' : 'probe', answer: '·', sessionId: `s${k}`, step };
    if (wrong) attempts.push({ ...base, id: `w${k}-${step}`, correct: false, helpLevel: 0, at: at + step * 30000, errorsBefore: 0 });
    attempts.push({ ...base, id: `a${k}-${step}`, correct: true, helpLevel: help ? 1 : 0, at: at + step * 30000 + 9000, errorsBefore: wrong ? 1 : 0 });
  }
});
const data = { version: 1, profiles: [{ id: 'demo', name: 'Аня', avatar: '1F431', createdAt: now - 20 * DAY, startIsland: 0 }],
  attempts, sessions, stickers: { demo: ids }, settings: { voice: false } };
await js(`localStorage.clear(); localStorage.setItem('mathkids:v1', ${JSON.stringify(JSON.stringify(data))}); location.reload()`);
await wait(3500);
await js(`document.querySelector('button[aria-label="Аня"]').click()`); await wait(2500);
await shot('1-map');
const open = async (title: string, name: string) => {
  await js(`[...document.querySelectorAll('button.stone-btn')].find((b) => b.getAttribute('aria-label').startsWith(${JSON.stringify(title)})).click()`);
  await wait(2500); await shot(name);
  await js(`document.querySelector('[aria-label="Домой"]').click()`); await wait(1500);
};
await open(getMission('N05')!.title, '2-mission-ten');
await open(getMission('A05')!.title, '3-mission-groups');
await js(`document.querySelector('[aria-label="Сменить игрока"]').click()`); await wait(1000);
await js(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Для взрослых')).click()`); await wait(3000);
const gate = await js(`(async () => { const [a, b] = document.querySelector('.gate-q').textContent.match(/[0-9]+/g).map(Number);
  for (const d of String(a * b)) { [...document.querySelectorAll('.keypad button')].find((x) => x.textContent === d).click(); await new Promise((r) => setTimeout(r, 60)); }
  document.querySelector('[aria-label="Проверить"]').click(); return a * b; })()`);
if (gate.exceptionDetails) console.log('gate failed', JSON.stringify(gate.exceptionDetails).slice(0, 300));
await wait(2000);
await js(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '30 дней').click(); scrollTo(0, 0)`); await wait(800);
await shot('4-parent-report');
ws.close();
console.log('ok', prefix);
process.exit(0);
