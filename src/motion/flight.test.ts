import { afterEach, describe, expect, it, vi } from 'vitest';
import { cssZoom, screenRect } from './flight';

class Rect { constructor(public x: number, public y: number, public width: number, public height: number) {} }
const box = { x: 100, y: 40, width: 20, height: 10 };
const el = (zoom: string, parentElement: unknown, extra = {}) =>
  ({ zoom, parentElement, getBoundingClientRect: () => box, ...extra }) as unknown as Element;

describe('координаты внутри CSS zoom', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('старый WebView: zoom сцены и экрана перемножаются, прямоугольник приводится к экрану', () => {
    vi.stubGlobal('getComputedStyle', (e: { zoom: string }) => ({ zoom: e.zoom }));
    vi.stubGlobal('DOMRect', Rect);
    const item = el('1', el('0.5', el('1.25', null)));
    expect(cssZoom(item)).toBe(0.625);
    expect(screenRect(item)).toMatchObject({ x: 62.5, y: 25, width: 12.5, height: 6.25 });
  });

  it('новый WebView: браузер уже всё посчитал', () => {
    const item = el('1', null, { currentCSSZoom: 0.8 });
    expect(cssZoom(item)).toBe(0.8);
    expect(screenRect(item)).toBe(box);
  });
});
