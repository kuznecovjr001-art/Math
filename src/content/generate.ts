import { varyMore, MORE_ICONS } from './generateMore';
import { int, pick, shuffle, type Rng } from './rng';
import { isMore } from './numbers';
import { count, plural } from './words';
import {
  ITEMS, type Bead, type CardParams, type DayEvent, type ItemId, type Shape, type SortBin, type SortItem, type Thing,
} from './missions';

/**
 * Генерация карточек: миссия длиннее, а при каждом входе числа и предметы новые.
 * Новая карточка строится по образцу авторской того же вида, а числа берутся
 * из диапазона авторских карточек миссии — так сложность не растёт сама собой.
 */

export { int, pick, seededRng, shuffle, type Rng } from './rng';

/** Наименьшее и наибольшее значение поля среди карточек того же вида. */
function span<K extends CardParams['kind']>(
  pool: CardParams[], kind: K, f: (p: Extract<CardParams, { kind: K }>) => number,
): [number, number] {
  const vs = pool.filter((p): p is Extract<CardParams, { kind: K }> => p.kind === kind).map(f);
  return [Math.min(...vs), Math.max(...vs)];
}

const FRUITS: ItemId[] = ['apple', 'pear', 'strawberry', 'tangerine', 'carrot', 'cookie'];
const COUNTABLE: ItemId[] = ['apple', 'pear', 'strawberry', 'carrot', 'fish', 'balloon', 'ball', 'chick', 'cookie'];
const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'pentagon'];
const TURNS = [0, 30, 40, 60, 72, 90];
const BEADS: Bead[] = ['red', 'blue', 'yellow', 'green'];

/** Корзины для сортировки: по три-четыре предмета каждой группы. */
const SORT_GROUPS: { bin: SortBin; items: Omit<SortItem, 'bin'>[] }[] = [
  {
    bin: { title: 'Еда', icon: '1F37D' },
    items: [
      { icon: '1F34E', name: 'яблоко' }, { icon: '1F350', name: 'груша' }, { icon: '1F955', name: 'морковка' },
      { icon: '1F36A', name: 'печенье' }, { icon: '1F353', name: 'ягода' }, { icon: '1F34A', name: 'мандарин' },
    ],
  },
  {
    bin: { title: 'Игрушки', icon: '1F9F8' },
    items: [
      { icon: '26BD', name: 'мяч' }, { icon: '1F388', name: 'шарик' }, { icon: '1F697', name: 'машинка' },
      { icon: '1F9F8', name: 'мишка-игрушка' },
    ],
  },
  {
    bin: { title: 'Животные', icon: '1F431' },
    items: [
      { icon: '1F418', name: 'слон' }, { icon: '1F424', name: 'цыплёнок' }, { icon: '1F42D', name: 'мышка' },
      { icon: '1F436', name: 'собака' }, { icon: '1F41F', name: 'рыбка' }, { icon: '1F430', name: 'кролик' },
    ],
  },
];

/** Предметы для весов: вес условный, важен только порядок. */
const WEIGHTS: Required<Pick<Thing, 'icon' | 'name' | 'weight'>>[] = [
  { icon: '1FAB6', name: 'перо', weight: 1 },
  { icon: '1F388', name: 'шарик', weight: 1 },
  { icon: '270F', name: 'карандаш', weight: 2 },
  { icon: '1F34E', name: 'яблоко', weight: 2 },
  { icon: '1F9F8', name: 'мишка', weight: 3 },
  { icon: '1FAA8', name: 'камень', weight: 5 },
  { icon: '1F418', name: 'слон', weight: 9 },
];

/** События дня по порядку: утро, день, вечер, ночь. */
const DAY_PARTS: DayEvent[][] = [
  [{ icon: '1F305', name: 'просыпаемся' }, { icon: '1FAA5', name: 'чистим зубы утром' }],
  [{ icon: '1F3EB', name: 'идём в садик' }, { icon: '1F37D', name: 'обедаем' }],
  [{ icon: '1F319', name: 'наступает вечер' }, { icon: '1F319', name: 'смотрим на луну' }],
  [{ icon: '1F6CF', name: 'ложимся спать' }],
];

