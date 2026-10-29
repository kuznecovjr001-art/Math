import { int, pick, shuffle, type Rng } from './rng';
import type { CardParams, ItemId } from './missions';
import {
  GROUP_HOLDER, MEASURE_THINGS, mirror, type FracAsk, type FracShape, type Measurable, type MoreParams,
} from './numbers';

/** Генерация карточек островов 3–4 и острова сотен. Диапазоны берутся из авторских карточек миссии. */

function span<K extends MoreParams['kind']>(
  pool: CardParams[], kind: K, f: (p: Extract<MoreParams, { kind: K }>) => number,
): [number, number] {
  const vs = pool.filter((p): p is Extract<MoreParams, { kind: K }> => p.kind === kind).map(f);
  return [Math.min(...vs), Math.max(...vs)];
}

const TOYS = [
  { toy: '1F9F8', name: 'мишка' }, { toy: '26BD', name: 'мяч' }, { toy: '1F697', name: 'машинка' },
  { toy: '1F388', name: 'шарик' }, { toy: '1F4D6', name: 'книжка' },
];
const TALLY_FRUITS: ItemId[] = ['apple', 'pear', 'strawberry', 'tangerine', 'carrot'];
const THINGS = Object.keys(MEASURE_THINGS) as Measurable[];

/** Доля фигуры: верная, неравные части (главная ловушка) и другая доля. */
export function fractionOptions(ask: FracAsk, rng: Rng): FracShape[] {
  const shape = pick(rng, ['circle', 'rect'] as const);
  const parts: 2 | 4 = ask === 'half' ? pick(rng, [2, 4] as const) : 4;
  const shaded = ask === 'half' ? parts / 2 : ask === 'quarter' ? 1 : 3;
  const right: FracShape = { shape, parts, shaded, equal: true };
  const unequal: FracShape = { shape, parts, shaded, equal: false };
  const other: FracShape = ask === 'half'
    ? { shape, parts: 4, shaded: pick(rng, [1, 3]), equal: true }
    : { shape, parts: 4, shaded: ask === 'quarter' ? pick(rng, [2, 3]) : pick(rng, [1, 2]), equal: true };
  return shuffle(rng, [right, unequal, other]);
}

function symmetryHalf(rng: Rng): string[] {
  for (;;) {
    const half = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => (rng() < 0.5 ? '1' : '0')).join(''));
    const ones = half.join('').split('1').length - 1;
    // Узор не должен совпадать со своим зеркалом, иначе «сдвиг» и «зеркало» неотличимы.
    if (ones >= 4 && ones <= 9 && mirror(half).join() !== half.join()) return half;
  }
}

