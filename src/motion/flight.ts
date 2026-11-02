import { DUR, EASE } from './tokens';

/** Движение выключено системой или настройкой «минимальные». */
export function motionOff(): boolean {
  return document.documentElement.dataset.motion === 'minimal'
    || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** Итоговый CSS zoom у элемента: сцена уменьшена в fitScene и увеличена на больших планшетах. */
export function cssZoom(el: Element): number {
  const native = (el as Element & { currentCSSZoom?: number }).currentCSSZoom;
  if (native) return native;
  let zoom = 1;
  for (let e: Element | null = el; e; e = e.parentElement) zoom *= parseFloat(getComputedStyle(e).zoom) || 1;
  return zoom;
}

/** Прямоугольник в координатах экрана. WebView младше 128 отдаёт его внутри zoom в масштабе самой сцены. */
export function screenRect(el: Element): DOMRect {
  const r = el.getBoundingClientRect();
  if ('currentCSSZoom' in el) return r;
  const z = cssZoom(el);
  return new DOMRect(r.x * z, r.y * z, r.width * z, r.height * z);
}

/**
 * Предмет «перелетает» из точки from в своё новое место (FLIP): видно, откуда он взялся — количество
 * не появляется из ниоткуда. Только transform, поэтому дёшево и для слабого телефона.
 */
export function flyFrom(target: Element | null | undefined, from: DOMRect | null | undefined) {
  if (!target || !from || motionOff() || !('animate' in target)) return;
  const to = screenRect(target);
  if (!to.width) return;
  // Сдвиг в transform считается в масштабе самой сцены.
  const z = cssZoom(target);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  (target as HTMLElement).animate(
    [{ transform: `translate(${dx / z}px, ${dy / z}px) scale(${from.width / to.width})` }, { transform: 'none' }],
    { duration: DUR.step + 80, easing: EASE.spring },
  );
}
