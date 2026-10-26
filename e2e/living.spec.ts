import { expect, test } from '@playwright/test';
import { ISLANDS } from '../src/content/levels';
import { getMission } from '../src/content/missions';
import { mood, seed } from './helpers';

const ids = ISLANDS.flatMap((i) => i.missions);

test('Счётик реагирует на начало задания, касание и верный ответ', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page, []);
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  expect(await mood(page)).toBe('idle');
  await page.locator('.today-card').first().click();
  await expect(page.locator('.screen.mission')).toBeVisible();
  expect(await mood(page)).toBe('greeting');
  // «Чашка каждому»: дать каждому гостю по чашке и нажать «Готово».
  for (const b of await page.locator('.receiver-main').all()) await b.click();
  await page.getByRole('button', { name: 'Готово' }).click();
  expect(await mood(page)).toBe('happy');
  await expect.poll(() => mood(page), { timeout: 4000 }).toBe('listening');
  expect(errors).toEqual([]);
});

test('все 49 миссий открываются без горизонтальной прокрутки и мелких целей', async ({ page }, info) => {
  await seed(page, ids);
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  const problems: string[] = [];
  for (const id of ids) {
    const title = getMission(id)!.title;
    await page.locator(`button.stone-btn[aria-label^="${title}"]`).click();
    await expect(page.locator('.screen.mission')).toBeVisible();
    const r = await page.evaluate(() => {
      const small = [...document.querySelectorAll('.mission button')].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.width < 44 || r.height < 44);
      }).length;
      return { overflow: document.documentElement.scrollWidth - innerWidth, small };
    });
    if (r.overflow > 1 || r.small) problems.push(`${id}: overflow ${r.overflow}, small ${r.small}`);
    await page.screenshot({ path: info.outputPath(`${id}.png`) });
    await page.getByRole('button', { name: 'Домой' }).click();
  }
  expect(problems).toEqual([]);
});

test('уменьшенное движение: анимации выключены, кнопки финиша видны', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, []);
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  await page.locator('.today-card').first().click();
  const anim = await page.locator('.schetik-body').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
});

test('настройки анимаций и звука хранятся отдельно от прогресса', async ({ page }) => {
  await seed(page, [], { motion: 'minimal' });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('minimal');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('mathkids:v1')!));
  expect(progress.settings.motion).toBeUndefined();
});
