import { expect, test } from '@playwright/test';
import { ISLANDS } from '../src/content/levels';
import { seed } from './helpers';

// Вернувшись из задания, ребёнок видит свой остров, а не начало карты; задание открывается с начала.
test('карта помнит, где был ребёнок', async ({ page }) => {
  await seed(page, ISLANDS.flatMap((i) => i.missions));
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  const stone = page.locator('[data-island="table"] button.stone-btn').first();
  await stone.scrollIntoViewIfNeeded();
  await stone.click({ trial: true }); // Playwright дождётся покоя и больше не будет докручивать перед кликом
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
  const top = (await stone.boundingBox())!.y;
  await stone.click();
  await expect(page.locator('.screen.mission')).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole('button', { name: 'Домой' }).click();
  await expect(page.locator('.screen.map')).toBeVisible();
  expect(Math.abs((await stone.boundingBox())!.y - top)).toBeLessThan(2);
});
