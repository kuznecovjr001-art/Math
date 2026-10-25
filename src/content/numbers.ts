/**
 * Задания островов 3–4 и острова сотен по учебникам NCERT (Joyful Mathematics 1, Maths Mela 3):
 * бусы и сотенная таблица, монеты, данные, деление по группам, прыжки, доли, мерки,
 * сотни-десятки-единицы, открытая числовая прямая, схема-полоска, симметрия, часы и единицы.
 * Здесь типы карточек, тексты заданий, правильные ответы и варианты ответов.
 */
import { ITEMS, type ItemId } from './missions';
import { count, plural } from './words';

export type FracAsk = 'half' | 'quarter' | 'threeQuarters';
export interface FracShape { shape: 'circle' | 'rect'; parts: 2 | 4; shaded: number; equal: boolean }
export type BarStory = 'shelf' | 'aquarium' | 'garden';
export type Measurable = 'rope' | 'milk' | 'watermelon' | 'ribbon' | 'bucket' | 'apples' | 'scarf' | 'bath' | 'potatoes';
export type MeasureUnit = 'm' | 'l' | 'kg';

export type MoreParams =
  | { kind: 'beads100'; n: number }
  | { kind: 'chart100'; missing: number }
  | { kind: 'coins'; price: number; toy: string; name: string }
  | { kind: 'tally'; counts: [ItemId, number][]; ask: 'most' | ItemId }
  | { kind: 'groupsOf'; total: number; size: 2 | 3 | 4 }
  | { kind: 'jumps'; step: number; count: number }
  | { kind: 'fraction'; ask: FracAsk; options: FracShape[] }
  | { kind: 'units'; len: number; unit: 'clip' | 'pencil' }
  | { kind: 'complete100'; n: number }
  | { kind: 'placeValue'; h: number; t: number; o: number }
  | { kind: 'riddle'; h: number; t: number; o: number; order: ('h' | 't' | 'o')[] }
  | { kind: 'compare3'; a: number; b: number }
  | { kind: 'openLine'; a: number; b: number }
  | { kind: 'bar'; story: BarStory; a: number; b: number; find: 'part' | 'whole' }
  | { kind: 'symmetry'; half: string[]; shift: number }
  | { kind: 'clock'; h: number; m: 0 | 30 }
  | { kind: 'week'; day: number; dir: 1 | -1 }
  | { kind: 'unitPick'; thing: Measurable };

export type MoreKind = MoreParams['kind'];
export function isMore(p: { kind: string }): p is MoreParams {
  return (MORE_KINDS as string[]).includes(p.kind);
}
export const MORE_KINDS: MoreKind[] = [
  'beads100', 'chart100', 'coins', 'tally', 'groupsOf', 'jumps', 'fraction', 'units', 'complete100',
  'placeValue', 'riddle', 'compare3', 'openLine', 'bar', 'symmetry', 'clock', 'week', 'unitPick',
];

export const COINS = [1, 2, 5, 10];

/** Чем держим группу: 2 колеса — велосипед, 3 печенья — тарелка, 4 колеса — машина. */
export const GROUP_HOLDER: Record<2 | 3 | 4, { item: string; holder: string; itemForms: [string, string, string]; holderForms: [string, string, string] }> = {
  2: { item: '1F6DE', holder: '1F6B2', itemForms: ['колесо', 'колеса', 'колёс'], holderForms: ['велосипед', 'велосипеда', 'велосипедов'] },
  3: { item: '1F36A', holder: 'plate', itemForms: ['печенье', 'печенья', 'печений'], holderForms: ['тарелку', 'тарелки', 'тарелок'] },
  4: { item: '1F6DE', holder: '1F697', itemForms: ['колесо', 'колеса', 'колёс'], holderForms: ['машину', 'машины', 'машин'] },
};

export const FRAC_TEXT: Record<FracAsk, string> = { half: 'половина', quarter: 'четверть', threeQuarters: 'три четверти' };
const FRAC_VALUE: Record<FracAsk, [number, number]> = { half: [1, 2], quarter: [1, 4], threeQuarters: [3, 4] };

