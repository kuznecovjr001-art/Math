import { expect, test } from '@playwright/test';
import { ISLANDS } from '../src/content/levels';
import { getMission } from '../src/content/missions';
import { seed } from './helpers';

const ids = ISLANDS.flatMap((i) => i.missions);
// Размеры экрана заданы в самом тесте: хватает одного проекта.
test.skip(({ isMobile }) => !isMobile, 'только проект phone');
// Ребёнок не знает, что нужно прокрутить: на телефоне стоя и на планшете всё задание видно без прокрутки на каждой
// карточке. Цели касания не меньше 44 px. Лёжа на телефоне (только веб, Android-телефон всегда стоя) ответы и «Готово»
// закреплены на экране, а сцена может прокручиваться.
const SIZES: [number, number, boolean][] = [
  [360, 640, true], [412, 915, true], [1280, 744, true], [800, 1224, true], [915, 412, false], [740, 360, false],
];
for (const [w, h, whole] of SIZES) {
  test(`все карточки 49 миссий на экране ${w}×${h}`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: w, height: h });
    await seed(page, ids);
    await page.goto('/');
    await page.getByRole('button', { name: 'QA' }).click();
    const bad: string[] = [];
    for (const id of ids) {
      await page.locator(`button.stone-btn[aria-label^="${getMission(id)!.title}"]`).click();
      await expect(page.locator('.screen.mission')).toBeVisible();
      const cards = await page.locator('.progress .dot').count();
      for (let n = 0; n < cards; n++) {
        await page.evaluate((i) => (window as unknown as { qaCard: (x: number) => void }).qaCard(i), n);
        await page.waitForTimeout(250);
        const r = await page.evaluate(() => {
          const H = innerHeight;
          const box = (sel: string) => [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((b) => b.height > 0);
          const main = box('.screen.mission .game > .btn.big, .screen.mission .game > .choices:not(.waiting) button');
          const all = box('.screen.mission .game button, .screen.mission .game [draggable="true"], .screen.mission .game .tap');
          return {
            y: Math.round(scrollY), H,
            low: Math.round(Math.max(0, ...main.map((b) => b.bottom))),
            lowAll: Math.round(Math.max(0, ...all.map((b) => b.bottom))),
            small: Math.round(Math.min(99, ...all.map((b) => Math.min(b.width, b.height)))),
          };
        });
        // Задание открывается с начала: иначе кнопка «видна» только потому, что страница осталась прокручена.
        const lost = r.y > 0 || r.low > r.H + 1 || (whole && r.lowAll > r.H + 1) || (whole && r.small < 44);
        if (lost) bad.push(`${id}#${n} low=${r.low} all=${r.lowAll} H=${r.H} y=${r.y} small=${r.small}`);
      }
      await page.getByRole('button', { name: 'Домой' }).click();
    }
    expect(bad, 'задание не на экране').toEqual([]);
  });
}
