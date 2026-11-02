import { describe, expect, it } from 'vitest';
import { checkRig, childrenOf, nodeTransform, type Parts, type Rig } from './model';
import parts from './parts.json';
import rig from './rig.json';

const RIG = rig as unknown as Rig;
const PARTS = parts as unknown as Parts;

describe('риг Счётика', () => {
  it('все детали на месте, у узлов есть родители, циклов нет', () => {
    expect(checkRig(RIG, PARTS)).toEqual([]);
  });

  it('у каждого выражения есть свои рисунки: глаза, брови, рты, ласты', () => {
    const need = ['eye-open-L', 'eye-half-L', 'eye-closed-L', 'brow-calm-L', 'brow-happy-L', 'brow-think-L',
      'mouth-smile', 'mouth-wide', 'mouth-a', 'mouth-o', 'mouth-u', 'mouth-m', 'flipper-L', 'flipper-R'];
    const used = new Set(Object.values(RIG).flatMap((n) => n.parts ?? []));
    for (const p of need) expect(used.has(p), p).toBe(true);
  });

  it('открытые глаза знают, где зрачок: им можно смотреть по сторонам', () => {
    for (const k of ['eye-open-L', 'eye-open-R']) {
      const [cx, cy, rx, ry] = PARTS[k].pupil!;
      const [ex, ey, erx, ery] = PARTS[k].clip!;
      expect(rx).toBeLessThan(erx);
      expect(ry).toBeLessThan(ery);
      expect(Math.abs(cx - ex)).toBeLessThan(erx);
      expect(Math.abs(cy - ey)).toBeLessThan(ery);
    }
  });

  it('смещение анимации складывается с покоем, а не заменяет его', () => {
    const n = { x: 10, y: 20, rot: 5, s: 2, z: 0 };
    expect(nodeTransform(n)).toBe('translate(10 20) rotate(5) scale(2 2)');
    expect(nodeTransform(n, { x: 1, y: -2, rot: 10, sx: 1.5, sy: 1 })).toBe('translate(11 18) rotate(15) scale(3 2)');
  });

  it('дети рисуются по z: дальние раньше', () => {
    const r: Rig = { a: { x: 0, y: 0, rot: 0, s: 1, z: 0 }, b: { parent: 'a', x: 0, y: 0, rot: 0, s: 1, z: 2 }, c: { parent: 'a', x: 0, y: 0, rot: 0, s: 1, z: 1 } };
    expect(childrenOf(r, 'a')).toEqual(['c', 'b']);
  });

  it('проверка ловит потерянную деталь и цикл', () => {
    const r: Rig = { a: { parent: 'b', parts: ['nope'], x: 0, y: 0, rot: 0, s: 1, z: 0 }, b: { parent: 'a', x: 0, y: 0, rot: 0, s: 1, z: 0 } };
    expect(checkRig(r, PARTS).join(' ')).toMatch(/нет детали nope.*цикл/);
  });
});