/** Сюжеты задач S01: числа меняются, смысл действия — нет. */
function story(rng: Rng, kind: 'add' | 'sub' | 'mul' | 'div'): Extract<CardParams, { kind: 'story' }> {
  const arrange = (right: string, wrong: string[]) => {
    const ops = shuffle(rng, [right, ...wrong]);
    return { ops, op: ops.indexOf(right) };
  };
  switch (kind) {
    case 'add': {
      const a = int(rng, 5, 9);
      const b = int(rng, 3, 9);
      return {
        kind: 'story',
        text: `В вазе ${a} красных и ${b} жёлтых ${plural(b, 'тюльпан', 'тюльпана', 'тюльпанов')}. Сколько всего тюльпанов?`,
        ...arrange(`${a} + ${b}`, [`${Math.max(a, b)} − ${Math.min(a, b)}`]),
        answer: a + b,
      };
    }
    case 'sub': {
      const a = int(rng, 11, 18);
      const b = int(rng, 3, 9);
      return {
        kind: 'story',
        text: `В автобусе было ${count(a, 'пассажир', 'пассажира', 'пассажиров')}. ${b} вышли. Сколько осталось?`,
        ...arrange(`${a} − ${b}`, [`${a} + ${b}`]),
        answer: a - b,
      };
    }
    case 'mul': {
      const g = int(rng, 2, 6);
      const per = int(rng, 3, 8);
      return {
        kind: 'story',
        text: `В ${g} коробках по ${count(per, 'карандашу', 'карандаша', 'карандашей')}. Сколько всего карандашей?`,
        ...arrange(`${per} × ${g}`, [`${per} + ${g}`, `${per} − ${g}`]),
        answer: per * g,
      };
    }
    case 'div': {
      const g = int(rng, 2, 5);
      const per = int(rng, 2, 6);
      const n = g * per;
      return {
        kind: 'story',
        text: `Маша разложила ${count(n, 'конфету', 'конфеты', 'конфет')} поровну на ${count(g, 'тарелку', 'тарелки', 'тарелок')}. Сколько конфет на каждой тарелке?`,
        ...arrange(`${n} : ${g}`, [`${n} − ${g}`, `${n} + ${g}`]),
        answer: per,
      };
    }
  }
}

function storyKind(p: Extract<CardParams, { kind: 'story' }>): 'add' | 'sub' | 'mul' | 'div' {
  const right = p.ops[p.op];
  if (right.includes(':')) return 'div';
  if (right.includes('×')) return 'mul';
  if (right.includes('−')) return 'sub';
  return 'add';
}

/**
 * Новая карточка того же вида, что и образец.
 * pool — все авторские карточки миссии: из них берутся диапазоны чисел.
 */
