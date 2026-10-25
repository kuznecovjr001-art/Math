/**
 * Смоук всех 49 миссий в настоящем Android WebView (эмулятор или телефон с debug-APK).
 * Открывает каждую миссию с карты, проверяет вёрстку и сохраняет снимок экрана.
 *
 *   npx vite-node scripts/android-smoke.ts -- <имя-прогона>
 *
 * Нужны: adb в ANDROID_HOME или %LOCALAPPDATA%/Android/Sdk, запущенный debug-APK.
 * Данные приложения на устройстве заменяются тестовым профилем — не запускать на телефоне ребёнка.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ISLANDS } from '../src/content/levels';
import { getMission } from '../src/content/missions';

const PKG = 'io.github.kuznecovjr001_art.schitalochka';
const sdk = process.env.ANDROID_HOME ?? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const adb = (...args: string[]) => execFileSync(join(sdk, 'platform-tools', 'adb'), args, { encoding: 'utf8' }).trim();
const run = process.argv.at(-1) && !process.argv.at(-1)!.endsWith('.ts') ? process.argv.at(-1)! : 'phone';
const out = join('.qa', 'android', run);
mkdirSync(out, { recursive: true });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pid = adb('shell', 'pidof', PKG);
if (!pid) throw new Error('Приложение не запущено');
adb('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`);
const targets = (await (await fetch('http://127.0.0.1:9222/json')).json()) as { type: string; webSocketDebuggerUrl: string }[];
const ws = new WebSocket(targets.find((t) => t.type === 'page')!.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map<number, (v: unknown) => void>();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(String(e.data)) as { id?: number; result?: unknown };
  if (m.id && pending.has(m.id)) { pending.get(m.id)!(m.result); pending.delete(m.id); }
});
const cdp = (method: string, params: object = {}) => new Promise<any>((resolve) => {
  const id = ++seq;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
const js = async <T>(expr: string): Promise<T> =>
  (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value as T;

const ids = ISLANDS.flatMap((i) => i.missions);
// Тестовый профиль, у которого открыты все миссии (дошёл до пробы каждой — правило открытия).
const seed = {
  version: 1,
  profiles: [{ id: 'qa', name: 'QA', avatar: '1F431', createdAt: 0 }],
  attempts: ids.map((id, n) => ({
    id: `qa${n}`, profileId: 'qa', missionId: id, cardId: `${id}-qa`, variant: 'B', skill: getMission(id)!.skill,
    mode: 'probe', correct: true, helpLevel: 0, answer: 'qa', at: Date.now() - 3600_000,
  })),
  stickers: {}, settings: { voice: false },
};
await js(`localStorage.clear(); localStorage.setItem('mathkids:v1', ${JSON.stringify(JSON.stringify(seed))}); location.reload()`);
await wait(3000);
await js(`document.querySelector('button[aria-label="QA"]')?.click()`);
await wait(2000);

const viewport = await js<{ w: number; h: number; dpr: number }>('({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })');
const rows: string[] = [];
const fails: string[] = [];
for (const id of ids) {
  const m = getMission(id)!;
  const opened = await js<boolean>(`(() => {
    const b = [...document.querySelectorAll('button.stone-btn')].find((x) => x.getAttribute('aria-label').startsWith(${JSON.stringify(m.title)}));
    if (!b || b.disabled) return false;
    b.click();
    return true;
  })()`);
  if (!opened) { fails.push(`${id}: не открылась с карты`); rows.push(`| ${id} | FAIL | не открылась |`); continue; }
  await wait(1800);
  const r = await js<{ ok: boolean; overflowX: number; small: string[]; outside: string[]; scrollY: number; title: string }>(`(() => {
    const vw = innerWidth, vh = document.documentElement.scrollHeight;
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0; };
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || el.className || el.tagName).trim().slice(0, 24);
    const ctl = [...document.querySelectorAll('.mission button, .mission [role=button], .mission input')].filter(vis);
    const small = ctl.filter((el) => { const b = el.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).map(name);
    const outside = [...document.querySelectorAll('.mission button, .mission img, .mission svg')].filter(vis)
      .filter((el) => { const b = el.getBoundingClientRect(); return b.left < -1 || b.right > vw + 1; }).map(name);
    return { ok: !!document.querySelector('.screen.mission'), overflowX: document.documentElement.scrollWidth - vw,
      small: [...new Set(small)], outside: [...new Set(outside)], scrollY: Math.max(0, vh - innerHeight),
      title: document.querySelector('.task-text')?.textContent?.slice(0, 60) ?? '' };
  })()`);
  const shot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
  writeFileSync(join(out, `${id}.jpg`), Buffer.from(shot.data, 'base64'));
  const problems = [
    !r.ok && 'экран миссии не открылся',
    r.overflowX > 1 && `горизонтальная прокрутка ${r.overflowX}px`,
    r.outside.length > 0 && `за краем: ${r.outside.join(', ')}`,
    r.small.length > 0 && `цели < 44px: ${r.small.join(', ')}`,
  ].filter(Boolean) as string[];
  if (problems.length) fails.push(`${id}: ${problems.join('; ')}`);
  rows.push(`| ${id} | ${problems.length ? 'FAIL' : 'PASS'} | ${r.scrollY > 0 ? `прокрутка ${r.scrollY}px` : 'без прокрутки'} | ${problems.join('; ')} |`);
  await js(`document.querySelector('[aria-label="Домой"]')?.click()`);
  await wait(1200);
}
ws.close();

const report = [
  `# Android smoke: ${run}`, '',
  `Устройство: ${adb('shell', 'getprop', 'ro.product.model')}, Android ${adb('shell', 'getprop', 'ro.build.version.release')}, ` +
  `WebView ${viewport.w}×${viewport.h} CSS px, DPR ${viewport.dpr}. ${new Date().toISOString()}`, '',
  `Итог: ${ids.length - fails.length}/${ids.length} PASS.`, '',
  '| Миссия | Итог | Вертикаль | Замечания |', '| --- | --- | --- | --- |', ...rows, '',
].join('\n');
writeFileSync(join(out, 'report.md'), report);
console.log(report.split('\n').slice(0, 5).join('\n'));
console.log(fails.join('\n') || 'Замечаний нет');
process.exit(0);
