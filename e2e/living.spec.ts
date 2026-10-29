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
  // Первый вход в миссию на холодном dev-сервере собирает чанк игр дольше 5 с.
  await expect(page.locator('.screen.mission')).toBeVisible({ timeout: 20_000 });
  expect(await mood(page)).toBe('greeting');
  // «Чашка каждому»: дать каждому гостю по чашке и нажать «Готово».
  for (const b of await page.locator('.receiver-main').all()) await b.click();
  await page.getByRole('button', { name: 'Готово' }).click();
  expect(await mood(page)).toBe('happy');
  await expect.poll(() => mood(page), { timeout: 4000 }).toBe('listening');
  // После верного ответа игра сама переходит к следующей карточке.
  await expect(page.getByRole('img', { name: /^Задание 2 из/ })).toBeVisible({ timeout: 5000 });
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
  // Риг Счётика замирает: поза и выражение меняются сразу, без движения, дыхания и моргания.
  const rig = page.locator('.schetik-rig').first();
  await expect(rig).toBeVisible();
  const frame = () => rig.evaluate((el) => [...el.querySelectorAll('[data-node], [data-v]')]
    .map((g) => `${g.getAttribute('transform')}|${g.getAttribute('display')}`).join(';'));
  // Приветствие держится 1,5 с, потом «слушает» — смена позы мгновенная; дальше ничего не должно двигаться.
  await page.waitForTimeout(2000);
  const a = await frame();
  await page.waitForTimeout(1500);
  expect(await frame()).toBe(a);
});

test('настройки анимаций и звука хранятся отдельно от прогресса', async ({ page }) => {
  await seed(page, [], { motion: 'minimal' });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('minimal');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('mathkids:v1')!));
  expect(progress.settings.motion).toBeUndefined();
});

test('сортировка: предмет перетаскивается пальцем в корзину, мимо — возвращается', async ({ page }) => {
  await seed(page, ids);
  await page.goto('/');
  await page.getByRole('button', { name: 'QA' }).click();
  await page.locator(`button.stone-btn[aria-label^="${getMission('N10')!.title}"]`).click();
  const item = page.locator('.drag-item');
  // Ждём, пока предмет встанет и примет касание: экран и карточка ещё проявляются (смена экрана, card-in).
  await item.click({ trial: true });
  const before = await page.locator('.bin-items button').count();
  const bin = page.locator('.bin').first();
  const a = (await item.boundingBox())!, b = (await bin.boundingBox())!;
  // В корзину: корзина под пальцем откликается, после отпускания предмет в ней.
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await expect(bin).toHaveClass(/near/);
  await page.mouse.up();
  expect(await page.locator('.bin-items button').count()).toBe(before + 1);
  // Мимо: следующий предмет отпустили далеко от корзин — он остаётся на месте.
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 5, a.y - 120, { steps: 6 });
  await page.mouse.up();
  expect(await page.locator('.bin-items button').count()).toBe(before + 1);
  await expect(item).toBeVisible();
});
