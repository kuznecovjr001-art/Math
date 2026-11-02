import { expect, test } from '@playwright/test';
import { seed } from './helpers';

// Видеодемонстрация (не входит в обычный прогон): npx playwright test --grep @demo --project=phone
test.use({ video: { mode: 'on', size: { width: 412, height: 915 } }, viewport: { width: 412, height: 915 } });

test('@demo миссия: приветствие, ошибка, подсказка, радость, финиш с наклейкой', async ({ page }) => {
  test.setTimeout(300_000);
  await seed(page, []);
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'QA' }).click();
  await page.waitForTimeout(2500); // карта: облака, Счётик
  await page.screenshot({ path: 'docs/demo/1-map.jpg', type: 'jpeg', quality: 70 });
  await page.locator('.today-card').first().click();
  await expect(page.locator('.screen.mission')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/demo/2-greeting.jpg', type: 'jpeg', quality: 70 });
  await page.waitForTimeout(1200); // приветствие
  for (let card = 0; card < 12 && (await page.locator('.screen.mission').count()); card++) {
    const guests = await page.locator('.receiver-main').all();
    if (card === 2) {
      // Ошибка: последний гость без чашки — Счётик поддерживает; потом подсказка и исправление.
      for (const g of guests.slice(0, -1)) { await g.click(); await page.waitForTimeout(250); }
      await page.getByRole('button', { name: 'Готово' }).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'docs/demo/3-encourage.jpg', type: 'jpeg', quality: 70 });
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: 'Помощь' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'docs/demo/4-help.jpg', type: 'jpeg', quality: 70 });
      await page.waitForTimeout(1700);
      await guests[guests.length - 1].click();
    } else {
      for (const g of guests) { await g.click(); await page.waitForTimeout(250); }
    }
    await page.getByRole('button', { name: 'Готово' }).click();
    if (card === 3) { await page.waitForTimeout(250); await page.screenshot({ path: 'docs/demo/5-happy.jpg', type: 'jpeg', quality: 70 }); }
    await page.waitForTimeout(1900);
  }
  await expect(page.locator('.screen.finish')).toBeVisible();
  await expect(page.locator('.schetik').first()).toHaveAttribute('data-mood', 'celebrating');
  await page.waitForTimeout(3500); // прилёт наклейки
  await page.screenshot({ path: 'docs/demo/6-finish.jpg', type: 'jpeg', quality: 70 });
});
