import { Capacitor } from '@capacitor/core';

/** Сборка для Android: ресурсы лежат в APK, service worker не нужен. */
export const isNative = Capacitor.isNativePlatform();

/**
 * Аппаратная кнопка «Назад» и сворачивание. back() возвращает false на первом экране —
 * тогда приложение сворачивается, а не закрывается: прогресс уже сохранён.
 */
export async function onNativeLifecycle(back: () => boolean, pause: () => void, resume: () => void) {
  if (!isNative) return () => {};
  const { App } = await import('@capacitor/app');
  const hs = await Promise.all([
    App.addListener('backButton', () => { if (!back()) void App.minimizeApp(); }),
    App.addListener('pause', pause),
    App.addListener('resume', resume),
  ]);
  return () => hs.forEach((h) => void h.remove());
}
