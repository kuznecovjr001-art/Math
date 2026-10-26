import { DUR, EASE } from './tokens';

/** Движение выключено системой или настройкой «минимальные». */
export function motionOff(): boolean {
  return document.documentElement.dataset.motion === 'minimal'
    || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Предмет «перелетает» из точки from в своё новое место (FLIP): видно, откуда он взялся — количество
 * не появляется из ниоткуда. Только transform, поэтому дёшево и для слабого телефона.
 */
export function flyFrom(target: Element | null | undefined, from: DOMRect | null | undefined) {
  if (!target || !from || motionOff() || !('animate' in target)) return;
  const to = target.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  (target as HTMLElement).animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width})` }, { transform: 'none' }],
    { duration: DUR.step + 80, easing: EASE.spring },
  );
}
