import { defineConfig, devices } from '@playwright/test';

// Сценарии веб-версии: переходы, реакции Счётика, все миссии на телефоне и планшете.
// Локально — установленный Edge (без скачивания браузеров), в CI — Chromium Playwright.
const local = !process.env.CI;
export default defineConfig({
  testDir: 'e2e',
  grepInvert: process.env.DEMO ? undefined : /@demo/,
  timeout: 120_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.qa/playwright-report' }]],
  outputDir: '.qa/playwright-results',
  use: { baseURL: 'http://localhost:4174', ...(local ? { channel: 'msedge' } : {}) },
  webServer: { command: 'npx vite --port 4174 --strictPort', port: 4174, reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], ...(local ? { channel: 'msedge' } : {}) } },
    { name: 'tablet', use: { viewport: { width: 1280, height: 800 }, hasTouch: true } },
  ],
});