export const BAR_STORY: Record<BarStory, { icon: string; whole: (n: number) => string; part: [string, string]; unit: [string, string, string] }> = {
  shelf: { icon: '1F4DA', whole: (n) => `На двух полках ${count(n, 'книга', 'книги', 'книг')}`, part: ['на верхней', 'на нижней'], unit: ['книга', 'книги', 'книг'] },
  aquarium: { icon: '1F41F', whole: (n) => `В двух аквариумах ${count(n, 'рыбка', 'рыбки', 'рыбок')}`, part: ['в первом', 'во втором'], unit: ['рыбка', 'рыбки', 'рыбок'] },
  garden: { icon: '1F955', whole: (n) => `На двух грядках ${count(n, 'морковка', 'морковки', 'морковок')}`, part: ['на первой', 'на второй'], unit: ['морковка', 'морковки', 'морковок'] },
};

export const MEASURE_THINGS: Record<Measurable, { icon: string; text: string; unit: MeasureUnit }> = {
  rope: { icon: '1FAA2', text: 'какой длины верёвка', unit: 'm' },
  ribbon: { icon: '1F380', text: 'какой длины лента', unit: 'm' },
  milk: { icon: '1F95B', text: 'сколько молока в кувшине', unit: 'l' },
  bucket: { icon: '1FAA3', text: 'сколько воды в ведре', unit: 'l' },
  watermelon: { icon: '1F349', text: 'сколько весит арбуз', unit: 'kg' },
  apples: { icon: '1F34E', text: 'сколько весит пакет яблок', unit: 'kg' },
  scarf: { icon: '1F9E3', text: 'какой длины шарф', unit: 'm' },
  bath: { icon: '1F6C1', text: 'сколько воды в ванне', unit: 'l' },
  potatoes: { icon: '1F954', text: 'сколько весит мешок картошки', unit: 'kg' },
};
export const UNITS: { id: MeasureUnit; name: string; icon: string }[] = [
  { id: 'm', name: 'метр', icon: '1F4CF' },
  { id: 'l', name: 'литр', icon: '1FAA3' },
  { id: 'kg', name: 'килограмм', icon: '2696' },
];

export const WEEK = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
/** «После среды», «перед средой»: родительный и творительный падеж дней недели. */
const WEEK_AFTER = ['понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы', 'воскресенья'];
const WEEK_BEFORE = ['понедельником', 'вторником', 'средой', 'четвергом', 'пятницей', 'субботой', 'воскресеньем'];

const PLACE_NAME = {
  h: (n: number) => count(n, 'сотня', 'сотни', 'сотен'),
  t: (n: number) => count(n, 'десяток', 'десятка', 'десятков'),
  o: (n: number) => count(n, 'единица', 'единицы', 'единиц'),
};