export function varyCard(t: CardParams, pool: CardParams[], rng: Rng): CardParams {
  if (isMore(t)) return varyMore(t, pool, rng);
  switch (t.kind) {
    case 'cups': {
      const [lo, hi] = span(pool, 'cups', (p) => p.receivers);
      const receivers = int(rng, Math.max(2, lo - 1), hi + 1);
      return { ...t, receivers, items: receivers + int(rng, 1, 3), scene: pick(rng, ['tea', 'table'] as const) };
    }
    case 'basket': {
      const [lo, hi] = span(pool, 'basket', (p) => p.target);
      const target = int(rng, lo, hi);
      return { ...t, target, stock: target + (t.stock - t.target), fruit: pick(rng, FRUITS) };
    }
    case 'count': {
      const [lo, hi] = span(pool, 'count', (p) => p.n);
      return { ...t, n: int(rng, Math.max(1, lo - 1), hi + 1), item: pick(rng, COUNTABLE) };
    }
    case 'compare': {
      const [lo, hi] = span(pool, 'compare', (p) => Math.max(p.top, p.bottom));
      const top = int(rng, Math.max(2, lo - 1), hi);
      // Каждая третья карточка — «поровну», чтобы этот ответ не забывался.
      const bottom = rng() < 0.33 ? top : pick(rng, [top - 1, top + 1].filter((x) => x >= 2 && x <= hi));
      return { ...t, top, bottom, item: pick(rng, COUNTABLE), spreadTop: rng() < 0.5 };
    }
    case 'seats': {
      const [lo, hi] = span(pool, 'seats', (p) => p.total);
      const total = int(rng, lo, hi);
      return { ...t, total, taken: int(rng, 1, total - 1) };
    }
    case 'hidden': {
      const [lo, hi] = span(pool, 'hidden', (p) => p.total);
      const total = int(rng, lo, hi);
      return { ...t, total, visible: int(rng, 1, total - 1), item: pick(rng, FRUITS) };
    }
    case 'parcels': {
      const [, hi] = span(pool, 'parcels', (p) => (p.op === 'add' ? p.start + p.change : p.start));
      if (t.op === 'add') {
        const sum = int(rng, 3, hi);
        const change = int(rng, 1, Math.min(3, sum - 1));
        return { ...t, start: sum - change, change };
      }
      const start = int(rng, 3, hi);
      return { ...t, start, change: int(rng, 1, Math.min(3, start - 1)) };
    }
    case 'shapes': {
      const target = pick(rng, SHAPES);
      const others = shuffle(rng, SHAPES.filter((s) => s !== target)).slice(0, 2);
      return { ...t, target, options: shuffle(rng, [target, ...others]), turn: pick(rng, TURNS) };
    }
    case 'tenframe': {
      if (t.b === 0) return { ...t, a: int(rng, 1, 9) };
      const [, maxSum] = span(pool, 'tenframe', (p) => p.a + p.b);
      const a = int(rng, 6, 9);
      return { ...t, a, b: int(rng, 11 - a, Math.min(9, maxSum - a)) };
    }
    case 'tens': {
      const [, hi] = span(pool, 'tens', (p) => p.tens);
      return { ...t, tens: int(rng, 1, hi), ones: int(rng, 0, 9) };
    }
    case 'boxes': {
      const [, maxTotal] = span(pool, 'boxes', (p) => p.groups * p.per);
      let groups = 2;
      let per = 2;
      do {
        groups = int(rng, 2, 4);
        per = int(rng, 2, 4);
      } while (groups * per > maxTotal);
      const stock = t.share ? groups * per : groups * per + 2;
      return { ...t, groups, per, stock, fruit: pick(rng, FRUITS) };
    }
    case 'record': {
      const [, maxTotal] = span(pool, 'record', (p) => p.groups * p.per);
      let per = 2;
      let groups = 2;
      do {
        per = int(rng, 2, 4);
        groups = int(rng, 2, 4);
      } while (per * groups > maxTotal);
      return { ...t, per, groups, item: pick(rng, FRUITS) };
    }
    case 'array': {
      const [, maxTotal] = span(pool, 'array', (p) => p.rows * p.cols);
      const rows = int(rng, 2, 4);
      const cols = pick(rng, [2, 3, 4, 5].filter((c) => c !== rows && rows * c <= maxTotal));
      return { ...t, rows, cols };
    }
    case 'facts': {
      const as = [...new Set(pool.filter((p) => p.kind === 'facts').map((p) => (p as { a: number }).a))];
      return { ...t, a: pick(rng, as), b: int(rng, 2, 9) };
    }
    case 'story':
      return story(rng, storyKind(t));
    case 'position':
      return { ...t, where: pick(rng, ['on', 'under', 'in', 'next'] as const) };
    case 'sort': {
      const [g0, g1] = shuffle(rng, SORT_GROUPS);
      const items = [
        ...shuffle(rng, g0.items).slice(0, 3).map((x) => ({ ...x, bin: 0 as const })),
        ...shuffle(rng, g1.items).slice(0, 3).map((x) => ({ ...x, bin: 1 as const })),
      ];
      return { ...t, bins: [g0.bin, g1.bin], items: shuffle(rng, items) };
    }
    case 'pattern': {
      const len = t.unit.length;
      const colors = shuffle(rng, BEADS);
      // Узор из двух или трёх бусин; в трёхбусинном может быть повтор (красная, красная, синяя).
      const unit: Bead[] = len === 2
        ? [colors[0], colors[1]]
        : pick(rng, [[colors[0], colors[1], colors[2]], [colors[0], colors[0], colors[1]], [colors[0], colors[1], colors[1]]]);
      return { ...t, unit, shown: int(rng, len + 2, 7) };
    }
    case 'flash': {
      const [lo, hi] = span(pool, 'flash', (p) => p.n);
      const n = int(rng, lo, hi);
      return { ...t, n, layout: n > 6 ? 'frame' : pick(rng, ['dice', 'dice', 'frame'] as const) };
    }
    case 'zero': {
      const [, hi] = span(pool, 'zero', (p) => p.start);
      const start = int(rng, 2, hi);
      // Ноль в ответе примерно в каждой второй карточке: это главное в миссии.
      return { ...t, start, lose: rng() < 0.5 ? start : int(rng, 1, start - 1) };
    }
    case 'fingers':
      return { ...t, up: int(rng, 1, t.total - 1) };
    case 'measure': {
      if (t.a.len !== undefined) {
        const long = int(rng, 5, 7);
        const short = int(rng, 3, long - 2);
        // Короткую ленту сдвигаем вправо: на глаз её конец дальше.
        const shortThing = { len: short, shift: long - short + 1 };
        const longThing = { len: long, shift: 0 };
        const longFirst = rng() < 0.5;
        return {
          ...t,
          attr: pick(rng, ['longer', 'shorter'] as const),
          a: longFirst ? longThing : shortThing,
          b: longFirst ? shortThing : longThing,
        };
      }
      const [x, y] = shuffle(rng, WEIGHTS);
      const b = x.weight === y.weight ? WEIGHTS.find((w) => w.weight !== x.weight)! : y;
      return { ...t, attr: pick(rng, ['heavier', 'lighter'] as const), a: x, b };
    }
    case 'order': {
      const parts = t.events.length >= 4 ? [0, 1, 2, 3] : pick(rng, [[0, 1, 2], [0, 1, 3]]);
      return { ...t, events: parts.map((i) => pick(rng, DAY_PARTS[i])) };
    }
  }
}

