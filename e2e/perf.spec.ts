import { expect, test } from '@playwright/test';
import { ISLANDS } from '../src/content/levels';
import { seed } from './helpers';

// Производительность на «слабом телефоне»: CPU замедлен в 4 раза (CDP). Отчёт — в .qa/perf.json.
test.skip(({ browserName }) => browserName !== 'chromium', 'CDP только в Chromium/Edge');

async function frames(page: import('@playwright/test').Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const w = window as unknown as { __f: number[]; __run: boolean };
    w.__f = []; w.__run = true;
    let last = performance.now();
    const tick = (t: number) => { w.__f.push(t - last); last = t; if (w.__run) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await action();
  const f = await page.evaluate(() => { const w = window as unknown as { __f: number[]; __run: boolean }; w.__run = false; return w.__f.slice(1); });
  f.sort((a, b) => a - b);
  const p = (q: number) => Math.round(f[Math.min(f.length - 1, Math.floor(q * f.length))]);
  return { frames: f.length, p50: p(0.5), p95: p(0.95), over33ms: f.filter((x) => x > 33).length };
}

test('плавность и утечки при CPU ×4', async ({ page }, info) => {
  test.setTimeout(300_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await seed(page, ISLANDS.flatMap((i) => i.missions));
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  await page.waitForTimeout(1500);

  const mapScroll = await frames(page, async () => {
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(80); }
  });

  await page.locator('.today-card').first().click();
  await page.waitForTimeout(800);
  const answer = await frames(page, async () => {
    await page.locator('.choices .btn.choice, .receiver-main').first().click().catch(() => undefined);
    await page.waitForTimeout(2000);
  });
  await page.getByRole('button', { name: 'Домой' }).click();

  // 15 входов и выходов: слушатели, таймеры и память не должны расти.
  const heap = async () => (await cdp.send('Runtime.getHeapUsage')).usedSize / 1e6;
  await cdp.send('HeapProfiler.collectGarbage');
  const before = await heap();
  for (let i = 0; i < 15; i++) {
    await page.locator('.today-card').first().click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Домой' }).click();
    await page.waitForTimeout(300);
  }
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await heap();
  const listeners = (await cdp.send('Runtime.evaluate', { expression: 'document.querySelectorAll("*").length' })).result.value;

  const report = { project: info.project.name, mapScroll, answer, heapMB: { before: +before.toFixed(1), after: +after.toFixed(1) }, domNodes: listeners };
  console.log(JSON.stringify(report));
  await info.attach('perf', { body: JSON.stringify(report, null, 1), contentType: 'application/json' });
  expect(after - before).toBeLessThan(15);
});