export function instructionMore(p: MoreParams): string {
  switch (p.kind) {
    case 'beads100': return 'Какое число отмечено прищепкой? Считай десятками.';
    case 'chart100': return 'Какое число спряталось в таблице?';
    case 'coins': return `${p.name[0].toUpperCase()}${p.name.slice(1)} стоит ${count(p.price, 'рубль', 'рубля', 'рублей')}. Положи монеты и заплати ровно столько.`;
    case 'tally':
      return p.ask === 'most'
        ? 'Каких фруктов больше всего? Можно посчитать каждый вид.'
        : `Сколько здесь ${ITEMS[p.ask].forms[2]}?`;
    case 'groupsOf': {
      const g = GROUP_HOLDER[p.size];
      return p.size === 3
        ? `Есть ${count(p.total, ...g.itemForms)}. На каждую тарелку кладём по 3. Сколько тарелок понадобится?`
        : `Есть ${count(p.total, ...g.itemForms)}. ${p.size === 2 ? 'Велосипеду' : 'Машине'} нужно ${count(p.size, ...g.itemForms)}. Сколько ${g.holderForms[2]} получится?`;
    }
    case 'jumps': return `Лягушка прыгает от нуля ${p.count} ${plural(p.count, 'раз', 'раза', 'раз')} по ${p.step}. Где она окажется?`;
    case 'fraction': return `Где закрашена ${FRAC_TEXT[p.ask]}?`;
    case 'units': return p.unit === 'clip' ? 'Сколько скрепок помещается вдоль ленты?' : 'Сколько карандашей помещается вдоль ленты?';
    case 'complete100': return `Закрашено ${p.n}. Сколько клеток не хватает до 100?`;
    case 'placeValue': return 'Какое число собрано из блоков?';
    case 'riddle': return `Я задумал число: ${p.order.map((k) => PLACE_NAME[k](p[k])).join(', ')}. Какое это число?`;
    case 'compare3': return `Сравни числа ${p.a} и ${p.b}. Какой знак поставить?`;
    case 'openLine': return `Сколько будет ${p.a} + ${p.b}? Прыгай по числовой прямой: сначала десятками, потом единицами.`;
    case 'bar': {
      const s = BAR_STORY[p.story];
      return p.find === 'part'
        ? `${s.whole(p.a + p.b)}. ${s.part[0][0].toUpperCase()}${s.part[0].slice(1)} ${p.a}. Сколько ${s.part[1]}?`
        : `${s.part[0][0].toUpperCase()}${s.part[0].slice(1)} ${p.a}, ${s.part[1]} ${p.b}. Сколько всего ${s.unit[2]}?`;
    }
    case 'symmetry': return 'Какая половина дорисует узор так, чтобы он стал симметричным, как бабочка?';
    case 'clock': return 'Сколько времени показывают часы?';
    case 'week': return p.dir === 1 ? `Какой день идёт после ${WEEK_AFTER[p.day]}?` : `Какой день идёт перед ${WEEK_BEFORE[p.day]}?`;
    case 'unitPick': return `Чем удобнее измерить, ${MEASURE_THINGS[p.thing].text}?`;
  }
}

/** Части узора: строки из «0» и «1», левая половина. Вторая половина — её зеркало. */
export function mirror(half: string[]): string[] {
  return half.map((r) => [...r].reverse().join(''));
}

/** Три варианта правой половины: зеркало, простой сдвиг (частая ошибка) и чужой узор. Правильный не всегда первый. */
export function symmetryOptions(p: { half: string[]; shift: number }): string[][] {
  const right = mirror(p.half);
  const copy = p.half;
  const other = right.map((r, i) => (i % 2 ? r : [...r].map((c) => (c === '1' ? '0' : '1')).join('')));
  const opts = [right, copy, other];
  const k = p.shift % 3;
  return opts.slice(k).concat(opts.slice(0, k));
}

export function fracValue(f: FracShape): [number, number] { return [f.shaded, f.parts]; }

export function fractionAnswer(p: { ask: FracAsk; options: FracShape[] }): number {
  const [a, b] = FRAC_VALUE[p.ask];
  return p.options.findIndex((f) => f.equal && f.shaded * b === a * f.parts);
}

/** Время словами для кнопки: 3:00, 3:30. */
export const clockText = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

/** Варианты времени: верное, перепутанные стрелки и частая ошибка «на час вперёд» у половины часа. */
export function clockChoices(p: { h: number; m: 0 | 30 }): string[] {
  const right = clockText(p.h, p.m);
  const next = p.h === 12 ? 1 : p.h + 1;
  // Перепутанные стрелки: минутная читается как часы, часовая как минуты.
  const swapped = p.m === 0 ? clockText(12, (p.h % 12) * 5) : clockText(6, (p.h % 12) * 5);
  const wrong = p.m === 30 ? [clockText(next, 30), swapped] : [swapped, clockText(p.h, 30)];
  const all = [...new Set([right, ...wrong])];
  if (all.length < 3) all.push(clockText(next, p.m));
  const k = p.h % 3;
  return all.slice(k).concat(all.slice(0, k));
}