export function varyMore(t: MoreParams, pool: CardParams[], rng: Rng): MoreParams {
  switch (t.kind) {
    case 'beads100': {
      const [lo, hi] = span(pool, 'beads100', (p) => p.n);
      return { ...t, n: int(rng, lo, hi) };
    }
    case 'chart100': {
      const [lo, hi] = span(pool, 'chart100', (p) => p.missing);
      // У пропущенной клетки должны быть соседи слева и справа в ряду, как у автора.
      const cells = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((x) => x % 10 >= 2);
      return { ...t, missing: pick(rng, cells) };
    }
    case 'coins': {
      const [lo, hi] = span(pool, 'coins', (p) => p.price);
      return { ...t, price: int(rng, lo, hi), ...pick(rng, TOYS) };
    }
    case 'tally': {
      const items = shuffle(rng, TALLY_FRUITS).slice(0, 3);
      const nums = shuffle(rng, [2, 3, 4, 5, 6, 7]).slice(0, 3);
      const counts = items.map((id, i) => [id, nums[i]] as [ItemId, number]);
      return { ...t, counts, ask: t.ask === 'most' ? 'most' : pick(rng, items) };
    }
    case 'groupsOf': {
      // Диапазон — по тому же размеру группы: у машин (по 4) авторских групп меньше, чем у велосипедов.
      const [, hi] = span(pool.filter((p) => p.kind !== 'groupsOf' || p.size === t.size), 'groupsOf', (p) => p.total / p.size);
      return { ...t, total: t.size * int(rng, 2, Math.max(hi, 4)) };
    }
    case 'jumps': {
      const [, hiStep] = span(pool, 'jumps', (p) => p.step);
      const [, hiCount] = span(pool, 'jumps', (p) => p.count);
      const [, hiAns] = span(pool, 'jumps', (p) => p.step * p.count);
      const step = int(rng, 2, hiStep);
      return { ...t, step, count: int(rng, 2, Math.max(2, Math.min(hiCount, Math.floor(hiAns / step)))) };
    }
    case 'fraction': {
      const ask = pick(rng, ['half', 'quarter', 'threeQuarters'] as const);
      return { ...t, ask, options: fractionOptions(ask, rng) };
    }
    case 'units': {
      // Диапазон — по той же мерке: у карандаша авторские длины меньше, чем у скрепки.
      const [lo, hi] = span(pool.filter((p) => p.kind !== 'units' || p.unit === t.unit), 'units', (p) => p.len);
      return { ...t, len: int(rng, lo, hi) };
    }
    case 'complete100': {
      const [lo, hi] = span(pool, 'complete100', (p) => p.n);
      return { ...t, n: int(rng, lo, hi) };
    }
    case 'placeValue': {
      const tens = int(rng, 0, 9);
      return { ...t, h: int(rng, 1, 5), t: tens, o: pick(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== tens)) };
    }
    case 'riddle': {
      const [h, tt, o] = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const order = pick(rng, [['o', 'h', 't'], ['t', 'o', 'h'], ['o', 't', 'h'], ['t', 'h', 'o']] as ('h' | 't' | 'o')[][]);
      return { ...t, h, t: tt, o, order };
    }
    case 'compare3': {
      const a = int(rng, 101, 989);
      const [ah, at, ao] = [Math.floor(a / 100), Math.floor(a / 10) % 10, a % 10];
      const b = pick(rng, [
        ao * 100 + at * 10 + ah, // те же цифры в другом порядке
        ah * 100 + ((at + 3) % 10) * 10 + ao, // те же сотни, другие десятки
        a, // поровну
        Math.min(999, a + int(rng, 1, 9) * 100) - 0,
      ]);
      return { ...t, a, b: b < 100 ? b + 100 : b };
    }
    case 'openLine': {
      const a = pick(rng, Array.from({ length: 59 }, (_, i) => i + 11).filter((x) => x % 10 !== 0));
      const b = pick(rng, Array.from({ length: 19 }, (_, i) => i + 11).filter((x) => x % 10 !== 0 && a + x <= 99));
      return { ...t, a, b };
    }
    case 'bar': {
      const [, hi] = span(pool, 'bar', (p) => p.a + p.b);
      const a = int(rng, 8, Math.floor(hi / 2));
      const b = int(rng, 8, hi - a);
      return { ...t, story: pick(rng, ['shelf', 'aquarium', 'garden'] as const), a, b };
    }
    case 'symmetry':
      return { ...t, half: symmetryHalf(rng), shift: int(rng, 0, 2) };
    case 'clock':
      return { ...t, h: int(rng, 1, 12), m: pick(rng, [0, 30] as const) };
    case 'week':
      return { ...t, day: int(rng, 0, 6), dir: pick(rng, [1, -1] as const) };
    case 'unitPick':
      return { ...t, thing: pick(rng, THINGS) };
  }
}

export const GROUP_ICONS = Object.values(GROUP_HOLDER).flatMap((g) => [g.item, g.holder]).filter((x) => x !== 'plate');
export const MORE_ICONS = [
  ...TOYS.map((x) => x.toy), ...THINGS.map((x) => MEASURE_THINGS[x].icon), ...GROUP_ICONS,
  '1F4CF', '1FAA3', '2696', '1F438', '1F4CE', '270F', '1F98B', '1F4DA', '1F41F', '1F955',
];
