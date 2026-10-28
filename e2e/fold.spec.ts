import { expect, test } from '@playwright/test';
import { ISLANDS } from '../src/content/levels';
import { getMission } from '../src/content/missions';
import { seed } from './helpers';

const ids = ISLANDS.flatMap((i) => i.missions);
// Размеры экрана заданы в самом тесте: хватает одного проекта.
test.skip(({ isMobile }) => !isMobile, 'только проект phone');
// Ребёнок не знает, что нужно прокрутить: всё задание и кнопка ответа — на экране, на телефоне стоя и лёжа.
for (const [w, h] of [[915, 412], [740, 360], [360, 640]]) {
  test(`все 49 миссий помещаются в экран ${w}×${h} без прокрутки`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await seed(page, ids);
    await page.goto('/');
    await page.getByRole('button', { name: 'QA' }).click();
    const bad: string[] = [];
    for (const id of ids) {
      await page.locator(`button.stone-btn[aria-label^="${getMission(id)!.title}"]`).click();
      await expect(page.locator('.screen.mission')).toBeVisible();
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => {
        const H = innerHeight;
        const els = [...document.querySelectorAll('.screen.mission .game button, .screen.mission .game [draggable="true"], .screen.mission .game .tap')];
        const low = els.map((e) => e.getBoundingClientRect()).filter((b) => b.height > 0).reduce((m, b) => Math.max(m, b.bottom), 0);
        return { low: Math.round(low), H, doc: document.documentElement.scrollHeight };
      });
      if (r.low > r.H + 1) bad.push(`${id} low=${r.low} H=${r.H} doc=${r.doc}`);
      await page.getByRole('button', { name: 'Домой' }).click();
    }
    expect(bad, 'ниже края экрана').toEqual([]);
  });
}