export function weekAnswer(p: { day: number; dir: 1 | -1 }): number {
  return (p.day + p.dir + 7) % 7;
}

export function weekChoices(p: { day: number; dir: 1 | -1 }): number[] {
  const right = weekAnswer(p);
  const back = (p.day - p.dir + 7) % 7; // день с другой стороны — частая ошибка
  const skip = (p.day + 2 * p.dir + 7) % 7;
  const all = [right, back, skip];
  const k = p.day % 3;
  return all.slice(k).concat(all.slice(0, k));
}

/** Числа из тех же цифр в другом порядке: ловят ошибку «записал, как услышал». */
export function placeChoices(h: number, t: number, o: number): number[] {
  const right = h * 100 + t * 10 + o;
  const set = new Set([right, h * 100 + o * 10 + t, t * 100 + h * 10 + o, o * 100 + t * 10 + h, right + 10, right - 1]);
  set.delete(right);
  const wrong = [...set].filter((x) => x > 0 && x < 1000).slice(0, 2);
  const all = [right, ...wrong];
  const k = (h + t + o) % 3;
  return all.slice(k).concat(all.slice(0, k));
}

export function riddleChoices(p: { h: number; t: number; o: number; order: ('h' | 't' | 'o')[] }): number[] {
  // Ошибка «записал цифры в том порядке, как прозвучали» — главный неверный вариант.
  const heard = Number(p.order.map((k) => p[k]).join(''));
  const right = p.h * 100 + p.t * 10 + p.o;
  const set = new Set([right, heard, p.h * 100 + p.o * 10 + p.t, right + 100, right - 10]);
  set.delete(right);
  const wrong = [...set].filter((x) => x > 0 && x < 1000).slice(0, 2);
  const all = [right, ...wrong];
  const k = right % 3;
  return all.slice(k).concat(all.slice(0, k));
}

/** Три варианта числа с ошибками на десяток и на единицу. */
export function tenChoices(answer: number, min = 0, max = 1000): number[] {
  const set = new Set([answer]);
  for (const d of [10, -10, 1, -1]) {
    if (set.size >= 3) break;
    if (answer + d >= min && answer + d <= max) set.add(answer + d);
  }
  const arr = [...set].sort((a, b) => a - b);
  const k = answer % 3;
  return arr.slice(k).concat(arr.slice(0, k));
}

/** Знаки сравнения в порядке кнопок. */
export const SIGNS = ['<', '=', '>'];

export function tallyAnswer(p: { counts: [ItemId, number][]; ask: 'most' | ItemId }): number {
  if (p.ask === 'most') {
    const max = Math.max(...p.counts.map(([, n]) => n));
    return p.counts.findIndex(([, n]) => n === max);
  }
  return p.counts.find(([id]) => id === p.ask)![1];
}

export function answerMore(p: MoreParams): number {
  switch (p.kind) {
    case 'beads100': return p.n;
    case 'chart100': return p.missing;
    case 'coins': return p.price;
    case 'tally': return tallyAnswer(p);
    case 'groupsOf': return p.total / p.size;
    case 'jumps': return p.step * p.count;
    case 'fraction': return fractionAnswer(p);
    case 'units': return p.len;
    case 'complete100': return 100 - p.n;
    case 'placeValue': return p.h * 100 + p.t * 10 + p.o;
    case 'riddle': return p.h * 100 + p.t * 10 + p.o;
    case 'compare3': return SIGNS.indexOf(p.a < p.b ? '<' : p.a > p.b ? '>' : '=');
    case 'openLine': return p.a + p.b;
    case 'bar': return p.find === 'part' ? p.b : p.a + p.b;
    case 'symmetry': return symmetryOptions(p).findIndex((o) => o.join() === mirror(p.half).join());
    case 'clock': return clockChoices(p).indexOf(clockText(p.h, p.m));
    case 'week': return weekAnswer(p);
    case 'unitPick': return UNITS.findIndex((u) => u.id === MEASURE_THINGS[p.thing].unit);
  }
}
