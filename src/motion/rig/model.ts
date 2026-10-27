/**
 * Риг Счётика: дерево узлов (rig.json) поверх векторных деталей (parts.json, scripts/art/rig_parts.py).
 *
 * Узел — шарнир. Его (x, y) — точка поворота в системе родителя; rot/s — поворот и масштаб покоя.
 * Рисунок узла — одна из деталей parts (вариант: открытый/закрытый глаз, форма рта, жест кисти),
 * центр детали стоит в точке vo[деталь] относительно шарнира. Дети — в системе узла.
 * Анимация не меняет покой: она добавляет смещение (Delta), поэтому страница сборки и игра рисуют одинаково.
 */
export interface RigNode {
  parent?: string;
  /** Варианты рисунка; первый — по умолчанию. Узел без деталей — просто шарнир. */
  parts?: string[];
  x: number;
  y: number;
  rot: number;
  s: number;
  /** Порядок среди братьев: больше — ближе к зрителю. */
  z: number;
  /** Смещение центра каждой детали от шарнира и её собственный поворот: [dx, dy, rot]. */
  vo?: Record<string, [number, number, number]>;
}

export type Rig = Record<string, RigNode>;

export interface Part {
  w: number;
  h: number;
  svg: string;
  /** У открытых глаз: зрачок [cx, cy, rx, ry], блик [cx, cy, r], белок для обрезки [cx, cy, rx, ry]. */
  pupil?: [number, number, number, number];
  shine?: [number, number, number];
  clip?: [number, number, number, number];
}

export type Parts = Record<string, Part>;

/** Детали, которые риг рисует сам (RigSvg), а не берёт из parts.json. */
export const DRAWN = ['strap', 'flipper-L', 'flipper-R'];

/** Смещение анимации поверх покоя. */
export interface Delta { x: number; y: number; rot: number; sx: number; sy: number }

export const ZERO: Delta = { x: 0, y: 0, rot: 0, sx: 1, sy: 1 };

const r = (n: number) => Math.round(n * 100) / 100;

export function nodeTransform(n: RigNode, d: Delta = ZERO): string {
  return `translate(${r(n.x + d.x)} ${r(n.y + d.y)}) rotate(${r(n.rot + d.rot)}) scale(${r(n.s * d.sx)} ${r(n.s * d.sy)})`;
}

export function variantTransform(n: RigNode, part: string, p: Part): string {
  const [dx, dy, rot] = n.vo?.[part] ?? [0, 0, 0];
  return `translate(${r(dx)} ${r(dy)}) rotate(${r(rot)}) translate(${r(-p.w / 2)} ${r(-p.h / 2)})`;
}

/** Дети узла в порядке отрисовки (дальние раньше). */
export function childrenOf(rig: Rig, id: string | undefined): string[] {
  return Object.keys(rig).filter((k) => rig[k].parent === id).sort((a, b) => rig[a].z - rig[b].z);
}

/** Все детали рига существуют, у каждого узла есть родитель, циклов нет. Возвращает список ошибок. */
export function checkRig(rig: Rig, parts: Parts): string[] {
  const errors: string[] = [];
  for (const [id, n] of Object.entries(rig)) {
    if (n.parent !== undefined && !rig[n.parent]) errors.push(`${id}: нет родителя ${n.parent}`);
    for (const p of n.parts ?? []) if (!DRAWN.includes(p) && !parts[p]) errors.push(`${id}: нет детали ${p}`);
    const seen = new Set<string>();
    for (let k: string | undefined = id; k !== undefined; k = rig[k]?.parent) {
      if (seen.has(k)) { errors.push(`${id}: цикл`); break; }
      seen.add(k);
    }
  }
  return errors;
}
