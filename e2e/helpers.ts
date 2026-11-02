import type { Page } from '@playwright/test';

/** Профиль «QA», у которого открыты все миссии (дошёл до пробы каждой — правило открытия). */
export async function seed(page: Page, ids: string[], extra: Record<string, unknown> = {}) {
  await page.addInitScript(([list, more]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('mathkids:v1', JSON.stringify({
      version: 1,
      profiles: [{ id: 'qa', name: 'QA', avatar: '1F431', createdAt: 0 }],
      attempts: (list as string[]).map((id, n) => ({
        id: `qa${n}`, profileId: 'qa', missionId: id, cardId: `${id}-qa`, variant: 'B', skill: 'M01',
        mode: 'probe', correct: true, helpLevel: 0, answer: 'qa', at: Date.now() - 3600_000,
      })),
      stickers: {}, settings: { voice: false },
    }));
    localStorage.setItem('mathkids:settings:v1', JSON.stringify({ voice: false, ...(more as object) }));
  }, [ids, extra] as const);
}

export const mood = (page: Page) => page.locator('.schetik').first().getAttribute('data-mood');