const keyOf = (p: CardParams) => JSON.stringify(p);

/**
 * Дополняет авторские карточки сгенерированными до нужного числа.
 * Образцы идут по кругу, чтобы в миссии с двумя видами заданий были оба.
 * Повторов внутри одного захода нет (если хватает вариантов).
 */
export function extendCards(
  authored: CardParams[], templates: CardParams[], pool: CardParams[], total: number, rng: Rng,
  seen: Set<string> = new Set(),
): CardParams[] {
  const out = [...authored];
  authored.forEach((p) => seen.add(keyOf(p)));
  for (let i = 0; out.length < total; i++) {
    const t = templates[i % templates.length];
    let card = varyCard(t, pool, rng);
    for (let tries = 0; tries < 40 && seen.has(keyOf(card)); tries++) card = varyCard(t, pool, rng);
    // Если вариантов мало, повтор возможен, но не подряд.
    const last = out.length ? keyOf(out[out.length - 1]) : '';
    for (let tries = 0; tries < 20 && keyOf(card) === last; tries++) card = varyCard(t, pool, rng);
    seen.add(keyOf(card));
    out.push(card);
  }
  return out;
}

/** Предметы, которые знает генератор (для проверки картинок в тестах). */
export const GENERATOR_ICONS = [
  ...SORT_GROUPS.flatMap((g) => [g.bin.icon, ...g.items.map((x) => x.icon)]),
  ...WEIGHTS.map((w) => w.icon),
  ...DAY_PARTS.flat().map((e) => e.icon),
  ...COUNTABLE.map((id) => ITEMS[id].img),
  ...MORE_ICONS,
];
